// ==UserScript==
// @name         ChatGPT Quick Text Buttons
// @namespace    https://github.com/p65536
// @version      1.1.0
// @license      MIT
// @description  Adds customizable buttons to paste predefined text into the ChatGPT input field.
// @icon         https://chatgpt.com/favicon.ico
// @author       p65536
// @match        https://chatgpt.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
    'use strict';

    // =================================================================================
    // SECTION: Constants and Default Configuration
    // =================================================================================
    const CONSTANTS = {
        CONFIG_KEY: 'cqtb_config',
        ID_PREFIX: 'cqtb-id-',
        TEXT_LIST_WIDTH: 500,
        HIDE_DELAY_MS: 250,
        MODAL: {
            WIDTH: 440,
            PADDING: 16,
            RADIUS: 8,
            BTN_RADIUS: 5,
            BTN_FONT_SIZE: 13,
            BTN_PADDING: '5px 16px',
            TITLE_MARGIN_BOTTOM: 8,
            BTN_GROUP_GAP: 8,
            TEXTAREA_HEIGHT: 200,
        },
    };

    const DEFAULT_FIXED_TEXTS = {
        "Test": [
            "[TEST MESSAGE] You can ignore this message.",
            "Tell me something interesting.",
            "Based on all of our previous conversations, generate an image of me as you imagine. Make it super-realistic. Please feel free to fill in any missing information with your own imagination. Do not ask follow-up questions; generate the image immediately.",
            "Based on all of our previous conversations, generate an image of my ideal partner (opposite sex) as you imagine. Make it super-realistic. Please feel free to fill in any missing information with your own imagination. Do not ask follow-up questions; generate the image immediately.",
            "Based on all of our previous conversations, generate an image of a person who is the exact opposite of my ideal partner. Make it super-realistic. Please feel free to fill in any missing information with your own imagination. Do not ask follow-up questions; generate the image immediately."
        ],
        "Images": [
            "For each generated image, include an \"image number\" (e.g., Image 1, Image 2, ...), a title, and an image description.\n\n",
            "Refer to the body shape and illustration style in the attached images, and draw the same person. Pay special attention to maintaining character consistency.\n\n",
            "Feel free to illustrate a scene from everyday life. You can choose the composition or situation. If you are depicting consecutive scenes (a story), make sure to keep everything consistent (e.g., do not change clothing for no reason).\n\n"
        ],
        "Coding": [
            "### Code Editing Rules (Apply to the entire chat)\nStrictly follow these rules for all code suggestions, changes, optimizations, and Canvas reflection:\n1. **Do not modify any part of the code that is not being edited.**\n   * This includes blank lines, comments, variable names, order, etc. **Strictly keep all unmodified parts as is.**\n2. **Always leave concise, meaningful comments.**\n   * Limit comments to content that aids understanding or future maintenance. Do not include formal or duplicate notes.\n3. **When proposing or changing code, clearly state the intent and scope.**\n   * Example: \"Improve performance of this function,\" \"Simplify this conditional branch,\" etc.\n4. **Apply the above rules even for Canvas reflection.**\n   * Do not reformat, remove, or reorder content on the GPT side.\n5. **Preserve the overall style of the code (indentation, newlines, etc.).**\n   * Only edited parts should stand out clearly as differences.\n\n",
            "Optimize the following script according to modern design guidelines. \nWhile maintaining its purpose and function, improve the structure, readability, and extensibility.\nIf there are improvements, clearly indicate them in the code comments and compare Before→After.\n\n```\n```\n\n"
        ],
        "Summary": [
            "STEP 1: For this chat log, do not summarize, but clearly show the structure of the content. Please output in the following format:\n\n- 🔹 List of topics (each topic heading and its starting point)\n- 🧷 List of technical terms / keywords / commands / proper nouns\n- 📌 Key statements marking turning points in the discussion (quotes allowed)\n\n[NOTE]\nThe goal is not to summarize, but to \"enumerate and organize the topics.\"\nGive priority to extracting important elements while maintaining context.\n",
            "STEP 2: For this chat log, enumerate the content as it is, without summarizing or restructuring.\n\nSample output format:\n1. [Start] Consulted about PowerShell script character encoding error\n2. [Proposal] Suggested UTF-8 with BOM save\n3. [Clarification] Clarified misunderstanding about Shift-JIS (e.g., cp932)\n4. [Conclusion] Decided on UTF-8-only approach with PowerShell\n\n[NOTE]\nMaintain the original order of topics. The goal is not to summarize, but to list \"what was discussed\" and \"what conclusions were drawn.\"",
            "STEP 3: Provide a mid-level summary for each topic in this chat log.\nCompression ratio can be low. Do not omit topics, and keep granularity somewhat fine.\n\nSample output format:\n## Chat title (or date)\n\n### Topic 1: About XXXXX\n- Overview:\n- Main discussion points:\n- Tentative conclusion or direction:\n\n### Topic 2: About YYYYY\n- ...\n\n[NOTE]\nIt's okay to be verbose. Ensure important details are not omitted so that a human can organize them later.",
            "STEP 4: For each topic in this chat log, add the following indicators:\n\n- [Importance]: High / Medium / Low\n- [Reference recommended]: Yes / No (Is it worth reusing/repurposing?)\n- [Reference keywords]: About 3 search keywords\n\nThe purpose is to provide criteria for organizing or deleting this record in the future."
        ],
        "Memory": [
            "[Memory list output] Please display all currently stored model set context (memory list) for me.\nSeparate by category, output concisely and accurately.",
            "[Add to memory] Please add the following content to the model set context:\n\n[Category] (e.g., PowerShell)\n[Content]\n- Always unify the log output folder for PowerShell scripts to a \"logs\" subfolder.\n- Internal comments in scripts should be written in Japanese.\n\nPlease consistently refer to this information as context and policy in future conversations.",
            "[Edit memory] Please edit the following memory content:\n\n[Target category] PowerShell\n[Current text to be edited] The default encoding for PowerShell scripts is \"UTF-8 with BOM.\"\n[New text] The default encoding for PowerShell scripts is \"UTF-8 without BOM.\"\n\nBe sure to discard the old information and replace it with the new information.",
            "[Delete memory] Please completely delete the following memory content:\n\n[Target category] Image generation (Haruna)\n[Text to be deleted]\n- Always include an image number and situation description (caption) when generating images.\n\nEnsure that this information is completely removed and will not affect future conversations.",
            "Summarize everything you have learned about our conversation and commit it to the memory update."
        ]
    };

    // =================================================================================
    // SECTION: Utility Functions
    // =================================================================================
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const createEl = (tag, props = {}) => Object.assign(document.createElement(tag), props);

    // =================================================================================
    // SECTION: Core Functions
    // =================================================================================

    async function loadConfig(key, defaultObj) {
        try {
            const raw = await GM_getValue(key);
            return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultObj));
        } catch (e) {
            console.error('[CQTB] Config load failed:', e);
            return JSON.parse(JSON.stringify(defaultObj));
        }
    }

    async function saveConfig(key, obj) {
        try {
            await GM_setValue(key, JSON.stringify(obj));
        } catch (e) {
            console.error('[CQTB] Config save failed:', e);
        }
    }

    function insertTextIntoInputElement(text) {
        const form = $('form');
        const p = form?.querySelector('div p:last-of-type') || form?.querySelector('[contenteditable="true"]');

        if (p) {
            const isFirstInsert = !p.innerText || p.innerText.trim() === '';            
            p.innerText = isFirstInsert ? text : p.innerText + text;
            p.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            p.focus();
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(p);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (e) {
                // Failsafe for rare cases where selection might fail.
            }
        } else {
            console.error('[CQTB] Input box (p or contenteditable element) not found.');
            alert('Input box (p or contenteditable element) not found.');
        }
    }

    function createAndAttachUI(config) {
        let activeCategory = Object.keys(config)[0] || null;
        let hideTimeoutId = null;

        // --- Create Elements ---
        const settingsBtn = createEl('button', { id: `${CONSTANTS.ID_PREFIX}settings-btn`, textContent: '⚙️', title: 'Settings' });
        const insertBtn = createEl('button', { id: `${CONSTANTS.ID_PREFIX}insert-btn`, textContent: '✎', title: 'Add quick text' });
        const textList = createEl('div', { id: `${CONSTANTS.ID_PREFIX}text-list` });
        textList.innerHTML = `
            <div class="cqtb-category-tabs"></div>
            <div class="cqtb-category-separator"></div>
            <div class="cqtb-text-options"></div>
        `;

        // --- Append to DOM ---
        document.body.append(settingsBtn, insertBtn, textList);

        // --- Event Handlers & Logic ---
        const renderContent = () => {
            const tabsContainer = textList.querySelector('.cqtb-category-tabs');
            const optionsContainer = textList.querySelector('.cqtb-text-options');
            tabsContainer.innerHTML = '';
            optionsContainer.innerHTML = '';

            Object.keys(config).forEach(cat => {
                const tab = createEl('button', {
                    className: 'cqtb-category-tab' + (cat === activeCategory ? ' active' : ''),
                    innerText: cat,
                });
                tab.addEventListener('mousedown', e => {
                    e.stopPropagation();
                    activeCategory = cat;
                    renderContent();
                });
                tabsContainer.appendChild(tab);
            });

            (config[activeCategory] || []).forEach(txt => {
                const btn = createEl('button', {
                    className: 'cqtb-text-option',
                    innerText: txt.length > 100 ? `${txt.slice(0, 100)}…` : txt,
                    title: txt,
                });
                btn.addEventListener('mousedown', e => {
                    e.stopPropagation();
                    insertTextIntoInputElement(txt);
                    textList.style.display = 'none';
                });
                optionsContainer.appendChild(btn);
            });
        };

        const positionList = () => {
            requestAnimationFrame(() => {
                const btnRect = insertBtn.getBoundingClientRect();
                const margin = 8;
                const listWidth = textList.offsetWidth || CONSTANTS.TEXT_LIST_WIDTH;
                let left = btnRect.left;
                let top = btnRect.bottom + 4;
                if (left + listWidth > window.innerWidth - margin) {
                    left = window.innerWidth - listWidth - margin;
                }
                left = Math.max(left, margin);
                const listHeight = textList.offsetHeight;
                if (listHeight > 0 && top + listHeight > window.innerHeight - margin) {
                    top = Math.max(margin, btnRect.top - listHeight - 4);
                }
                textList.style.left = `${left}px`;
                textList.style.top = `${top}px`;
            });
        };

        const showList = () => {
            clearTimeout(hideTimeoutId);
            textList.style.left = '-9999px';
            textList.style.top = '0px';
            textList.style.display = 'block';
            positionList();
        };

        const startHideTimer = () => {
            hideTimeoutId = setTimeout(() => { textList.style.display = 'none'; }, CONSTANTS.HIDE_DELAY_MS);
        };

        // --- Attach Main Event Listeners ---
        insertBtn.addEventListener('mouseenter', showList);
        insertBtn.addEventListener('mouseleave', startHideTimer);
        textList.addEventListener('mouseenter', () => clearTimeout(hideTimeoutId));
        textList.addEventListener('mouseleave', startHideTimer);
        settingsBtn.addEventListener('click', () => showSettingsModal(config, newConfig => {
            config = newConfig;
            activeCategory = Object.keys(config)[0] || null; // Reset active category
            renderContent();
        }, settingsBtn));

        // --- Initial Render ---
        renderContent();
    }

    function showSettingsModal(currentConfig, onSave, anchorBtn) {
        const modalId = `${CONSTANTS.ID_PREFIX}settings-modal`;
        let dialog = $(`#${modalId}`);
        if (!dialog) {
            dialog = createEl('dialog', { id: modalId });
            dialog.innerHTML = `
                <div class="cqtb-modal-box">
                    <h5 class="cqtb-modal-title">ChatGPT Quick Text Buttons Settings</h5>
                    <textarea class="cqtb-modal-textarea" placeholder="Enter settings in JSON format..."></textarea>
                    <div class="cqtb-modal-msg-div"></div>
                    <div class="cqtb-modal-btn-group">
                        <button class="cqtb-modal-button" data-action="export">Export</button>
                        <button class="cqtb-modal-button" data-action="import">Import</button>
                        <button class="cqtb-modal-button" data-action="save">Save</button>
                        <button class="cqtb-modal-button" data-action="cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);

            dialog.addEventListener('click', e => {
                if (e.target.closest('[data-action]')) {
                    e.stopPropagation();
                    handleModalAction(e.target.closest('[data-action]').dataset.action, dialog, onSave);
                } else if (e.target === dialog) {
                    dialog.close();
                }
            });
        }

        dialog.querySelector('.cqtb-modal-msg-div').textContent = '';
        dialog.querySelector('textarea').value = JSON.stringify(currentConfig, null, 2);
        dialog.showModal();

        if (anchorBtn) {
            const modalBox = dialog.querySelector('.cqtb-modal-box');
            const btnRect = anchorBtn.getBoundingClientRect();
            const margin = 8;
            let left = btnRect.left;
            let top = btnRect.bottom + 4;
            if (left + CONSTANTS.MODAL.WIDTH > window.innerWidth - margin) {
                left = window.innerWidth - CONSTANTS.MODAL.WIDTH - margin;
            }
            const modalHeight = modalBox.offsetHeight || 350;
            if (top + modalHeight > window.innerHeight - margin) {
                top = window.innerHeight - modalHeight - margin;
            }
            Object.assign(dialog.style, {
                position: 'absolute', left: `${Math.max(left, margin)}px`,
                top: `${Math.max(top, margin)}px`, margin: '0', transform: 'none'
            });
        }
    }

    function handleModalAction(action, dialog, onSave) {
        const msgDiv = dialog.querySelector('.cqtb-modal-msg-div');
        const textarea = dialog.querySelector('.cqtb-modal-textarea');

        const showMessage = (text, color) => {
            msgDiv.textContent = text;
            msgDiv.style.color = color;
        };

        switch (action) {
            case 'cancel':
                dialog.close();
                break;
            case 'save': {
                try {
                    const newConfig = JSON.parse(textarea.value);
                    saveConfig(CONSTANTS.CONFIG_KEY, newConfig);
                    onSave(newConfig);
                    dialog.close();
                } catch (err) {
                    showMessage(`JSON parse error: ${err.message}`, 'var(--text-danger, #f33)');
                }
                break;
            }
            case 'export': {
                try {
                    const currentConfig = JSON.parse(textarea.value);
                    const jsonString = JSON.stringify(currentConfig, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = createEl('a', { href: url, download: 'cqtb_config.json' });
                    a.click();
                    URL.revokeObjectURL(url);
                    showMessage('Export successful.', 'var(--text-accent, #66b5ff)');
                } catch (err) {
                    showMessage(`Export failed: ${err.message}`, 'var(--text-danger, #f33)');
                }
                break;
            }
            case 'import': {
                const fileInput = createEl('input', { type: 'file', accept: 'application/json', style: 'display: none' });
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            try {
                                // Validate JSON before putting it in the textarea
                                JSON.parse(reader.result);
                                textarea.value = reader.result;
                                showMessage('Import successful. Click "Save" to apply.', 'var(--text-accent, #66b5ff)');
                            } catch (err) {
                                showMessage(`Import failed: ${err.message}`, 'var(--text-danger, #f33)');
                            } finally {
                                fileInput.remove();
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        fileInput.remove();
                    }
                });
                document.body.appendChild(fileInput);
                fileInput.click();
                break;
            }
        }
    }

    function injectStyles() {
        const styleId = `${CONSTANTS.ID_PREFIX}styles`;
        if ($(`#${styleId}`)) return;

        const M = CONSTANTS.MODAL;
        const style = createEl('style', { id: styleId });
        style.textContent = `
          #${CONSTANTS.ID_PREFIX}settings-btn, #${CONSTANTS.ID_PREFIX}insert-btn {
            position: fixed; top: 10px; z-index: 20000; width: 32px; height: 32px;
            border-radius: var(--radius-md, 4px); font-size: 16px; font-family: inherit;
            background: var(--interactive-bg-secondary-default); color: var(--interactive-label-secondary-default);
            border: 1px solid var(--interactive-border-secondary-default);
            cursor: pointer; transition: background 0.15s;
          }
          #${CONSTANTS.ID_PREFIX}insert-btn { right: 400px; }
          #${CONSTANTS.ID_PREFIX}settings-btn { right: 360px; }
          #${CONSTANTS.ID_PREFIX}insert-btn:hover, #${CONSTANTS.ID_PREFIX}settings-btn:hover { background: var(--interactive-bg-secondary-hover) !important; }

          #${CONSTANTS.ID_PREFIX}text-list {
            position: fixed; z-index: 20001; display: none;
            min-width: ${CONSTANTS.TEXT_LIST_WIDTH}px; max-width: ${CONSTANTS.TEXT_LIST_WIDTH}px;
            padding: 8px; border-radius: var(--radius-md, 4px);
            background: var(--main-surface-primary); color: var(--text-primary);
            border: 1px solid var(--border-light); box-shadow: var(--drop-shadow-md, 0 3px 3px #0000001f);
          }
          .cqtb-category-tabs { display: flex; margin-bottom: 5px; }
          .cqtb-category-separator { height: 1px; margin: 4px 0; background: var(--border-default); }
          .cqtb-category-tab {
            flex: 1 1 0; min-width: 0; max-width: 90px; margin-right: 4px; padding: 4px 0;
            border-radius: var(--radius-md, 4px); font-size: 12px; text-align: center;
            background: var(--interactive-bg-tertiary-default); color: var(--text-primary);
            border: 1px solid var(--border-light); cursor: pointer; transition: background 0.15s;
          }
          .cqtb-category-tab.active {
            background: var(--interactive-bg-secondary-hover); border-color: var(--border-default);
            outline: 2px solid var(--border-default);
          }
          .cqtb-text-option {
            display: block; width: 100%; margin: 4px 0; padding: 4px; font-size: 13px; text-align: left;
            border-radius: var(--radius-md, 5px); background: var(--interactive-bg-tertiary-default);
            color: var(--text-primary); border: 1px solid var(--border-default); cursor: pointer;
          }
          .cqtb-text-option:hover, .cqtb-text-option:focus {
            background: var(--interactive-bg-secondary-hover) !important;
            border-color: var(--border-default) !important; outline: 2px solid var(--border-default);
          }

          #${CONSTANTS.ID_PREFIX}settings-modal {
            padding: 0; border: none; background: transparent; max-width: 100vw;
            max-height: 100vh; overflow: visible; z-index: 21000;
          }
          #${CONSTANTS.ID_PREFIX}settings-modal::backdrop { background: rgb(0 0 0 / 0.5); }
          .cqtb-modal-box {
            width: ${M.WIDTH}px; padding: ${M.PADDING}px; border-radius: var(--radius-lg, ${M.RADIUS}px);
            background: var(--main-surface-primary); color: var(--text-primary);
            border: 1px solid var(--border-default); box-shadow: var(--drop-shadow-lg, 0 4px 16px #00000026);
          }
          .cqtb-modal-title { margin: 0 0 ${M.TITLE_MARGIN_BOTTOM}px 0; }
          .cqtb-modal-textarea {
            width: 100%; height: ${M.TEXTAREA_HEIGHT}px; box-sizing: border-box;
            font-family: monospace; font-size: 13px; margin-bottom: 0;
            border: 1px solid var(--border-default); background: var(--bg-primary); color: var(--text-primary);
          }
          .cqtb-modal-msg-div { margin-top: 4px; min-height: 1.2em; font-size: 0.9em; }
          .cqtb-modal-btn-group { display: flex; justify-content: flex-end; gap: ${M.BTN_GROUP_GAP}px; margin-top: 8px; }
          .cqtb-modal-button {
            background: var(--interactive-bg-tertiary-default); color: var(--text-primary);
            border: 1px solid var(--border-default); border-radius: var(--radius-md, ${M.BTN_RADIUS}px);
            padding: ${M.BTN_PADDING}; font-size: ${M.BTN_FONT_SIZE}px;
            cursor: pointer; transition: background 0.12s;
          }
          .cqtb-modal-button:hover {
            background: var(--interactive-bg-secondary-hover) !important;
            border-color: var(--border-default) !important;
          }
        `;
        document.head.appendChild(style);
    }

    // =================================================================================
    // SECTION: Entry Point
    // =================================================================================
    async function main() {
        // Since the UI is simple and doesn't deeply integrate with page content,
        // a single run is sufficient and robust. No re-initialization logic is needed.
        const config = await loadConfig(CONSTANTS.CONFIG_KEY, DEFAULT_FIXED_TEXTS);
        injectStyles();
        createAndAttachUI(config);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        main();
    } else {
        window.addEventListener('DOMContentLoaded', main, { once: true });
    }

})();