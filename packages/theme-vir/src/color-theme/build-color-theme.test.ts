import {assert} from '@augment-vir/assert';
import {assertSnapshot, describe, it} from '@augment-vir/test';
import {css, unsafeCSS} from 'element-vir';
import {defineCssVars} from 'lit-css-vars';
import {buildColorTheme} from './build-color-theme.js';

describe(buildColorTheme.name, () => {
    it('defines a theme', async (testContext) => {
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

        assert.deepEquals(theme.darkOverride.asTheme.colors['vir-red-behind-bg-body'], {
            background: {
                default: 'var(--vira-red-350, #FFC1B8)',
                name: unsafeCSS('--vir-red-behind-bg-body-bg'),
                syntax: '*',
                value: css`var(${unsafeCSS('--vir-red-behind-bg-body-bg')}, ${colorPalette['vira-red-350'].value})`,
            },
            foreground: {
                default: 'var(--vir-default-bg, black)',
                name: unsafeCSS('--vir-red-behind-bg-body-fg'),
                syntax: '*',
                value: css`var(${unsafeCSS('--vir-red-behind-bg-body-fg')}, ${unsafeCSS('var(--vir-default-bg, black)')})`,
            },
            init: {
                background: colorPalette['vira-red-350'].value,
                foreground: {
                    refDefaultBackground: true,
                },
            },
            name: 'vir-red-behind-bg-body',
        });

        await assertSnapshot(testContext, theme);
    });
});
