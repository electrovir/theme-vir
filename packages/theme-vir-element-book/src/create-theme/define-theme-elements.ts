import {getEnumValues, getObjectTypedValues, typedObjectFromEntries} from '@augment-vir/common';
import {css, defineElement, html, unsafeCSS, type HostClass} from 'element-vir';
import {createFontStyleCss} from './font-css.js';
import {HeadingLevel, type AllThemeOptions} from './theme-options.js';
import {type Theme} from './theme.js';

export function defineThemeElements<TagPrefix extends string>(
    options: Pick<AllThemeOptions<TagPrefix>, 'elementTagPrefix' | 'font'>,
): Theme<TagPrefix>['elements'] {
    const themeElements: Theme<TagPrefix>['elements'] = {
        bold: defineElement()({
            tagName: `${options.elementTagPrefix}-b`,
            styles: css`
                :host {
                    display: inline;
                    ${createFontStyleCss(options.font.bold)}
                }

                b {
                    all: inherit;
                }
            `,
            render() {
                return html`
                    <b><slot></slot></b>
                `;
            },
        }),
        monospace: defineElement()({
            tagName: `${options.elementTagPrefix}-monospace`,
            styles: css`
                :host {
                    display: inline;
                    ${createFontStyleCss(options.font.monospace)}
                }
            `,
            render() {
                return html`
                    <slot></slot>
                `;
            },
        }),
        code: defineElement()({
            tagName: `${options.elementTagPrefix}-code`,
            styles: css`
                :host {
                    display: inline;
                    ${createFontStyleCss(options.font.monospace)}
                }
            `,
            render() {
                return html`
                    <code><slot></slot></code>
                `;
            },
        }),
        paragraph: defineElement()({
            tagName: `${options.elementTagPrefix}-p`,
            styles: css`
                :host {
                    display: block;
                    ${createFontStyleCss(options.font.bold)}
                }

                p {
                    all: inherit;
                }
            `,
            render() {
                return html`
                    <p><slot></slot></p>
                `;
            },
        }),
        heading: defineHeadingElement(options),
    };

    return themeElements;
}

/**
 * `NoInfer` matches how `element-vir` constrains host class keys. Without it, TypeScript cannot
 * relate this template literal to the constraint while `TagPrefix` is still generic.
 */
type HeadingHostClassKey<TagPrefix extends string> = `${NoInfer<`${TagPrefix}-heading`>}-${string}`;

function defineHeadingElement<TagPrefix extends string>(
    options: Pick<AllThemeOptions<TagPrefix>, 'elementTagPrefix' | 'font'>,
) {
    const headingTag = `${options.elementTagPrefix}-heading` as const;

    const headingSelectors = unsafeCSS(getEnumValues(HeadingLevel).join(', '));
    return defineElement<{headingLevel: HeadingLevel}>()({
        tagName: headingTag,
        hostClasses: typedObjectFromEntries(
            /**
             * `mapEnumToObject` cannot be used here: host class keys must be prefixed with the
             * element's tag name, not the bare enum values.
             */
            // eslint-disable-next-line @virmator/prefer-map-enum-to-object
            getEnumValues(HeadingLevel).map(
                (
                    headingLevel,
                ): [
                    HeadingHostClassKey<TagPrefix>,
                    (params: {inputs: {headingLevel: HeadingLevel}}) => boolean,
                ] => {
                    return [
                        `${headingTag}-${headingLevel}` satisfies `${TagPrefix}-heading-${string}` as HeadingHostClassKey<TagPrefix>,
                        ({inputs}) => inputs.headingLevel === headingLevel,
                    ];
                },
            ),
        ),
        styles: ({hostClasses}) => {
            const hostClassValues = getObjectTypedValues(hostClasses) as HostClass[];

            return css`
                :host {
                    display: block;
                }

                ${unsafeCSS(
                    hostClassValues
                        .map((hostClass) => {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            const headingLevel = String(hostClass.name)
                                .split('-')
                                .slice(-1)[0]! as HeadingLevel;
                            return css`
                                ${hostClass.selector} {
                                    ${createFontStyleCss(options.font.headings[headingLevel])}
                                }
                            `;
                        })
                        .join('\n'),
                )}

                ${headingSelectors} {
                    all: inherit;
                }
            `;
        },
        render({inputs}) {
            const headingTag = inputs.headingLevel;

            return html`
                <${headingTag}><slot></slot></${headingTag}>
            `;
        },
    });
}
