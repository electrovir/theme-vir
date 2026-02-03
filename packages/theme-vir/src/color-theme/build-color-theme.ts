import {assert, assertWrap, check} from '@augment-vir/assert';
import {
    arrayToObject,
    crossProduct,
    filterMap,
    getEnumValues,
    getOrSet,
    log,
    mapObjectValues,
    removeDuplicates,
    stringify,
    type PartialWithUndefined,
    type RequiredAndNotNull,
} from '@augment-vir/common';
import {
    ContrastLevelName,
    contrastLevelLabel,
    findClosestColor,
    findColorAtContrastLevel,
} from '@electrovir/color';
import {type CssVarDefinitions, type CssVarName, type SingleCssVarDefinition} from 'lit-css-vars';
import {type ColorInit} from './color-theme-init.js';
import {defineColorThemeOverride} from './color-theme-override.js';
import {
    defineColorTheme,
    noRefColorInitToString,
    type DefaultColorThemeInit,
    type NoRefColorInit,
} from './color-theme.js';

/** @category Internal */
export type ColorPaletteVars = CssVarDefinitions<Record<`${string}-${string}-${number}`, any>>;

/** @category Internal */
export type PaletteColor = {
    suffix: string | undefined;
    prefix: string;
    colorName: string;
    definition: SingleCssVarDefinition;
    cssVarName: string;
};

/** @category Internal */
export type ColorGroups = Record<string, PaletteColor[]>;

/**
 * Black and white color values.
 *
 * @category Internal
 */
export const defaultOmittedColorGroupColorValues = [
    '#000000',
    '#ffffff',
    '#000',
    '#fff',
    'white',
    'black',
];

/** @category Internal */
export function groupColors(
    colors: Readonly<ColorPaletteVars>,
    /**
     * Color values to omit from the grouping. Defaults to
     * {@link defaultOmittedColorGroupColorValues}.
     *
     * @default defaultOmittedColorGroupColorValues
     */
    omittedColorValues: ReadonlyArray<string> = defaultOmittedColorGroupColorValues,
): ColorGroups {
    const colorGroups: ColorGroups = {};

    Object.values(colors).forEach((color) => {
        if (omittedColorValues.includes(color.default)) {
            return;
        }
        const paletteColor = extractPaletteColor(color);

        getOrSet(colorGroups, paletteColor.colorName, () => []).push(paletteColor);
    });

    return colorGroups;
}

/** @category Internal */
export function extractPaletteColor(color: Readonly<SingleCssVarDefinition>): PaletteColor {
    const split = String(color.name).replace(/^-+/, '').split('-');
    const suffix = split.length > 2 ? split.at(-1) : undefined;
    const prefix = assertWrap.isTruthy(split[0]);
    // eslint-disable-next-line sonarjs/argument-type
    const colorName = split.slice(1, suffix ? -1 : undefined).join('-');

    return {
        suffix,
        prefix,
        colorName,
        definition: color,
        cssVarName: String(color.name),
    };
}

/** @category Internal */
export function extractParam<const T extends PropertyKey>(
    possibleParams: ReadonlyArray<PropertyKey> | Readonly<Record<PropertyKey, boolean>>,
    {
        mapFrom,
        mapTo,
    }: Readonly<
        PartialWithUndefined<{
            mapTo: Record<string, T>;
            mapFrom: Record<T, any>;
        }>
    >,
): T[] {
    if (check.isArray(possibleParams)) {
        return removeDuplicates(
            possibleParams.map((param): T => {
                if (mapFrom && check.isKeyOf(param, mapFrom)) {
                    return param;
                } else if (mapTo && check.isKeyOf(param, mapTo) && mapTo[param] != undefined) {
                    return mapTo[param];
                } else {
                    throw new Error(`Unknown font weight: ${String(param)}`);
                }
            }),
        );
    } else {
        return extractParam(
            filterMap(
                Object.entries(possibleParams),
                ([
                    name,
                    enabled,
                ]) => {
                    if (enabled) {
                        /**
                         * This cast is okay because the recursive case (handling an array) will
                         * guard against bas names or weights.
                         */
                        return name;
                    } else {
                        return undefined;
                    }
                },
                check.isTruthy,
            ),
            {
                mapTo,
                mapFrom,
            },
        );
    }
}

