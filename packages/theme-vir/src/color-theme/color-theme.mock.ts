import {defineCssVars} from 'lit-css-vars';
import {defineColorThemeOverride} from './color-theme-override.js';
import {defineColorTheme} from './color-theme.js';

export const mockColorPalette = defineCssVars({
    'mock-red-100': '#FFF6F5',
    'mock-red-150': '#FFEDEB',
    'mock-red-200': '#FFE4E1',
    'mock-red-250': '#FFDCD8',
    'mock-red-300': '#FFD1CB',
    'mock-red-350': '#FFC1B8',
    'mock-red-400': '#FFA79B',
    'mock-red-450': '#FF8274',
    'mock-red-500': '#FF564A',
    'mock-red-550': '#F43A32',
    'mock-red-600': '#E2322C',
    'mock-red-650': '#D02C27',
    'mock-red-700': '#BB2520',
    'mock-red-750': '#9E231D',
    'mock-red-800': '#82211A',
    'mock-red-850': '#701A13',
    'mock-red-900': '#611710',
    'mock-red-950': '#52140D',
    'mock-red-1000': '#43130D',
    'mock-blue-100': '#E6F0FF',
    'mock-blue-150': '#D9E8FF',
    'mock-blue-200': '#CCE0FF',
    'mock-blue-250': '#B3D1FF',
    'mock-blue-300': '#99C2FF',
    'mock-blue-350': '#80B3FF',
    'mock-blue-400': '#66A3FF',
    'mock-blue-450': '#4D94FF',
    'mock-blue-500': '#3385FF',
    'mock-blue-550': '#1A76FF',
    'mock-blue-600': '#0066FF',
    'mock-blue-650': '#005CE6',
    'mock-blue-700': '#0052CC',
    'mock-blue-750': '#0048B3',
    'mock-blue-800': '#003D99',
    'mock-blue-850': '#003380',
    'mock-blue-900': '#002966',
    'mock-blue-950': '#001F4D',
    'mock-blue-1000': '#001533',
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
