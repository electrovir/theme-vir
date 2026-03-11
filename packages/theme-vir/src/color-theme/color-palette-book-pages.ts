import {check} from '@augment-vir/assert';
import {type PartialWithUndefined} from '@augment-vir/common';
import {VirColorPair, type FontWeight} from '@electrovir/color';
import {defineBookPage, type BookPage} from 'element-book';
import {css, html, listen, unsafeCSS} from 'element-vir';
import {type SingleCssVarDefinition} from 'lit-css-vars';
import {type RequireExactlyOne} from 'type-fest';
import {noNativeSpacing, viraTheme} from 'vira';
import {
    buildColorTheme,
    groupColors,
    type BuildLowLevelColorThemeOptions,
    type ColorPaletteVars,
    type PaletteColor,
} from './build-color-theme.js';
import {createColorThemeBookPages} from './color-theme-book-pages.js';
import {themeDefaultKey} from './color-theme.js';

type ContrastCell = {
    title: string;
    fontWeight: FontWeight;
} & RequireExactlyOne<{
    background: SingleCssVarDefinition;
    foreground: SingleCssVarDefinition;
}>;

const blackWhiteCells: ContrastCell[] = [
    {
        title: 'Black',
        fontWeight: 400,
        foreground: viraTheme.colors[themeDefaultKey].foreground,
    },
    {
        title: 'Black',
        fontWeight: 700,
        foreground: viraTheme.colors[themeDefaultKey].foreground,
    },
    {
        title: 'White',
        fontWeight: 400,
        foreground: viraTheme.colors[themeDefaultKey].background,
    },
    {
        title: 'White',
        fontWeight: 700,
        foreground: viraTheme.colors[themeDefaultKey].background,
    },
    {
        title: 'Black',
        fontWeight: 400,
        background: viraTheme.colors[themeDefaultKey].foreground,
    },
    {
        title: 'Black',
        fontWeight: 700,
        background: viraTheme.colors[themeDefaultKey].foreground,
    },
    {
        title: 'White',
        fontWeight: 400,
        background: viraTheme.colors[themeDefaultKey].background,
    },
    {
        title: 'White',
        fontWeight: 700,
        background: viraTheme.colors[themeDefaultKey].background,
    },
];

/**
 * Create multiple element-book pages to showcase a bunch of color CSS variables.
 *
 * @category Color Theme
 * @see `createColorThemeBookPages` for creating full color theme pages.
 */
