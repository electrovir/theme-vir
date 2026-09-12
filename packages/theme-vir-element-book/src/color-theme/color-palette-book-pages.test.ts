import {assert} from '@augment-vir/assert';
import {getObjectTypedValues} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {defineCssVars} from 'lit-css-vars';
import {createColorPaletteBookPages} from './color-palette-book-pages.js';

describe(createColorPaletteBookPages.name, () => {
    it('creates palette and contrast page hierarchy', () => {
        const pages = createColorPaletteBookPages({
            title: 'Test Palette',
            colors: defineCssVars({
                'test-blue-500': '#123456',
            }),
            includeContrast: true,
        });

        assert.deepEquals(
            pages.map(({elementExamples, parent, title}) => {
                return {
                    parentTitle: parent?.title,
                    title,
                    exampleTitles: getObjectTypedValues(elementExamples).map(({title}) => title),
                };
            }),
            [
                {
                    parentTitle: undefined,
                    title: 'Test Palette',
                    exampleTitles: [],
                },
                {
                    parentTitle: 'Test Palette',
                    title: 'Palette',
                    exampleTitles: ['All Colors'],
                },
                {
                    parentTitle: 'Test Palette',
                    title: 'Palette Contrast',
                    exampleTitles: [],
                },
                {
                    parentTitle: 'Palette Contrast',
                    title: 'Test Palette Contrast Black White',
                    exampleTitles: ['blue'],
                },
                {
                    parentTitle: 'Palette Contrast',
                    title: 'Test Palette Contrast Self 400',
                    exampleTitles: ['blue'],
                },
                {
                    parentTitle: 'Palette Contrast',
                    title: 'Test Palette Contrast Self 700',
                    exampleTitles: ['blue'],
                },
            ],
        );
    });

    it('omits optional pages by default', () => {
        const pages = createColorPaletteBookPages({
            title: 'Test Palette',
            colors: defineCssVars({
                'test-blue-500': '#123456',
            }),
        });

        assert.deepEquals(
            pages.map(({title}) => title),
            [
                'Test Palette',
                'Palette',
            ],
        );
    });
});