/** @category Internal */
export type ArrayOrSelectParam<T extends PropertyKey> =
    | ReadonlyArray<T>
    | Readonly<Partial<Record<T, boolean>>>;

/** @category Internal */
export const defaultLightThemePair: RequiredAndNotNull<NoRefColorInit> = {
    background: 'white',
    foreground: 'black',
};

/** @category Internal */
export const defaultContrastLevels: Readonly<ArrayOrSelectParam<ContrastLevelName>> =
    getEnumValues(ContrastLevelName);

/**
 * Options for {@link buildColorTheme}.
 *
 * @category Internal
 */
export type BuildLowLevelColorThemeOptions = PartialWithUndefined<{
    /**
     * Theme var prefix.
     *
     * @default 'vir'
     */
    prefix: string;
    /**
     * The default theme colors for {@link defineColorTheme}. Defaults to
     * {@link defaultLightThemePair}.
     *
     * @default defaultLightThemePair
     */
    defaultTheme: RequiredAndNotNull<NoRefColorInit>;
    /**
     * All font weights to cross colors with. Defaults to {@link defaultContrastLevels}.
     *
     * @default defaultContrastLevels
     */
    crossContrastLevels: Readonly<ArrayOrSelectParam<ContrastLevelName>>;
    /**
     * Color values to omit from the grouping. Defaults to
     * {@link defaultOmittedColorGroupColorValues}.
     *
     * @default defaultOmittedColorGroupColorValues
     */
    omittedColorValues: ReadonlyArray<string>;
}>;

/**
 * Creates a color theme from a color palette.
 *
 * @category Color Theme
 */
