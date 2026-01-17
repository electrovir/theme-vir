import {assert, assertWrap, check} from '@augment-vir/assert';
import {
    crossProduct,
    filterMap,
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
import {defineColorThemeOverride} from './color-theme-override.js';
import {
    defineColorTheme,
    noRefColorInitToString,
    type ColorInit,
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
export const defaultContrastLevels: Readonly<ArrayOrSelectParam<ContrastLevelName>> = {
    [ContrastLevelName.BodyText]: true,
    [ContrastLevelName.NonBodyText]: true,
    [ContrastLevelName.Header]: true,
    [ContrastLevelName.Placeholder]: true,
    [ContrastLevelName.Decoration]: true,
};

/**
 * Options for {@link buildColorTheme}.
 *
 * @category Internal
 */
export type BuildLowLevelColorThemeOptions = PartialWithUndefined<{
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
    }: Readonly<BuildLowLevelColorThemeOptions> = {},
) {
    const contrastLevels = extractParam<ContrastLevelName>(crossContrastLevels, {
        mapFrom: contrastLevelLabel,
    });
    const colorGroups = groupColors(colorPalette, omittedColorValues);
    const defaultTheme = {
        background: 'white',
        foreground: 'black',
    };

    const lightThemeColors: Record<CssVarName, ColorInit> = {};
    const darkThemeOverrides: Record<CssVarName, ColorInit> = {};

    Object.entries(colorGroups).forEach(
        ([
            colorGroupName,
            colors,
        ]) => {
            assert.isLengthAtLeast(colors, 1);
            const colorStrings: string[] = colors.map((color) => color.definition.default);
            const allCrosses = crossProduct({
                crossWith: [
                    'color-in-foreground-light-mode',
                    'color-in-background-light-mode',
                    'color-in-foreground-dark-mode',
                    'color-in-background-dark-mode',
                    'color-on-self-dark-mode',
                    'color-on-self-light-mode',
                ],
                contrast: contrastLevels,
                // fontWeight: fontWeights,
            });
            const firstColor = colors[0];

            const defaultForegroundString: string = noRefColorInitToString(defaultTheme.foreground);
            const defaultBackgroundString: string = noRefColorInitToString(defaultTheme.background);

            const lightestSelf = findClosestColor('white', colorStrings);
            const darkestSelf = findClosestColor('black', colorStrings);

            allCrosses.forEach((cross) => {
                const comparison =
                    cross.crossWith === 'color-in-foreground-light-mode'
                        ? {
                              foreground: colorStrings,
                              background: defaultBackgroundString,
                          }
                        : cross.crossWith === 'color-in-background-light-mode'
                          ? {
                                foreground: defaultBackgroundString,
                                background: colorStrings,
                            }
                          : cross.crossWith === 'color-in-foreground-dark-mode'
                            ? {
                                  foreground: colorStrings,
                                  background: defaultForegroundString,
                              }
                            : cross.crossWith === 'color-in-background-dark-mode'
                              ? {
                                    foreground: defaultForegroundString,
                                    background: colorStrings,
                                }
                              : cross.crossWith === 'color-on-self-dark-mode'
                                ? {
                                      foreground: colorStrings,
                                      background: darkestSelf,
                                  }
                                : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                  cross.crossWith === 'color-on-self-light-mode'
                                  ? {
                                        foreground: colorStrings,
                                        background: lightestSelf,
                                    }
                                  : undefined;

                if (!comparison) {
                    throw new Error(`Forgot to handle crossWith: '${cross.crossWith}'`);
                }

                const matchedColorString = findColorAtContrastLevel(comparison, cross.contrast);
                const matchedColor = colors.find(
                    (color) => color.definition.default === matchedColorString,
                );

                if (!matchedColor) {
                    log.error(
                        `No valid '${colorGroupName}' color cross found for: ${stringify(cross)} with ${stringify(colorStrings)}`,
                    );
                    return undefined;
                }

                const colorValue = mapObjectValues(comparison, (key, value) => {
                    if (check.isString(value)) {
                        return value;
                    } else {
                        return matchedColor.definition.value;
                    }
                });

                if (cross.crossWith === 'color-in-foreground-light-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'foreground',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    lightThemeColors[name] = colorValue;
                } else if (cross.crossWith === 'color-in-background-light-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'background',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    lightThemeColors[name] = colorValue;
                } else if (cross.crossWith === 'color-on-self-light-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'on',
                        'self',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    lightThemeColors[name] = colorValue;
                } else if (cross.crossWith === 'color-in-foreground-dark-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'foreground',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    darkThemeOverrides[name] = colorValue;
                } else if (cross.crossWith === 'color-in-background-dark-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'background',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    darkThemeOverrides[name] = colorValue;
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                } else if (cross.crossWith === 'color-on-self-dark-mode') {
                    const name = [
                        firstColor.prefix,
                        firstColor.colorName,
                        'on',
                        'self',
                        cross.contrast,
                    ].join('-') as CssVarName;

                    darkThemeOverrides[name] = colorValue;
                } else {
                    assert.tsType(cross.crossWith).equals<never>();
                    throw new Error(`crossWith not handled: ${String(cross.crossWith)}`);
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
