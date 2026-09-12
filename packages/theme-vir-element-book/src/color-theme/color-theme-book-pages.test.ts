import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {defineColorTheme, defineColorThemeOverride} from 'theme-vir';
import {createColorThemeBookPages} from './color-theme-book-pages.js';

const testTheme = defineColorTheme(
    {
        foreground: 'black',
        background: 'white',
        prefix: 'test',
    },
    {
        'action-primary': {
            foreground: 'blue',
        },
    },
);

const testThemeOverride = defineColorThemeOverride(testTheme, 'Dark', {
    defaultOverride: {
        foreground: 'white',
        background: 'black',
    },
});

describe(createColorThemeBookPages.name, () => {
    it('creates default and override theme pages', () => {
        const pages = createColorThemeBookPages({
            title: 'Colors',
            theme: testTheme,
            overrides: [testThemeOverride],
            useVerticalLayout: true,
        });

        assert.deepEquals(
            pages.map(({parent, title, useVerticalExamples}) => {
                return {
                    parentTitle: parent?.title,
                    title,
                    useVerticalExamples,
                };
            }),
            [
                {
                    parentTitle: undefined,
                    title: 'Colors',
                    useVerticalExamples: false,
                },
                {
                    parentTitle: 'Colors',
                    title: 'Default',
                    useVerticalExamples: true,
                },
                {
                    parentTitle: 'Colors',
                    title: 'Dark',
                    useVerticalExamples: true,
                },
            ],
        );
    });

    it('rejects the reserved override name', () => {
        assert.throws(
            () => {
                createColorThemeBookPages({
                    title: 'Colors',
                    theme: testTheme,
                    overrides: [
                        defineColorThemeOverride(testTheme, 'None', {
                            defaultOverride: {
                                foreground: 'black',
                            },
                        }),
                    ],
                });
            },
            {
                matchMessage: "Cannot have theme override named 'None'",
            },
        );
    });
});
