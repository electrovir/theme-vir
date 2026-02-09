import {camelCaseToKebabCase, getObjectTypedValues} from '@augment-vir/common';
import {type CssVarName, setCssVarValue} from 'lit-css-vars';
import {type ColorInit, type ColorThemeOverride} from './color-theme-init.js';
import {type ColorTheme, type ColorThemeColor} from './color-theme.js';

/**
 * Create the `<style>` id used to apply color themes globally by {@link applyGlobalColorTheme}.
 *
 * @category Internal
 */
export function createGlobalThemeStyleId(colorTheme: Readonly<ColorTheme>): string {
    return [
        camelCaseToKebabCase(colorTheme.prefix),
        'global-theme-vir-style',
    ].join('-');
}

/**
 * Create the global `<style>` element used by {@link applyGlobalColorTheme} to apply a color theme.
 *
 * @category Internal
 */
export function createGlobalThemeStyleElement(
    colorTheme: Readonly<ColorTheme>,
    context: Element = document.head,
): HTMLStyleElement {
    const styleId = createGlobalThemeStyleId(colorTheme);
    const existingElement = context.querySelector(`style#${styleId}`);

    if (existingElement instanceof HTMLStyleElement) {
        return existingElement;
    } else {
        const newStyleElement = globalThis.document.createElement('style');
        newStyleElement.id = styleId;
        context.append(newStyleElement);

        return newStyleElement;
    }
}

/**
 * Sets all of a color theme's CSS vars in a global style element. If no override is given, the
 * theme color default values are assigned.
 *
 * @category Color Theme
 */
export function applyGlobalColorTheme(
    fullTheme: ColorTheme,
    themeOverride?: ColorThemeOverride | undefined,
) {
    const styleElement = createGlobalThemeStyleElement(fullTheme);

    const cssVarDeclarations: string[] = getObjectTypedValues(
        fullTheme.colors as Record<CssVarName, ColorThemeColor>,
    ).flatMap((themeColor) => {
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
    });

    styleElement.textContent = `:root {\n    ${cssVarDeclarations.join('\n    ')}\n}`;
}

/**
 * A very inefficient way of setting all of a color theme's CSS vars on a given element. If no
 * override is given, the theme color default values are assigned.
 *
 * @deprecated Use {@link applyGlobalColorTheme} instead whenever possible.
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
}): string {
    const override: string | undefined =
        themeOverride?.overrides[String(themeColor[layerKey].name) as CssVarName];
    const value: string = override || themeColor[layerKey].default;

    return `${themeColor[layerKey].name}: ${value};`;
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
