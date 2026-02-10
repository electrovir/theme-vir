import {
    camelCaseToKebabCase,
    getObjectTypedValues,
    typedObjectFromEntries,
} from '@augment-vir/common';
import {applyCssVarsViaStyleElement, type CssVarName, setCssVarValue} from 'lit-css-vars';
import {type ColorInit, type ColorThemeOverride} from './color-theme-init.js';
import {type ColorTheme, type ColorThemeColor} from './color-theme.js';

/**
 * Create the `<style>` id used to apply color themes globally by
 * {@link applyColorThemeViaStyleElement}.
 *
 * @category Internal
 */
export function createGlobalThemeStyleId(colorTheme: Readonly<ColorTheme>): string {
    return [
        camelCaseToKebabCase(colorTheme.prefix),
        'theme-vir-style',
    ].join('-');
}

/**
 * Sets all of a color theme's CSS vars in a global style element. If no override is given, the
 * theme color default values are assigned.
 *
 * Uses `applyCssVarsViaStyleElement` from `lit-css-vars`.
 *
 * @category Color Theme
 */
export function applyColorThemeViaStyleElement(
    colorTheme: ColorTheme,
    themeOverride?: ColorThemeOverride | undefined,
    /**
     * The context to apply the color theme to.
     *
     * @default document.head
     */
    context?: Element | undefined,
) {
    const cssVarValues: Record<CssVarName, string> = typedObjectFromEntries(
        getObjectTypedValues(colorTheme.colors as Record<CssVarName, ColorThemeColor>).flatMap(
            (themeColor): [CssVarName, string][] => {
                return [
                    buildCssVarDeclaration({
                        layerKey: 'background',
                        themeColor,
                        themeOverride,
                    }),
                    buildCssVarDeclaration({
                        layerKey: 'foreground',
                        themeColor,
                        themeOverride,
                    }),
                ];
            },
        ),
    );

    return applyCssVarsViaStyleElement(cssVarValues, createGlobalThemeStyleId(colorTheme), context);
}

/**
 * A very inefficient way of setting all of a color theme's CSS vars on a given element. If no
 * override is given, the theme color default values are assigned.
 *
 * @deprecated Use {@link applyColorThemeViaStyleElement} instead whenever possible.
 * @category Internal
 */
export function applyColorTheme(
    /** This should usually be the top-level `html` element. */
    element: HTMLElement,
    fullTheme: ColorTheme,
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

function buildCssVarDeclaration({
    layerKey,
    themeOverride,
    themeColor,
}: {
    layerKey: keyof ColorInit;
    themeOverride: ColorThemeOverride | undefined;
    themeColor: ColorThemeColor;
}): [key: CssVarName, value: string] {
    const cssVarName: CssVarName = String(themeColor[layerKey].name) as CssVarName;

    const override: string | undefined = themeOverride?.overrides[cssVarName];
    const value: string = override || themeColor[layerKey].default;

    return [
        cssVarName,
        value,
    ];
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