export function buildColorTheme(
    colorPalette: Readonly<ColorPaletteVars>,
    {
        omittedColorValues = defaultOmittedColorGroupColorValues,
        crossContrastLevels = defaultContrastLevels,
        prefix = 'vir',
    }: Readonly<BuildLowLevelColorThemeOptions> = {},
) {
    const contrastLevels = extractParam<ContrastLevelName>(crossContrastLevels, {
        mapFrom: contrastLevelLabel,
    });
    const colorGroups = groupColors(colorPalette, omittedColorValues);
    const defaultTheme: Readonly<DefaultColorThemeInit> = {
        background: 'white',
        foreground: 'black',
        prefix,
    };

    const lightThemeColors: Record<CssVarName, ColorInit> = {};
    const darkThemeOverrides: Record<CssVarName, ColorInit> = {};

    // Compute these once outside the loop since they don't change
    const allCrosses = crossProduct({
        crossWith: [
            'color-in-foreground-light-mode',
            'color-in-foreground-dark-mode',
            'color-behind-bg-light-mode',
            'color-behind-bg-dark-mode',
            'color-behind-fg-light-mode',
            'color-behind-fg-dark-mode',
            'color-on-self-light-mode',
            'color-on-self-dark-mode',
        ],
        contrast: contrastLevels,
    });
    const defaultForegroundString: string = noRefColorInitToString(defaultTheme.foreground);
    const defaultBackgroundString: string = noRefColorInitToString(defaultTheme.background);

    Object.entries(colorGroups).forEach(
        ([
            colorGroupName,
            colors,
        ]) => {
            assert.isLengthAtLeast(colors, 1);
            const colorStrings: string[] = colors.map((color) => color.definition.default);
            const firstColor = colors[0];

            // Create an object for O(1) color lookup instead of O(n) find()
            const colorByDefault = arrayToObject(colors, (color) => ({
                key: color.definition.default,
                value: color,
            }));

            const lightestSelfString = findClosestColor('white', colorStrings);
            const darkestSelfString = findClosestColor('black', colorStrings);
            const lightestSelf = colorByDefault[lightestSelfString];
            const darkestSelf = colorByDefault[darkestSelfString];

            // Pre-compute base name parts that don't change per cross
            const baseNameParts = [
                prefix,
                firstColor.colorName,
            ];

            allCrosses.forEach((cross) => {
                const comparison =
                    cross.crossWith === 'color-in-foreground-light-mode'
                        ? {
                              foreground: colorStrings,
                              background: defaultBackgroundString,
                          }
                        : cross.crossWith === 'color-in-foreground-dark-mode'
                          ? {
                                foreground: colorStrings,
                                background: defaultForegroundString,
                            }
                          : cross.crossWith === 'color-on-self-dark-mode'
                            ? {
                                  foreground: colorStrings,
                                  background: darkestSelfString,
                              }
                            : cross.crossWith === 'color-on-self-light-mode'
                              ? {
                                    foreground: colorStrings,
                                    background: lightestSelfString,
                                }
                              : cross.crossWith === 'color-behind-bg-light-mode'
                                ? {
                                      foreground: defaultBackgroundString,
                                      background: colorStrings,
                                  }
                                : cross.crossWith === 'color-behind-bg-dark-mode'
                                  ? {
                                        foreground: defaultForegroundString,
                                        background: colorStrings,
                                    }
                                  : cross.crossWith === 'color-behind-fg-light-mode'
                                    ? {
                                          foreground: defaultForegroundString,
                                          background: colorStrings,
                                      }
                                    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                      cross.crossWith === 'color-behind-fg-dark-mode'
                                      ? {
                                            foreground: defaultBackgroundString,
                                            background: colorStrings,
                                        }
                                      : undefined;

                if (!comparison) {
                    throw new Error(`Forgot to handle crossWith: '${cross.crossWith}'`);
                }

                const matchedColorString = findColorAtContrastLevel(comparison, cross.contrast);
                const matchedColor = matchedColorString
                    ? colorByDefault[matchedColorString]
                    : undefined;

                if (!matchedColor) {
                    log.error(
                        `No valid '${colorGroupName}' color cross found for: ${stringify(cross)} with ${stringify(colorStrings)}`,
                    );
                    return undefined;
                }

                const isSelfContrast =
                    cross.crossWith === 'color-on-self-light-mode' ||
                    cross.crossWith === 'color-on-self-dark-mode';
                const isBehindBg =
                    cross.crossWith === 'color-behind-bg-light-mode' ||
                    cross.crossWith === 'color-behind-bg-dark-mode';
                const isBehindFg =
                    cross.crossWith === 'color-behind-fg-light-mode' ||
                    cross.crossWith === 'color-behind-fg-dark-mode';

                const colorValue = mapObjectValues(comparison, (key, value) => {
                    if (check.isString(value)) {
                        // For self-contrast modes, use the CSS var reference for the background
                        if (isSelfContrast && key === 'background') {
                            const selfColor =
                                cross.crossWith === 'color-on-self-light-mode'
                                    ? lightestSelf
                                    : darkestSelf;
                            return selfColor?.definition.value ?? value;
                        }
                        return value;
                    } else {
                        return matchedColor.definition.value;
                    }
                });

                const isLightMode =
                    cross.crossWith === 'color-in-foreground-light-mode' ||
                    cross.crossWith === 'color-on-self-light-mode' ||
                    cross.crossWith === 'color-behind-bg-light-mode' ||
                    cross.crossWith === 'color-behind-fg-light-mode';

                const nameSuffix = isSelfContrast
                    ? [
                          'on',
                          'self',
                          cross.contrast,
                      ]
                    : isBehindBg
                      ? [
                            'behind',
                            'bg',
                            cross.contrast,
                        ]
                      : isBehindFg
                        ? [
                              'behind',
                              'fg',
                              cross.contrast,
                          ]
                        : [
                              'foreground',
                              cross.contrast,
                          ];

                const name = [
                    ...baseNameParts,
                    ...nameSuffix,
                ].join('-') as CssVarName;

                if (isLightMode) {
                    lightThemeColors[name] = colorValue;
                } else {
                    darkThemeOverrides[name] = colorValue;
                }
            });
        },
    );

    const defaultLightTheme = defineColorTheme(defaultTheme, lightThemeColors);

    return {
        defaultLight: defaultLightTheme,
        darkOverride: defineColorThemeOverride(defaultLightTheme, 'dark', {
            defaultOverride: {
                background: 'black',
                foreground: 'white',
            },
            colorOverrides: darkThemeOverrides,
        }),
    };
}
