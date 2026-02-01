import {assert, check} from '@augment-vir/assert';
import {
    getObjectTypedEntries,
    getObjectTypedValues,
    log,
    type RequiredAndNotNull,
    type Values,
} from '@augment-vir/common';
import {CSSResult} from 'element-vir';
import {
    type CssVarName,
    type CssVarsSetup,
    defineCssVars,
    setCssVarValue,
    type SingleCssVarDefinition,
} from 'lit-css-vars';
import {type RequireAtLeastOne, type Writable} from 'type-fest';
import {
    type ColorInit,
    type ColorInitReference,
    type ColorInitValue,
    type ColorThemeInit,
    type ColorThemeOverride,
} from './color-theme-init.js';

/**
 * Same as {@link ColorInit} but without references.
 *
 * @category Internal
 */
export type NoRefColorInit = RequireAtLeastOne<{
    foreground: Exclude<ColorInitValue, ColorInitReference>;
    background: Exclude<ColorInitValue, ColorInitReference>;
}>;

/**
 * A defined individual color from a color theme.
 *
 * @category Internal
 */
export type ColorThemeColor<
    Init extends ColorInit = ColorInit,
    Name extends CssVarName = CssVarName,
> = {
    foreground: SingleCssVarDefinition;
    background: SingleCssVarDefinition;
    /**
     * The name of this theme color within the theme itself. (This is not any of the CSS variable
     * names.)
     */
    name: Name;
    init: Init;
};

/**
 * A finalized color theme, output from {@link defineColorTheme}.
 *
 * @category Internal
 */
export type ColorTheme<Init extends ColorThemeInit = ColorThemeInit> = {
    colors: AllColorThemeColors<Init>;
    inverse: AllColorThemeColors<Init>;
    /** The original init object for this theme. */
    init: {
        colors: Init;
        default: Readonly<DefaultColorThemeInit>;
    };
};

/**
 * All colors within a {@link ColorTheme}.
 *
 * @category Internal
 */
export type AllColorThemeColors<Init extends ColorThemeInit = ColorThemeInit> = {
    [ColorName in keyof Init as ColorName extends CssVarName
        ? ColorName
        : never]: ColorName extends CssVarName
        ? Init[ColorName] extends ColorInit
            ? ColorThemeColor<Init[ColorName], ColorName>
            : never
        : never;
} & {
    [themeDefaultKey]: ColorThemeColor<DefaultColorThemeInit, typeof themeDefaultKey>;
};

/** @category Internal */
export function noRefColorInitToString(init: Values<NoRefColorInit>): string {
    if (check.isPrimitive(init) || init instanceof CSSResult) {
        return String(init);
    } else {
        return init.default;
    }
}

/**
 * Handles a color init value.
 *
 * @category Internal
 */
export function createColorCssVarDefault(
    fromName: string,
    init: ColorInitValue,
    defaultInit: Readonly<DefaultColorThemeInit>,
    colorsInit: ColorThemeInit,
): string | number | CSSResult {
    const defaultForegroundKey = `${defaultInit.prefix}-default-fg`;
    const defaultBackgroundKey = `${defaultInit.prefix}-default-bg`;

    if (check.isPrimitive(init) || init instanceof CSSResult) {
        return init;
    } else if ('refDefaultBackground' in init) {
        return `var(--${defaultBackgroundKey}, ${noRefColorInitToString(defaultInit.background)})`;
    } else if ('refDefaultForeground' in init) {
        return `var(--${defaultForegroundKey}, ${noRefColorInitToString(defaultInit.foreground)})`;
    } else if ('refBackground' in init || 'refForeground' in init) {
        const referenceKey: keyof ColorInitReference | undefined = check.hasKey(
            init,
            'refBackground' satisfies keyof ColorInitReference,
        )
            ? 'refBackground'
            : check.hasKey(init, 'refForeground' satisfies keyof ColorInitReference)
              ? 'refForeground'
              : undefined;
        const reference =
            referenceKey && check.hasKey(init, referenceKey) ? init[referenceKey] : undefined;

        const layerKey = referenceKey === 'refBackground' ? 'background' : 'foreground';
        const referenced = reference && colorsInit[reference];
        if (!referenced) {
            throw new Error(
                `Color theme ${referenceKey} reference '${reference}' does not exist. (Referenced from '${fromName}'.)`,
            );
        }

        const colorValue =
            referenced[layerKey] ||
            (layerKey === 'foreground'
                ? createColorCssVarDefault(
                      defaultForegroundKey,
                      defaultInit.foreground,
                      defaultInit,
                      colorsInit,
                  )
                : createColorCssVarDefault(
                      defaultBackgroundKey,
                      defaultInit.background,
                      defaultInit,
                      colorsInit,
                  ));

        return `var(--${reference}-${layerKey === 'foreground' ? 'fg' : 'bg'}, ${createColorCssVarDefault(reference, colorValue, defaultInit, colorsInit)})`;
    } else {
        return init.value;
    }
}

