import {type CSSResult} from 'element-vir';
import {type CssVarName, type SingleCssVarDefinition} from 'lit-css-vars';
import {type RequireAtLeastOne} from 'type-fest';
import {type ColorTheme} from './color-theme.js';

/**
 * Reference another color from this same definition inside {@link ColorInitValue}
 *
 * @category Internal
 */
export type ColorInitReference = RequireAtLeastOne<{
    refForeground: CssVarName;
    refBackground: CssVarName;
    refDefaultBackground: true;
    refDefaultForeground: true;
}>;

/**
 * All possible types for {@link ColorInit}.
 *
 * @category Internal
 */
export type ColorInitValue =
    | string
    | number
    | CSSResult
    | ColorInitReference
    | SingleCssVarDefinition;

/**
 * An individual theme color init.
 *
 * @category Internal
 */
export type ColorInit = RequireAtLeastOne<{
    foreground: ColorInitValue;
    background: ColorInitValue;
}>;

/**
 * Base input type for the type parameter in `defineColorTheme`.
 *
 * @category Internal
 */
export type ColorThemeInit = Record<CssVarName, ColorInit>;

/**
 * Output of `defineColorThemeOverride`.
 *
 * @category Internal
 */
export type ColorThemeOverride<Init extends ColorThemeInit = ColorThemeInit> = {
    name: string;
    overrides: Record<CssVarName, string>;
    originalTheme: ColorTheme<Init>;
    asTheme: ColorTheme<Init>;
};
