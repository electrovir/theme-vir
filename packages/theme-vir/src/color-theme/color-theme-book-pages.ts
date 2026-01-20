import {assertWrap, check} from '@augment-vir/assert';
import {groupArrayBy, type PartialWithUndefined} from '@augment-vir/common';
import {VirColorPair} from '@electrovir/color';
import {
    BookPageControlType,
    defineBookPage,
    definePageControl,
    type BookPage,
    type DefineExampleCallback,
} from 'element-book';
import {css, html, listen, nothing, onDomRendered} from 'element-vir';
import {type EmptyObject} from 'type-fest';
import {generateThemeCode} from './color-theme-code.js';
import {type ColorThemeOverride} from './color-theme-init.js';
import {applyColorTheme, type ColorTheme} from './color-theme.js';

const noneOverridesSelectionValue = 'None';

/**
 * Create multiple element-book pages to showcase a theme its overrides (if any).
 *
 * @category Color Theme
 */
export function createColorThemeBookPages({
    parent,
    title,
    theme,
    hideInverseColors,
    overrides,
    useVerticalLayout,
    prefixGroupByCount = 2,
    hideCopyCode,
}: {
    title: string;
    theme: Readonly<ColorTheme>;
} & PartialWithUndefined<{
    hideCopyCode: boolean;
    parent: Readonly<BookPage>;
    hideInverseColors: boolean;
    overrides: ReadonlyArray<Readonly<ColorThemeOverride>>;
    useVerticalLayout: boolean;
    /**
     * The number of CSS variable name prefixes to group colors by.
     *
     * @default 0
     */
    prefixGroupByCount: number;
}>) {
    const themeControls = {
        'Show Var Names': definePageControl({
            controlType: BookPageControlType.Checkbox,
            initValue: false,
        }),
        'Show Contrast Tips': definePageControl({
            controlType: BookPageControlType.Checkbox,
            initValue: true,
        }),
    };

    const defaultThemeControls = {
        'Theme Override': definePageControl({
            controlType: BookPageControlType.Dropdown,
            initValue: noneOverridesSelectionValue,
            options: [
                noneOverridesSelectionValue,
                ...(overrides || []).map((override) => {
                    if (override.name === noneOverridesSelectionValue) {
                        throw new Error(
                            `Cannot have theme override named '${noneOverridesSelectionValue}'`,
                        );
                    }

                    return override.name;
                }),
            ],
        }),
    };

    const themeParentPage = defineBookPage({
        parent,
        title,
        controls: themeControls,
    });

    function buildThemeColorTemplate({
        controls,
        theme,
        themeColorName,
    }: {
        controls: Record<keyof typeof themeControls, boolean>;
        theme: Readonly<ColorTheme>;
        themeColorName: string;
    }) {
        const themeColor = check.isKeyOf(themeColorName, theme.colors)
            ? theme.colors[themeColorName]
            : undefined;
        const inverseThemeColor = check.isKeyOf(themeColorName, theme.inverse)
            ? theme.inverse[themeColorName]
            : undefined;
        if (!themeColor || !inverseThemeColor) {
            throw new Error(`No theme color found by name '${themeColorName}'`);
        }

        const normalTemplate = html`
            <${VirColorPair.assign({
                color: themeColor,
                showVarValues: true,
                showVarNames: controls['Show Var Names'],
                showContrast: controls['Show Contrast Tips'],
                fontWeight: 400,
            })}></${VirColorPair}>
        `;

        const inverseColor = hideInverseColors ? undefined : inverseThemeColor;

        const inverseTemplate = inverseColor
            ? html`
                  <${VirColorPair.assign({
                      color: inverseColor,
                      showVarValues: false,
                      showVarNames: controls['Show Var Names'],
                      showContrast: controls['Show Contrast Tips'],
                      fontWeight: 400,
                  })}></${VirColorPair}>
              `
            : nothing;

        return html`
            <div class="with-inverse">${normalTemplate}${inverseTemplate}</div>
        `;
    }

    function createThemePageExamples(
        defineExample: DefineExampleCallback<
            EmptyObject,
            | (typeof themeParentPage.controls & typeof defaultThemeControls)
            | typeof themeParentPage.controls
        >,
        defaultTheme: Readonly<ColorTheme>,
        overrides: ReadonlyArray<Readonly<ColorThemeOverride>> | undefined,
    ) {
        const groups = groupArrayBy(Object.keys(defaultTheme.colors), (value) => {
            if (prefixGroupByCount) {
                return value.split('-').slice(0, prefixGroupByCount).join('-');
            } else {
                return value;
            }
        });

        Object.entries(groups).forEach(
            ([
                groupName,
                group,
            ]) => {
                if (!group) {
                    return;
                }

                defineExample({
                    title: groupName,
                    styles: css`
                        :host {
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        }

                        .theme-wrapper {
                            display: contents;
                        }

                        .with-inverse {
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        }
                    `,
                    render({controls}) {
                        const selectedOverride: ColorThemeOverride | undefined =
                            ('Theme Override' in controls &&
                                controls['Theme Override'] &&
                                overrides?.find(
                                    (override) => override.name === controls['Theme Override'],
                                )) ||
                            undefined;

                        const currentTheme = selectedOverride?.asTheme || defaultTheme;

                        return html`
                            <div
                                class="theme-wrapper"
                                ${onDomRendered((element) => {
                                    applyColorTheme(
                                        assertWrap.instanceOf(element, HTMLElement),
                                        currentTheme,
                                    );
                                })}
                            >
                                ${group.map((entry) =>
                                    buildThemeColorTemplate({
                                        controls,
                                        theme: currentTheme,
                                        themeColorName: entry,
                                    }),
                                )}
                            </div>
                        `;
                    },
                });
            },
        );
    }

    const descriptionParagraphs = [
        'Click a color preview to show CSS var names and values.',
    ];

    const defaultThemePage = defineBookPage({
        parent: themeParentPage,
        title: 'Default',
        descriptionParagraphs,
        useVerticalExamples: useVerticalLayout,
        controls: {
            ...(hideCopyCode
                ? {}
                : {
                      copy: definePageControl({
                          controlType: BookPageControlType.Custom,
                          content: html`
                              <button
                                  ${listen('click', async () => {
                                      const code = generateThemeCode(theme, {
                                          paletteVarName: 'viraColorPalette',
                                          overrides,
                                      });
                                      await navigator.clipboard.writeText(code);
                                  })}
                              >
                                  Copy Code
                              </button>
                          `,
                      }),
                  }),
            ...defaultThemeControls,
        },
        defineExamples({defineExample}) {
            createThemePageExamples(defineExample, theme, overrides);
        },
    });

    const overridePages = (overrides || []).map((override) => {
        return defineBookPage({
            parent: themeParentPage,
            title: override.name,
            useVerticalExamples: useVerticalLayout,
            descriptionParagraphs,
            defineExamples({defineExample}) {
                createThemePageExamples(defineExample, override.asTheme, undefined);
            },
        });
    });

    return [
        themeParentPage,
        defaultThemePage,
        ...overridePages,
    ];
}