/**
 * Default theme init for {@link defineColorTheme}.
 *
 * @category Internal
 */
export type DefaultColorThemeInit = RequiredAndNotNull<NoRefColorInit> & {
    prefix: string;
};

/**
 * Default foreground/background color theme used in {@link ColorTheme}. Do not define a theme color
 * with this name!
 *
 * @category Internal
 */
export const themeDefaultKey = 'theme-default' satisfies CssVarName;

/**
 * Set all color theme CSS vars on the given element. If no override is given, the theme color
 * default values are assigned.
 *
 * @category Color Theme
 */
export function applyColorTheme<const Theme extends ColorTheme>(
    /** This should usually be the top-level `html` element. */
    element: HTMLElement,
    fullTheme: Theme,
    themeOverride?: ColorThemeOverride | undefined,
) {
    getObjectTypedValues(fullTheme.colors as Record<CssVarName, ColorThemeColor>).forEach(
        (themeColor) => {
            applyIndividualThemeColorValue({
                element,
                layerKey: 'background',
                themeColor,
                themeOverride,
            });
            applyIndividualThemeColorValue({
                element,
                layerKey: 'foreground',
                themeColor,
                themeOverride,
            });
        },
    );
}

function applyIndividualThemeColorValue({
    element,
    layerKey,
    themeOverride,
    themeColor,
}: {
    element: HTMLElement;
    layerKey: keyof ColorInit;
    themeOverride: ColorThemeOverride | undefined;
    themeColor: ColorThemeColor;
}) {
    const override = themeOverride?.overrides[String(themeColor[layerKey].name) as CssVarName];
    const value: string | number = override || themeColor[layerKey].default;

    setCssVarValue({
        forCssVar: themeColor[layerKey],
        onElement: element,
        toValue: value,
    });
}

/**
 * Define a color theme.
 *
 * @category Color Theme
 */
