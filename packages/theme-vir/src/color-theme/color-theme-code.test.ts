import {assert} from '@augment-vir/assert';
import {collapseWhiteSpace} from '@augment-vir/common';
import {assertSnapshot, describe, it} from '@augment-vir/test';
import {defineCssVars} from 'lit-css-vars';
import {buildColorTheme} from './build-color-theme.js';
import {generateThemeCode} from './color-theme-code.js';

describe(generateThemeCode.name, () => {
    it('generates code', async (testContext) => {
        const colorPalette = defineCssVars({
            'vira-red-100': '#FFF6F5',
            'vira-red-150': '#FFEDEB',
            'vira-red-200': '#FFE4E1',
            'vira-red-250': '#FFDCD8',
            'vira-red-300': '#FFD1CB',
            'vira-red-350': '#FFC1B8',
            'vira-red-400': '#FFA79B',
            'vira-red-450': '#FF8274',
            'vira-red-500': '#FF564A',
            'vira-red-550': '#F43A32',
            'vira-red-600': '#E2322C',
            'vira-red-650': '#D02C27',
            'vira-red-700': '#BB2520',
            'vira-red-750': '#9E231D',
            'vira-red-800': '#82211A',
            'vira-red-850': '#701A13',
            'vira-red-900': '#611710',
            'vira-red-950': '#52140D',
            'vira-red-1000': '#43130D',
        });

        const theme = buildColorTheme(colorPalette);

        const generatedCode = generateThemeCode(theme.defaultLight, {
            overrides: [theme.darkOverride],
        });

        const flattenedCode = collapseWhiteSpace(generatedCode);

        assert.lacksValue(flattenedCode, 'background: { refDefaultBackground: true, },');

        await assertSnapshot(testContext, generatedCode);
    });
});
