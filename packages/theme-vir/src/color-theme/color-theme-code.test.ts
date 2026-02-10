import {assert} from '@augment-vir/assert';
import {collapseWhiteSpace} from '@augment-vir/common';
import {assertSnapshot, describe, it} from '@augment-vir/test';
import {defineCssVars} from 'lit-css-vars';
import {buildColorTheme} from './build-color-theme.js';
import {generateThemeCode} from './color-theme-code.js';

describe(generateThemeCode.name, () => {
    it('generates code', async (testContext) => {
        const colorPalette = defineCssVars({
            'vira-red-5': '#ffe9e6',
            'vira-red-10': '#ffd9d5',
            'vira-red-20': '#ffc1bc',
            'vira-red-30': '#ffa7a2',
            'vira-red-40': '#ff8886',
            'vira-red-50': '#ff6065',
            'vira-red-60': '#f9163a',
            'vira-red-70': '#d2001d',
            'vira-red-80': '#a60012',
            'vira-red-90': '#760003',
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