export function createColorPaletteBookPages({
    colors,
    parent,
    title,
    includeContrast,
    includeTheme,
    useVerticalTheme,
    options,
}: {
    title: string;
    colors: Readonly<ColorPaletteVars>;
} & PartialWithUndefined<{
    parent: Readonly<BookPage>;
    includeContrast: boolean;
    includeTheme: boolean;
    useVerticalTheme: boolean;
    options: Readonly<BuildLowLevelColorThemeOptions>;
}>): BookPage[] {
    const colorGroups = groupColors(colors);

    const topColorsPage = defineBookPage({
        parent,
        title,
    });

    const colorPalettePage = defineBookPage({
        parent: topColorsPage,
        title: 'Palette',
        defineExamples({defineExample}) {
            defineExample({
                title: 'All Colors',
                styles: css`
                    :host {
                        display: flex;
                        flex-direction: row;
                    }

                    p {
                        ${noNativeSpacing}
                    }

                    .color-column {
                        display: flex;
                        flex-direction: column;
                    }

                    .column-title {
                        text-align: center;
                        font-size: 12px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid
                            ${viraTheme.colors['vira-grey-foreground-decoration'].foreground.value};
                        margin-bottom: 4px;
                        color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground
                            .value};
                    }

                    .swatch-wrapper {
                        display: flex;
                        gap: 4px;
                        align-items: center;

                        & .swatch {
                            width: 50px;
                            height: 50px;
                            cursor: pointer;
                        }

                        & .color-details {
                            display: none;
                            font-family: monospace;
                            font-size: 12px;
                            color: ${viraTheme.colors['vira-grey-foreground-non-body'].foreground
                                .value};
                        }

                        &.expanded .color-details {
                            display: block;
                        }

                        & .color-value {
                            margin-left: 1ch;
                        }
                    }
                `,
                render() {
                    return Object.entries(colorGroups).map(
                        ([
                            groupName,
                            colors,
                        ]) => {
                            return html`
                                <div class="color-column">
                                    <p class="column-title">${groupName}</p>
                                    ${colors.map((color) => {
                                        return html`
                                            <div class="swatch-wrapper">
                                                <div
                                                    class="swatch"
                                                    style=${css`
                                                        background-color: ${unsafeCSS(
                                                            color.definition.default,
                                                        )};
                                                    `}
                                                    ${listen('click', (event) => {
                                                        const wrapper = (
                                                            event.currentTarget as HTMLElement
                                                        ).parentElement;
                                                        wrapper?.classList.toggle('expanded');
                                                    })}
                                                ></div>
                                                <p class="color-details">
                                                    <span>${color.cssVarName}</span>
                                                    <br />
                                                    <span class="color-value">
                                                        ${color.definition.default}
                                                    </span>
                                                </p>
                                            </div>
                                        `;
                                    })}
                                </div>
                            `;
                        },
                    );
                },
            });
        },
    });

    const contrastsPage = defineBookPage({
        parent: topColorsPage,
        title: 'Palette Contrast',
    });

    function createContrastPage(
        contrastPageTitle: string,
        contrastCellsInput:
            | ReadonlyArray<Readonly<ContrastCell>>
            | ((currentColors: ReadonlyArray<Readonly<PaletteColor>>) => ContrastCell[]),
    ) {
        return defineBookPage({
            parent: contrastsPage,
            title: `${title} ${contrastPageTitle}`,
            defineExamples({defineExample}) {
                Object.entries(colorGroups).forEach(
                    ([
                        groupName,
                        colors,
                    ]) => {
                        const contrastCells = check.isArray(contrastCellsInput)
                            ? contrastCellsInput
                            : contrastCellsInput(colors);

                        defineExample({
                            title: groupName,
                            styles: css`
                                :host {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 24px;
                                }

                                p {
                                    ${noNativeSpacing}
                                }

                                .darkness-level {
                                    text-align: center;
                                    font-size: 12px;
                                    color: ${viraTheme.colors['vira-grey-foreground-header']
                                        .foreground.value};
                                }

                                td {
                                    padding: 4px;
                                    min-width: 170px;
                                }
                            `,
                            render() {
                                const colorRowTemplates = colors.map((color) => {
                                    const cellTemplates = contrastCells.map((cell) => {
                                        return html`
                                            <td>
                                                <p class="darkness-level">${color.suffix}</p>
                                                <${VirColorPair.assign({
                                                    color: {
                                                        background:
                                                            cell.background || color.definition,
                                                        foreground:
                                                            cell.foreground || color.definition,
                                                    },
                                                    showVarValues: true,
                                                    showVarNames: false,
                                                    showContrast: true,
                                                    fontWeight: cell.fontWeight,
                                                })}></${VirColorPair}>
                                            </td>
                                        `;
                                    });

                                    return html`
                                        <tr>${cellTemplates}</tr>
                                    `;
                                });

                                const headerCells = contrastCells.map((cell) => {
                                    const layerText = cell.background ? 'in back' : 'in front';

                                    const title = [
                                        cell.title,
                                        `(${layerText})`,
                                        `(${cell.fontWeight})`,
                                    ].join(' ');

                                    return html`
                                        <th>${title}</th>
                                    `;
                                });

                                return html`
                                    <table cellspacing="0" cellpadding="0">
                                        <thead><tr>${headerCells}</tr></thead>
                                        <tbody>${colorRowTemplates}</tbody>
                                    </table>
                                `;
                            },
                        });
                    },
                );
            },
        });
    }

    const blackWhiteContrastPage = createContrastPage('Contrast Black White', blackWhiteCells);

    function createSelfContrastPage(fontWeight: FontWeight) {
        return createContrastPage(`Contrast Self ${fontWeight}`, (colors) =>
            colors.map((color) => {
                return {
                    fontWeight,
                    title: color.suffix || '',
                    foreground: color.definition,
                };
            }),
        );
    }

    function createThemePages(): BookPage[] {
        const generatedTheme = buildColorTheme(colors, options);
        return createColorThemeBookPages({
            parent: topColorsPage,
            title: 'Theme (auto)',
            theme: generatedTheme.defaultLight,
            hideInverseColors: true,
            useVerticalLayout: useVerticalTheme,
            prefixGroupByCount: 2,
            overrides: [generatedTheme.darkOverride],
        });
    }

    return [
        topColorsPage,
        colorPalettePage,
        includeContrast ? contrastsPage : undefined,
        includeContrast ? blackWhiteContrastPage : undefined,
        includeContrast ? createSelfContrastPage(400) : undefined,
        includeContrast ? createSelfContrastPage(700) : undefined,
        ...(includeTheme ? createThemePages() : []),
    ].filter(check.isTruthy);
}
