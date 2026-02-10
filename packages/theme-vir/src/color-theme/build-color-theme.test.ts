import {assert} from '@augment-vir/assert';
import {assertSnapshot, describe, it} from '@augment-vir/test';
import {css, unsafeCSS} from 'element-vir';
import {defineCssVars} from 'lit-css-vars';
import {buildColorTheme} from './build-color-theme.js';

describe(buildColorTheme.name, () => {
    it('defines a theme', async (testContext) => {
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

        assert.deepEquals(theme.darkOverride.asTheme.colors['vir-red-behind-bg-body'], {
            background: {
                default: 'var(--vira-red-20, #ffc1bc)',
                name: unsafeCSS('--vir-red-behind-bg-body-bg'),
                syntax: '*',
                value: css`var(${unsafeCSS('--vir-red-behind-bg-body-bg')}, ${colorPalette['vira-red-20'].value})`,
            },
            foreground: {
                default: 'var(--vir-default-bg, black)',
                name: unsafeCSS('--vir-red-behind-bg-body-fg'),
                syntax: '*',
                value: css`var(${unsafeCSS('--vir-red-behind-bg-body-fg')}, ${unsafeCSS('var(--vir-default-bg, black)')})`,
            },
            init: {
                background: colorPalette['vira-red-20'].value,
                foreground: {
                    refDefaultBackground: true,
                },
            },
            name: 'vir-red-behind-bg-body',
        });

        await assertSnapshot(testContext, theme);
    });
});
