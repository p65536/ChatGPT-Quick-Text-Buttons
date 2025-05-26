// ==UserScript==
// @name         ChatGPT Quick Text Buttons
// @namespace    https://github.com/p65536
// @version      1.0
// @license      MIT
// @description  Adds customizable buttons to paste predefined text into the ChatGPT input field.
// @author       p65536
// @match        https://chatgpt.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
    'use strict';

    // =================================================================================
    // SECTION: Constants
    // =================================================================================
    const CONSTANTS = {
        TEXT_LIST_WIDTH: 500,
        MODAL_WIDTH: 440,
        MODAL_PADDING: 4,
        MODAL_RADIUS: 8,
        MODAL_BTN_RADIUS: 5,
        MODAL_BTN_FONT_SIZE: 13,
        MODAL_BTN_PADDING: '5px 16px',
        MODAL_TITLE_MARGIN_BOTTOM: 8,
        MODAL_BTN_GROUP_GAP: 8,
        MODAL_TEXTAREA_HEIGHT: 200,
        CONFIG_KEY: 'cqtb_config',
        ID_PREFIX: 'cqtb-id-',
        CLASS_CATEGORY_TAB: 'cqtb-category-tab',
        CLASS_TEXT_OPTION: 'cqtb-text-option',
        HIDE_DELAY_MS: 250,
        SPA_REINIT_DELAY_MS: 1,
        TEXT_LIST_RENDER_DELAY_MS: 1,
        MODAL_ID: 'cqtb-modal',
        CLASS_MODAL_BOX: 'cqtb-modal-box',
        CLASS_MODAL_TITLE: 'cqtb-modal-title',
        CLASS_MODAL_TEXTAREA: 'cqtb-modal-textarea',
        CLASS_MODAL_MSG_DIV: 'cqtb-modal-msg-div',
        CLASS_MODAL_BTN_GROUP: 'cqtb-modal-btn-group',
        CLASS_MODAL_BUTTON: 'cqtb-modal-button',
    };

    // =================================================================================
    // SECTION: State Management
    // =================================================================================
    const state = {
        fixedTextsConfig: null,
        activeCategory: null,
        ui: {
            insertBtn: null,
            settingsBtn: null,
            textList: null,
            categoryTabs: null,
            categorySeparator: null,
            textOptionsContainer: null,
            styleElement: null,
            settingsModalOverlay: null,
        },
        hideTimeoutId: null,
        domObserver: null,
    };

    // =================================================================================
    // SECTION: Default Configuration Data
    // =================================================================================
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
    // SECTION: DOM Utilities
    // =================================================================================
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const createEl = (tag, props = {}) => Object.assign(document.createElement(tag), props);

    // =================================================================================
    // SECTION: Configuration Load/Save
    // =================================================================================
    async function loadConfig(key, defaultObj) {
        try {
            const raw = await GM_getValue(key);
            if (raw) {
                return JSON.parse(raw);
            }
            return JSON.parse(JSON.stringify(defaultObj));
        } catch (e) {
            console.error(`CQTB: Failed to load or parse config for key "${key}". Using default config. Error:`, e);
            return JSON.parse(JSON.stringify(defaultObj));
        }
    }

    async function saveConfig(key, obj) {
        try {
            await GM_setValue(key, JSON.stringify(obj));
        } catch (e) {
            console.error(`CQTB: Failed to save config for key "${key}". Error:`, e);
        }
    }

    // =================================================================================
    // SECTION: CSS Styling
    // =================================================================================
    function initializeAndApplyStyles() {
        if (!state.ui.styleElement) {
            state.ui.styleElement = createEl('style');
            document.head.appendChild(state.ui.styleElement);
        }
        state.ui.styleElement.textContent = `
          #${CONSTANTS.ID_PREFIX}insert-btn, #${CONSTANTS.ID_PREFIX}settings-btn {
            position: fixed; top: 10px; z-index: 20000; width: 32px; height: 32px;
            border-radius: var(--radius-md, 4px); font-size: 16px; font-family: inherit;
            background: var(--interactive-bg-secondary-default);
            color: var(--interactive-label-secondary-default);
            border: 1px solid var(--interactive-border-secondary-default);
            cursor: pointer; transition: background 0.15s;
          }
          #${CONSTANTS.ID_PREFIX}insert-btn { right: 400px; }
          #${CONSTANTS.ID_PREFIX}settings-btn { right: 360px; }
          #${CONSTANTS.ID_PREFIX}insert-btn:hover,
          #${CONSTANTS.ID_PREFIX}settings-btn:hover {
            background: var(--interactive-bg-secondary-hover) !important;
          }
          #${CONSTANTS.ID_PREFIX}text-list {
            position: fixed;
            left: -9999px; top: 0; z-index: 20001; display: none;
            min-width: ${CONSTANTS.TEXT_LIST_WIDTH}px; max-width: ${CONSTANTS.TEXT_LIST_WIDTH}px; width: ${CONSTANTS.TEXT_LIST_WIDTH}px;
            padding: 8px; border-radius: var(--radius-md, 4px);
            background: var(--main-surface-primary); color: var(--text-primary);
            border: 1px solid var(--border-light);
            box-shadow: var(--drop-shadow-md, 0 3px 3px #0000001f);
          }
          #${CONSTANTS.ID_PREFIX}category-tabs { display: flex; margin-bottom: 5px; }
          .${CONSTANTS.CLASS_CATEGORY_TAB} {
            flex: 1 1 0; min-width: 0; max-width: 90px; width: 80px; margin-right: 4px;
            padding: 4px 0; border-radius: var(--radius-md, 4px); font-size: 12px; font-family: inherit;
            text-align: center; background: var(--interactive-bg-tertiary-default);
            color: var(--text-primary); border: 1px solid var(--border-light);
            cursor: pointer; transition: background 0.15s;
          }
          .${CONSTANTS.CLASS_CATEGORY_TAB}.active {
            background: var(--interactive-bg-secondary-hover);
            border-color: var(--border-default); outline: 2px solid var(--border-default);
          }
          #${CONSTANTS.ID_PREFIX}category-separator { height: 1px; margin: 4px 0; background: var(--border-default); }
          .${CONSTANTS.CLASS_TEXT_OPTION} {
            display: block; width: 100%; min-width: 0; margin: 4px 0; padding: 4px;
            border-radius: var(--radius-md, 5px); font-size: 13px; font-family: inherit;
            text-align: left;
            background: var(--interactive-bg-tertiary-default);
            color: var(--text-primary); border: 1px solid var(--border-default);
            cursor: pointer;
          }
          .${CONSTANTS.CLASS_TEXT_OPTION}:hover,
          .${CONSTANTS.CLASS_TEXT_OPTION}:focus {
            background: var(--interactive-bg-secondary-hover) !important;
            border-color: var(--border-default) !important; outline: 2px solid var(--border-default);
          }

          #${CONSTANTS.MODAL_ID} {
            display: none; position: fixed; z-index: 2147483648; left: 0; top: 0;
            width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); pointer-events: auto;
          }
          .${CONSTANTS.CLASS_MODAL_BOX} {
            position: absolute; width: ${CONSTANTS.MODAL_WIDTH}px; padding: ${CONSTANTS.MODAL_PADDING}px;
            border-radius: var(--radius-lg, ${CONSTANTS.MODAL_RADIUS}px); background: var(--main-surface-primary);
            color: var(--text-primary); border: 1px solid var(--border-default);
            box-shadow: var(--drop-shadow-lg, 0 4px 16px #00000026);
          }
          .${CONSTANTS.CLASS_MODAL_TITLE} {
            margin-top: 0; margin-bottom: ${CONSTANTS.MODAL_TITLE_MARGIN_BOTTOM}px;
          }
          .${CONSTANTS.CLASS_MODAL_TEXTAREA} {
            width: 100%; height: ${CONSTANTS.MODAL_TEXTAREA_HEIGHT}px; box-sizing: border-box;
            font-family: monospace; font-size: 13px; margin-bottom: 0;
            border: 1px solid var(--border-default); background: var(--bg-primary); color: var(--text-primary);
          }
          .${CONSTANTS.CLASS_MODAL_MSG_DIV} {
            color: var(--text-danger,#f33); margin-top: 2px; min-height: 4px;
          }
          .${CONSTANTS.CLASS_MODAL_BTN_GROUP} {
            display: flex; flex-wrap: wrap; justify-content: flex-end;
            gap: ${CONSTANTS.MODAL_BTN_GROUP_GAP}px; margin-top: 8px;
          }
          .${CONSTANTS.CLASS_MODAL_BUTTON} {
            background: var(--interactive-bg-tertiary-default); color: var(--text-primary);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md, ${CONSTANTS.MODAL_BTN_RADIUS}px);
            padding: ${CONSTANTS.MODAL_BTN_PADDING}; font-size: ${CONSTANTS.MODAL_BTN_FONT_SIZE}px;
            cursor: pointer; transition: background 0.12s;
          }
          .${CONSTANTS.CLASS_MODAL_BUTTON}:hover {
            background: var(--interactive-bg-secondary-hover) !important;
            border-color: var(--border-default) !important;
          }
       `;
    }

    // =================================================================================
    // SECTION: UI Element Creation
    // =================================================================================
    function createAndReferenceUIElements() {
        state.ui.insertBtn = createEl('button', {
            id: `${CONSTANTS.ID_PREFIX}insert-btn`, textContent: '✎', title: 'Add quick text', type: 'button'
        });
        state.ui.settingsBtn = createEl('button', {
            id: `${CONSTANTS.ID_PREFIX}settings-btn`, textContent: '⚙️', title: 'Settings (ChatGPT Quick Text Buttons)', type: 'button'
        });
        state.ui.textList = createEl('div', { id: `${CONSTANTS.ID_PREFIX}text-list` });
        state.ui.categoryTabs = createEl('div', { id: `${CONSTANTS.ID_PREFIX}category-tabs` });
        state.ui.categorySeparator = createEl('div', { id: `${CONSTANTS.ID_PREFIX}category-separator` });
        state.ui.textOptionsContainer = createEl('div', { id: `${CONSTANTS.ID_PREFIX}text-options` });
        state.ui.textList.append(state.ui.categoryTabs, state.ui.categorySeparator, state.ui.textOptionsContainer);

        state.ui.insertBtn.addEventListener('mouseenter', () => {
            clearTimeout(state.hideTimeoutId);
            showTextListBelowButton();
        });
        state.ui.insertBtn.addEventListener('mouseleave', () => {
            state.hideTimeoutId = setTimeout(() => {
                if (!state.ui.insertBtn.matches(':hover') && !state.ui.textList.matches(':hover')) {
                    state.ui.textList.style.display = 'none';
                }
            }, CONSTANTS.HIDE_DELAY_MS);
        });

        state.ui.textList.addEventListener('mouseenter', () => {
            clearTimeout(state.hideTimeoutId);
        });
        state.ui.textList.addEventListener('mouseleave', () => {
            state.hideTimeoutId = setTimeout(() => {
                if (!state.ui.insertBtn.matches(':hover') && !state.ui.textList.matches(':hover')) {
                    state.ui.textList.style.display = 'none';
                }
            }, CONSTANTS.HIDE_DELAY_MS);
        });

        state.ui.settingsBtn.onclick = () => {
            if (state.ui.settingsModalOverlay && state.ui.settingsModalOverlay.parentNode) {
                state.ui.settingsModalOverlay.remove();
            }
            state.ui.settingsModalOverlay = null;

            ensureModalIsSetup();

            if (state.ui.settingsModalOverlay && typeof state.ui.settingsModalOverlay.open === 'function') {
                state.ui.settingsModalOverlay.open();
            } else {
                console.error("CQTB: Failed to create or open settings modal.", state.ui.settingsModalOverlay);
            }
        };
    }


    // =================================================================================
    // SECTION: Settings Modal
    // =================================================================================
    async function handleSaveQuickTextConfig(obj) {
        await saveConfig(CONSTANTS.CONFIG_KEY, obj);
        state.fixedTextsConfig = obj;
        state.activeCategory = Object.keys(state.fixedTextsConfig)[0] || null;
        renderCategories();
        if (state.activeCategory) {
            renderTextOptions(state.activeCategory);
        }
    }

    async function handleGetCurrentModalConfig() {
        return await loadConfig(CONSTANTS.CONFIG_KEY, DEFAULT_FIXED_TEXTS);
    }

    function ensureModalIsSetup() {
        if (!state.ui.settingsModalOverlay) {
            state.ui.settingsModalOverlay = buildSettingsModal({
                modalId: CONSTANTS.MODAL_ID,
                titleText: 'ChatGPT Quick Text Buttons Settings',
                onSave: handleSaveQuickTextConfig,
                getCurrentConfig: handleGetCurrentModalConfig,
                anchorBtn: state.ui.settingsBtn
            });
        }
    }

    function buildSettingsModal({ modalId, titleText, onSave, getCurrentConfig, anchorBtn }) {
        let modalOverlay = document.getElementById(modalId);
        if (modalOverlay) return modalOverlay;

        modalOverlay = createEl('div');
        modalOverlay.id = modalId;

        const modalBox = createEl('div');
        modalBox.className = CONSTANTS.CLASS_MODAL_BOX;

        const modalTitle = createEl('h5', { innerText: titleText });
        modalTitle.className = CONSTANTS.CLASS_MODAL_TITLE;

        const textarea = createEl('textarea', { placeholder: 'Enter settings in JSON format...' });
        textarea.className = CONSTANTS.CLASS_MODAL_TEXTAREA;

        const msgDiv = createEl('div');
        msgDiv.className = CONSTANTS.CLASS_MODAL_MSG_DIV;

        const btnGroup = createEl('div');
        btnGroup.className = CONSTANTS.CLASS_MODAL_BTN_GROUP;

        const btnExport = createEl('button', { type: 'button', innerText: 'Export' });
        btnExport.className = CONSTANTS.CLASS_MODAL_BUTTON;
        const btnImport = createEl('button', { type: 'button', innerText: 'Import' });
        btnImport.className = CONSTANTS.CLASS_MODAL_BUTTON;
        const btnSave = createEl('button', { type: 'button', innerText: 'Save' });
        btnSave.className = CONSTANTS.CLASS_MODAL_BUTTON;
        const btnCancel = createEl('button', { type: 'button', innerText: 'Cancel' });
        btnCancel.className = CONSTANTS.CLASS_MODAL_BUTTON;

        btnGroup.append(btnExport, btnImport, btnSave, btnCancel);
        modalBox.append(modalTitle, textarea, btnGroup, msgDiv);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        function closeModal() {
            modalOverlay.style.display = 'none';
        }

        btnExport.addEventListener('click', async () => {
            try {
                const config = await getCurrentConfig();
                const jsonString = JSON.stringify(config, null, 2);
                const filename = 'cqtb_config.json';
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = createEl('a', { href: url, download: filename });
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                msgDiv.textContent = 'Export successful.'; msgDiv.style.color = 'var(--text-accent, #66b5ff)';
            } catch (e) {
                msgDiv.textContent = 'Export failed: ' + e.message; msgDiv.style.color = 'var(--text-danger,#f33)';
            }
        });

        btnImport.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const importedConfig = JSON.parse(e.target.result);
                            textarea.value = JSON.stringify(importedConfig, null, 2);
                            msgDiv.textContent = 'Import successful. Click "Save" to apply the themes.';
                            msgDiv.style.color = 'var(--text-accent, #66b5ff)';
                        } catch (err) {
                            msgDiv.textContent = 'Import failed: ' + err.message;
                            msgDiv.style.color = 'var(--text-danger,#f33)';
                        } finally {
                            document.body.removeChild(fileInput);
                        }
                    };
                    reader.readAsText(file);
                } else {
                    document.body.removeChild(fileInput);
                }
            });
            fileInput.click();
        });

        btnSave.addEventListener('click', async () => {
            try {
                const obj = JSON.parse(textarea.value);
                await onSave(obj);
                closeModal();
            } catch (e) {
                msgDiv.textContent = 'JSON parse error: ' + e.message; msgDiv.style.color = 'var(--text-danger,#f33)';
            }
        });

        btnCancel.addEventListener('click', closeModal);
        modalOverlay.addEventListener('mousedown', e => { if (e.target === modalOverlay) closeModal(); });

        async function openModal() {
            let cfg = await getCurrentConfig();
            textarea.value = JSON.stringify(cfg, null, 2);
            msgDiv.textContent = '';

            const modalBoxElement = modalOverlay.firstChild;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (anchorBtn && typeof anchorBtn.getBoundingClientRect === 'function') {
                        const btnRect = anchorBtn.getBoundingClientRect();
                        if (btnRect.width === 0 && btnRect.height === 0 && btnRect.top === 0 && btnRect.left === 0) {
                            console.error("CQTB Error: Anchor button for modal has no dimensions or is not visible. Modal will use fallback position.", anchorBtn);
                            modalBoxElement.style.left = '50%';
                            modalBoxElement.style.top = '120px';
                            modalBoxElement.style.transform = 'translateX(-50%)';
                        } else {
                            const margin = 8;
                            let left = btnRect.left;
                            let top = btnRect.bottom + 4;

                            if (left + CONSTANTS.MODAL_WIDTH > window.innerWidth - margin) {
                                left = window.innerWidth - CONSTANTS.MODAL_WIDTH - margin;
                            }
                            left = Math.max(left, margin);

                            const modalHeight = modalBoxElement.offsetHeight || (CONSTANTS.MODAL_TEXTAREA_HEIGHT + 100);
                            if (top + modalHeight > window.innerHeight - margin) {
                                top = window.innerHeight - modalHeight - margin;
                            }
                            top = Math.max(top, margin);

                            modalBoxElement.style.left = `${left}px`;
                            modalBoxElement.style.top = `${top}px`;
                            modalBoxElement.style.transform = '';
                        }
                    } else {
                        console.warn("CQTB: Anchor button not available or not visible for modal positioning. Using fallback.");
                        modalBoxElement.style.left = '50%';
                        modalBoxElement.style.top = '120px';
                        modalBoxElement.style.transform = 'translateX(-50%)';
                    }
                    modalOverlay.style.display = 'block';
                }, CONSTANTS.TEXT_LIST_RENDER_DELAY_MS);
            });
        }
        modalOverlay.open = openModal;
        modalOverlay.close = closeModal;
        return modalOverlay;
    }

    // =================================================================================
    // SECTION: UI Appending and Rendering
    // =================================================================================
    function appendUIElements() {
        [
            CONSTANTS.ID_PREFIX + 'insert-btn',
            CONSTANTS.ID_PREFIX + 'settings-btn',
            CONSTANTS.ID_PREFIX + 'text-list'
        ].forEach(id => {
            const old = document.getElementById(id);
            if (old) old.remove();
        });
        document.body.appendChild(state.ui.insertBtn);
        document.body.appendChild(state.ui.settingsBtn);
        document.body.appendChild(state.ui.textList);
    }

    function reloadAndRenderUI() {
        if (!state.fixedTextsConfig) state.fixedTextsConfig = { ...DEFAULT_FIXED_TEXTS };
        if (!state.activeCategory || !state.fixedTextsConfig[state.activeCategory]) {
            state.activeCategory = Object.keys(state.fixedTextsConfig)[0] || null;
        }
        renderCategories();
        if(state.activeCategory) renderTextOptions(state.activeCategory);
    }

    function renderCategories() {
        state.ui.categoryTabs.innerHTML = '';
        const cats = Object.keys(state.fixedTextsConfig);
        cats.forEach((cat) => {
            const tab = createEl('button', {
                className: CONSTANTS.CLASS_CATEGORY_TAB + (cat === state.activeCategory ? ' active' : ''),
                innerText: cat,
                type: 'button'
            });
            tab.addEventListener('mousedown', e => {
                e.stopPropagation();
                state.activeCategory = cat;
                renderCategories();
                renderTextOptions(cat);
            });
            state.ui.categoryTabs.appendChild(tab);
        });
    }

    function renderTextOptions(cat) {
        state.ui.textOptionsContainer.innerHTML = '';
        const texts = state.fixedTextsConfig[cat] || [];
        texts.forEach(txt => {
            const btn = createEl('button', {
                type: 'button', className: CONSTANTS.CLASS_TEXT_OPTION,
                innerText: txt.length > 100 ? txt.slice(0, 100) + "…" : txt,
                title: txt
            });
            btn.addEventListener('mousedown', e => {
                e.stopPropagation();
                insertTextIntoInputElement(txt);
                state.ui.textList.style.display = 'none';
            });
            state.ui.textOptionsContainer.appendChild(btn);
        });
    }

    function insertTextIntoInputElement(text) {
        const form = $('form');
        const p = form?.querySelector('div p:last-of-type') ||
              form?.querySelector('[contenteditable="true"]');
        if (p) {
            p.innerText = p.innerText.trim() ? p.innerText + text : text;
            p.focus();
        } else {
            console.error('CQTB: Input box (p element) not found.', { form });
            alert('Input box (p element) not found.');
        }
    }

    // =================================================================================
    // SECTION: Text List Display Logic
    // =================================================================================
    function showTextListBelowButton() {
        if (!state.ui.insertBtn || !state.ui.textList) {
            console.error('CQTB: UI Node Reference Error（insertBtn/textList）', state.ui);
            return;
        }
        state.ui.textList.style.display = 'block';
        state.ui.textList.style.left = '-9999px';
        state.ui.textList.style.top = '0px';

        requestAnimationFrame(() => {
            setTimeout(() => {
                if (!state.ui.insertBtn || !state.ui.textList || state.ui.textList.style.display === 'none') return;

                const btnRect = state.ui.insertBtn.getBoundingClientRect();
                if (btnRect.width === 0 && btnRect.height === 0 && btnRect.top === 0 && btnRect.left === 0) {
                    state.ui.textList.style.display = 'none';
                    return;
                }

                const winWidth = state.ui.textList.offsetWidth || CONSTANTS.TEXT_LIST_WIDTH;
                const margin = 8;
                let left = btnRect.left;
                let top = btnRect.bottom + 4;

                if (left + winWidth > window.innerWidth - margin) {
                    left = window.innerWidth - winWidth - margin;
                }
                left = Math.max(left, margin);

                const listHeight = state.ui.textList.offsetHeight;
                if (listHeight > 0 && top + listHeight > window.innerHeight - margin) {
                    top = Math.max(margin, window.innerHeight - listHeight - margin);
                    if (top < btnRect.top) {
                        top = Math.max(margin, btnRect.top - listHeight - 4);
                    }
                }
                top = Math.max(top, margin);

                state.ui.textList.style.left = `${left}px`;
                state.ui.textList.style.top = `${top}px`;
            }, CONSTANTS.TEXT_LIST_RENDER_DELAY_MS);
        });
    }

    // =================================================================================
    // SECTION: Initialization and SPA Handling
    // =================================================================================
    async function initializeScript() {
        createAndReferenceUIElements();
        appendUIElements();
        initializeAndApplyStyles();

        state.fixedTextsConfig = await loadConfig(CONSTANTS.CONFIG_KEY, DEFAULT_FIXED_TEXTS);
        reloadAndRenderUI();
        state.ui.textList.style.display = 'none';
    }

    function setupSPAObserver() {
        window.addEventListener('load', initializeScript);
        ['pushState', 'replaceState'].forEach(fn => {
            const orig = history[fn];
            history[fn] = function (...args) {
                orig.apply(this, args);
                setTimeout(initializeScript, CONSTANTS.SPA_REINIT_DELAY_MS);
            };
        });
        window.addEventListener('popstate', () => setTimeout(initializeScript, CONSTANTS.SPA_REINIT_DELAY_MS));

        state.domObserver = new MutationObserver(() => {
            if (
                !document.getElementById(`${CONSTANTS.ID_PREFIX}insert-btn`) ||
                !document.getElementById(`${CONSTANTS.ID_PREFIX}settings-btn`)
            ) {
                initializeScript();
            }
        });

        state.domObserver.observe(document.body, { childList: true, subtree: false });
    }

    // =================================================================================
    // SECTION: Entry Point
    // =================================================================================
    setupSPAObserver();
    initializeScript();

})();