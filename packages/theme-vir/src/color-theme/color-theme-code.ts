import {
    getObjectTypedEntries,
    type PartialWithUndefined,
    type RequiredAndNotNull,
} from '@augment-vir/common';
import {type CSSResult} from 'element-vir';
import {type ColorThemeOverride} from './color-theme-override.js';
import {
    type ColorInit,
    type ColorInitValue,
    type ColorTheme,
    type ColorThemeInit,
    type NoRefColorInit,
} from './color-theme.js';

/**
 * Convert a color theme into code to define that color theme.
 *
 * @category Color Theme
 */
export function generateThemeCode(
    theme: ColorTheme,
    options?: Readonly<
        PartialWithUndefined<{
            paletteVarName: string;
            overrides: ReadonlyArray<Readonly<ColorThemeOverride>>;
        }>
    >,
): string {
    const paletteVarName = options?.paletteVarName;

    const defaultInitCode = colorInitToCode(theme.init.default, 1, undefined, paletteVarName);
    const colorsInitCode = colorThemeInitToCode(
        theme.init.colors,
        1,
        theme.init.default,
        paletteVarName,
    );

    const themeCode = `export const theme = defineColorTheme(\n${defaultInitCode},\n${colorsInitCode},\n);`;

    const overridesCodes = (options?.overrides || []).map((override) => {
        return generateOverrideCode(override, paletteVarName);
    });

    return [
        themeCode,
        ...overridesCodes,
    ].join('\n\n');
}

function generateOverrideCode(
    override: ColorThemeOverride,
    paletteVarName: string | undefined,
): string {
    const parts: string[] = [];

    // Check if default colors differ
    const defaultOverrideEntries: string[] = [];
    if (
        !colorInitValuesEqual(
            override.asTheme.init.default.foreground,
            override.originalTheme.init.default.foreground,
        )
    ) {
        defaultOverrideEntries.push(
            `${tab(3)}foreground: ${colorInitValueToCode(override.asTheme.init.default.foreground, 3, paletteVarName)},`,
        );
    }
    if (
        !colorInitValuesEqual(
            override.asTheme.init.default.background,
            override.originalTheme.init.default.background,
        )
    ) {
        defaultOverrideEntries.push(
            `${tab(3)}background: ${colorInitValueToCode(override.asTheme.init.default.background, 3, paletteVarName)},`,
        );
    }
    if (defaultOverrideEntries.length > 0) {
        parts.push(
            `${tab(2)}defaultOverride: {\n${defaultOverrideEntries.join('\n')}\n${tab(2)}},`,
        );
    }

    // Check for color overrides
    const colorOverrideEntries: string[] = [];
    getObjectTypedEntries(override.asTheme.init.colors).forEach(
        ([
            colorName,
            colorInit,
        ]) => {
            const originalColorInit = override.originalTheme.init.colors[colorName];
            if (!originalColorInit) {
                return;
            }

            const colorEntries: string[] = [];
            if (
                'foreground' in colorInit &&
                (!('foreground' in originalColorInit) ||
                    !colorInitValuesEqual(colorInit.foreground, originalColorInit.foreground))
            ) {
                colorEntries.push(
                    `${tab(4)}foreground: ${colorInitValueToCode(colorInit.foreground, 4, paletteVarName)},`,
                );
            }
            if (
                'background' in colorInit &&
                (!('background' in originalColorInit) ||
                    !colorInitValuesEqual(colorInit.background, originalColorInit.background))
            ) {
                colorEntries.push(
                    `${tab(4)}background: ${colorInitValueToCode(colorInit.background, 4, paletteVarName)},`,
                );
            }

            if (colorEntries.length > 0) {
                colorOverrideEntries.push(
                    `${tab(3)}'${colorName}': {\n${colorEntries.join('\n')}\n${tab(3)}},`,
                );
            }
        },
    );

    if (colorOverrideEntries.length > 0) {
        parts.push(`${tab(2)}colorOverrides: {\n${colorOverrideEntries.join('\n')}\n${tab(2)}},`);
    }

    return `export const ${override.name}Override = defineColorThemeOverride(\n${tab(1)}theme,\n${tab(1)}'${override.name}',\n${tab(1)}{\n${parts.join('\n')}\n${tab(1)}},\n);`;
}

function tab(level: number): string {
    return '    '.repeat(level);
}

