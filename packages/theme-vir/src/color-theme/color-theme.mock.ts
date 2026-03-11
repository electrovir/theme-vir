import {defineCssVars} from 'lit-css-vars';
import {defineColorThemeOverride} from './color-theme-override.js';
import {defineColorTheme} from './color-theme.js';

export const mockColorPalette = defineCssVars({
    'mock-red-100': '#FFF6F5',
    'mock-red-200': '#FFE4E1',
    'mock-red-300': '#FFD1CB',
    'mock-red-400': '#FFA79B',
    'mock-red-500': '#FF564A',
    'mock-red-600': '#E2322C',
    'mock-red-700': '#BB2520',
    'mock-red-800': '#82211A',
    'mock-red-900': '#611710',
    'mock-blue-100': '#E6F0FF',
    'mock-blue-200': '#CCE0FF',
    'mock-blue-300': '#99C2FF',
    'mock-blue-400': '#66A3FF',
    'mock-blue-500': '#3385FF',
    'mock-blue-600': '#0066FF',
    'mock-blue-700': '#0052CC',
    'mock-blue-800': '#003D99',
    'mock-blue-900': '#002966',
});

export const mockColorTheme = defineColorTheme(
    {
        background: 'white',
        foreground: 'black',
        prefix: 'mock',
    },
    {
        'action-primary': {
            foreground: 'dodgerblue',
        },
        'action-secondary': {
            foreground: 'navy',
        },
        'action-danger': {
            foreground: 'red',
        },
        'nav-bar': {
            background: '#ccc',
        },
        'button-primary': {
            foreground: 'white',
            background: {
                refForeground: 'action-primary',
            },
        },
    },
);

export const mockThemeDarkMode = defineColorThemeOverride(mockColorTheme, 'dark-mode', {
    defaultOverride: {
        foreground: 'white',
        background: 'black',
    },
});

export const mockOrange = defineColorThemeOverride(mockColorTheme, 'orange', {
    colorOverrides: {
        'button-primary': {
            background: 'orange',
        },
    },
});