export function defineColorTheme<const Init extends ColorThemeInit>(
    defaultInit: Readonly<DefaultColorThemeInit>,
    allColorsInit: Init,
): ColorTheme<Init> {
    try {
        if (themeDefaultKey in allColorsInit) {
            throw new Error(
                `Cannot define theme color by name '${themeDefaultKey}', it is used internally.`,
            );
        }
        const defaultForegroundKey = `${defaultInit.prefix}-default-fg`;
        const defaultBackgroundKey = `${defaultInit.prefix}-default-bg`;

        const inverseDefaultForegroundKey = `${defaultInit.prefix}-default-inverse-fg`;
        const inverseDefaultBackgroundKey = `${defaultInit.prefix}-default-inverse-bg`;

        const defaultColorsInit = {
            [defaultForegroundKey]: createColorCssVarDefault(
                defaultForegroundKey,
                defaultInit.foreground,
                defaultInit,
                allColorsInit,
            ),
            [defaultBackgroundKey]: createColorCssVarDefault(
                defaultBackgroundKey,
                defaultInit.background,
                defaultInit,
                allColorsInit,
            ),
            [inverseDefaultForegroundKey]: createColorCssVarDefault(
                inverseDefaultForegroundKey,
                defaultInit.background,
                defaultInit,
                allColorsInit,
            ),
            [inverseDefaultBackgroundKey]: createColorCssVarDefault(
                inverseDefaultBackgroundKey,
                defaultInit.foreground,
                defaultInit,
                allColorsInit,
            ),
        };

        const defaultColors = defineCssVars(defaultColorsInit);

        const cssVarsSetup: CssVarsSetup = getObjectTypedEntries(
            allColorsInit as ColorThemeInit,
        ).reduce(
            (
                accum,
                [
                    colorName,
                    colorInit,
                ],
            ) => {
                const names = createCssVarNames(colorName);

                const foreground = colorInit.foreground
                    ? createColorCssVarDefault(
                          [
                              colorName,
                              'foreground',
                          ].join(' '),
                          colorInit.foreground,
                          defaultInit,
                          allColorsInit,
                      )
                    : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      `var(${defaultColors[defaultForegroundKey]!.name}, ${defaultColors[defaultForegroundKey]!.default})`;
                const background = colorInit.background
                    ? createColorCssVarDefault(
                          [
                              colorName,
                              'background',
                          ].join(' '),
                          colorInit.background,
                          defaultInit,
                          allColorsInit,
                      )
                    : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      `var(${defaultColors[defaultBackgroundKey]!.name}, ${defaultColors[defaultBackgroundKey]!.default})`;

                accum[names.foreground] = foreground;
                accum[names.background] = background;

                accum[names.foregroundInverse] = `var(--${names.background}, ${background})`;
                accum[names.backgroundInverse] = `var(--${names.foreground}, ${foreground})`;

                return accum;
            },
            {} as Writable<CssVarsSetup>,
        );

        /**
         * This has multiple `as` casts because `defineCssVars` complains that `cssVarsSetup` is too
         * generic. That is indeed true, but in this use case we do not care because the resulting
         * `cssVars` object is not directly exposed.
         */
        const cssVars = defineCssVars(cssVarsSetup);

        const colors: Record<string, ColorThemeColor> = {};
        const inverseColors: Record<string, ColorThemeColor> = {};

        getObjectTypedEntries(allColorsInit as Record<CssVarName, ColorInit>).forEach(
            ([
                colorName,
                colorInit,
            ]) => {
                assert.isString(colorName);

                const names = createCssVarNames(colorName);

                const foreground = cssVars[names.foreground];
                const background = cssVars[names.background];
                const foregroundInverse = cssVars[names.foregroundInverse];
                const backgroundInverse = cssVars[names.backgroundInverse];

                assert.isDefined(foreground);
                assert.isDefined(background);
                assert.isDefined(foregroundInverse);
                assert.isDefined(backgroundInverse);

                colors[colorName] = {
                    foreground,
                    background,
                    init: colorInit,
                    name: colorName,
                };

                inverseColors[colorName] = {
                    foreground: foregroundInverse,
                    background: backgroundInverse,
                    init: colorInit,
                    name: colorName,
                };
            },
        );

        const themeDefaultColors: ColorTheme['colors'][typeof themeDefaultKey] = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            foreground: defaultColors[defaultForegroundKey]!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            background: defaultColors[defaultBackgroundKey]!,
            init: defaultInit,
            name: themeDefaultKey,
        };

        const themeDefaultInverseColors: ColorTheme['inverse'][typeof themeDefaultKey] = {
            ...themeDefaultColors,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            foreground: defaultColors[inverseDefaultForegroundKey]!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            background: defaultColors[inverseDefaultBackgroundKey]!,
        };

        return {
            colors: {
                [themeDefaultKey]: themeDefaultColors,
                ...colors,
            },
            inverse: {
                [themeDefaultKey]: themeDefaultInverseColors,
                ...inverseColors,
            },
            init: {
                colors: allColorsInit,
                default: defaultInit,
            },
        } as ColorTheme<Init>;
    } catch (error) {
        globalThis.setTimeout(() => log.error(error));
        throw error;
    }
}

function createCssVarNames(colorName: CssVarName) {
    return {
        foreground: [
            colorName,
            'fg',
        ].join('-') as CssVarName,
        background: [
            colorName,
            'bg',
        ].join('-') as CssVarName,
        foregroundInverse: [
            colorName,
            'inverse',
            'fg',
        ].join('-') as CssVarName,
        backgroundInverse: [
            colorName,
            'inverse',
            'bg',
        ].join('-') as CssVarName,
    };
}