function colorInitValuesEqual(a: ColorInitValue, b: ColorInitValue): boolean {
    if (typeof a !== typeof b) {
        return false;
    }
    if (typeof a === 'string' || typeof a === 'number') {
        return a === b;
    }
    if ('_$cssResult$' in a && '_$cssResult$' in (b as object)) {
        return a.cssText === (b as CSSResult).cssText;
    }
    // For references and SingleCssVarDefinition, compare as JSON
    return JSON.stringify(a) === JSON.stringify(b);
}

function extractCssVarName(cssValue: string): string | undefined {
    const match = cssValue.match(/^var\(--([^,)]+)/);
    return match ? match[1] : undefined;
}

function colorInitValueToCode(
    value: ColorInitValue,
    indentLevel: number,
    paletteVarName: string | undefined,
): string {
    if (typeof value === 'string') {
        return `'${value}'`;
    } else if (typeof value === 'number') {
        return String(value);
    } else if ('_$cssResult$' in value) {
        const cssText = String(value);
        if (paletteVarName) {
            const varName = extractCssVarName(cssText);
            if (varName) {
                return `${paletteVarName}['${varName}']`;
            }
        }
        return `css\`${cssText}\``;
    } else if (
        'refBackground' in value ||
        'refForeground' in value ||
        'refDefaultBackground' in value ||
        'refDefaultForeground' in value
    ) {
        const entries: string[] = [];
        if ('refForeground' in value) {
            entries.push(`${tab(indentLevel + 1)}refForeground: '${value.refForeground}',`);
        }
        if ('refBackground' in value) {
            entries.push(`${tab(indentLevel + 1)}refBackground: '${value.refBackground}',`);
        }
        if ('refDefaultForeground' in value) {
            entries.push(`${tab(indentLevel + 1)}refDefaultForeground: true,`);
        }
        if ('refDefaultBackground' in value) {
            entries.push(`${tab(indentLevel + 1)}refDefaultBackground: true,`);
        }
        return `{\n${entries.join('\n')}\n${tab(indentLevel)}}`;
    } else {
        // SingleCssVarDefinition
        return `'${value.default}'`;
    }
}

function colorInitToCode(
    colorInit: ColorInit | NoRefColorInit,
    indentLevel: number,
    defaultInit: RequiredAndNotNull<NoRefColorInit> | undefined,
    paletteVarName: string | undefined,
): string {
    const entries: string[] = [];

    if (
        'foreground' in colorInit &&
        (!defaultInit || !colorInitValuesEqual(colorInit.foreground, defaultInit.foreground))
    ) {
        // Check if foreground matches default background (use refDefaultBackground)
        if (defaultInit && colorInitValuesEqual(colorInit.foreground, defaultInit.background)) {
            entries.push(
                `${tab(indentLevel + 1)}foreground: {\n${tab(indentLevel + 2)}refDefaultBackground: true,\n${tab(indentLevel + 1)}},`,
            );
        } else {
            entries.push(
                `${tab(indentLevel + 1)}foreground: ${colorInitValueToCode(colorInit.foreground, indentLevel + 1, paletteVarName)},`,
            );
        }
    }
    if (
        'background' in colorInit &&
        (!defaultInit || !colorInitValuesEqual(colorInit.background, defaultInit.background))
    ) {
        // Check if background matches default foreground (use refDefaultForeground)
        if (defaultInit && colorInitValuesEqual(colorInit.background, defaultInit.foreground)) {
            entries.push(
                `${tab(indentLevel + 1)}background: {\n${tab(indentLevel + 2)}refDefaultForeground: true,\n${tab(indentLevel + 1)}},`,
            );
        } else {
            entries.push(
                `${tab(indentLevel + 1)}background: ${colorInitValueToCode(colorInit.background, indentLevel + 1, paletteVarName)},`,
            );
        }
    }

    return `${tab(indentLevel)}{\n${entries.join('\n')}\n${tab(indentLevel)}}`;
}

function colorThemeInitToCode(
    colorsInit: ColorThemeInit,
    indentLevel: number,
    defaultInit: RequiredAndNotNull<NoRefColorInit>,
    paletteVarName: string | undefined,
): string {
    const entries = getObjectTypedEntries(colorsInit).map(
        ([
            colorName,
            colorInit,
        ]) => {
            return `${tab(indentLevel + 1)}'${colorName}': ${colorInitToCode(colorInit, indentLevel + 1, defaultInit, paletteVarName).trimStart()},`;
        },
    );

    return `${tab(indentLevel)}{\n${entries.join('\n')}\n${tab(indentLevel)}}`;
}
