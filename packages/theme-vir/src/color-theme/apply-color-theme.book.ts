import {colorCss} from '@electrovir/color';
import {defineBookPage} from 'element-book';
import {css, defineElement, html, listen} from 'element-vir';
import {ViraButton, viraTheme, viraThemeDarkOverride} from 'vira';
import {applyGlobalColorTheme} from './apply-color-theme.js';
import {type ColorThemeColor} from './color-theme.js';

const VirApplyThemeDemo = defineElement()({
    tagName: 'vir-apply-theme-demo',
    styles: css`
        :host {
            display: flex;
            flex-direction: column;
            gap: 32px;
            align-items: center;
        }

        .demo-square {
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border-radius: 8px;
            text-align: center;
        }

        .squares {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
        }
    `,
    state() {
        return {
            useDarkTheme: false,
        };
    },
    render({state, updateState}) {
        const squareTemplates = Object.entries(viraTheme.colors).map((entry) => {
            /**
             * The `as` cast here may seem unnecessary, but at compile time the `dist` directory is
             * deleted, which causes the types of `viraTheme.colors` to go all screwy.
             */
            const [
                key,
                value,
            ] = entry as unknown as [string, ColorThemeColor];
            return html`
                <div class="demo-square" style=${colorCss(value)}>
                    <span>${key}</span>
                </div>
            `;
        });

        return html`
            <${ViraButton.assign({
                text: 'Toggle Theme',
            })}
                ${listen('click', () => {
                    updateState({
                        useDarkTheme: !state.useDarkTheme,
                    });
                    applyGlobalColorTheme(
                        viraTheme,
                        state.useDarkTheme ? viraThemeDarkOverride : undefined,
                    );
                })}
            ></${ViraButton}>
            <div class="squares">${squareTemplates}</div>
        `;
    },
});

export const applyColorThemeBookPage = defineBookPage({
    title: applyGlobalColorTheme.name,
    parent: undefined,
    defineExamples({defineExample}) {
        defineExample({
            title: 'example',
            render() {
                return html`
                    <${VirApplyThemeDemo}></${VirApplyThemeDemo}>
                `;
            },
        });
    },
});
