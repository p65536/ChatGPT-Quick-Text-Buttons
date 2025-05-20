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

    // --- Customize settings below! ---
    const textListWidth = 500;
    const textListAlign = "left"; // "center"|"left"|"custom"
    const customPosition = { left: 300, top: 150 };
    // --------------------------------

    // --- Common Settings for Modal Functions ---
    const MODAL_WIDTH = 440;
    const MODAL_PADDING = 4;
    const MODAL_RADIUS = 8;
    const MODAL_BTN_RADIUS = 5;
    const MODAL_BTN_FONT_SIZE = 13;
    const MODAL_BTN_PADDING = '5px 16px';
    const MODAL_TITLE_MARGIN_BOTTOM = 8;
    const MODAL_BTN_GROUP_GAP = 8;
    const MODAL_TEXTAREA_HEIGHT = 200;

    // DOM utilities
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const createEl = (tag, props = {}) => Object.assign(document.createElement(tag), props);

    // ---- Default Settings ----
    const defaultFixedTexts = {
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

    // ---- Common functions (load/save) ----
    const CONFIG_KEY = 'cqtb_config';
    async function loadConfig(key, defaultObj) {
        try {
            const raw = await GM_getValue(key);
            return raw ? JSON.parse(raw) : {...defaultObj};
        } catch {
            return {...defaultObj};
        }
    }
    async function saveConfig(key, obj) {
        await GM_setValue(key, JSON.stringify(obj));
    }

    // ---- Cache settings ----
    let FIXED_TEXTS_CONFIG = null;

    // --- CSS for all UI components (ChatGPT Theme Color) ---
    const style = createEl('style', {
        textContent: `
          #cqtb-id-insert-btn, #cqtb-id-settings-btn {
            position: fixed;
            top: 10px;
            z-index: 20000;
            width: 32px;
            height: 32px;
            border-radius: var(--radius-md, 4px);
            font-size: 16px;
            font-family: inherit;
            background: var(--interactive-bg-secondary-default) !important;
            color: var(--interactive-label-secondary-default) !important;
            border: 1px solid var(--interactive-border-secondary-default) !important;
            cursor: pointer;
            transition: background 0.15s;
          }
          #cqtb-id-insert-btn { right: 400px; }
          #cqtb-id-settings-btn { right: 360px; }
          #cqtb-id-insert-btn:hover,
          #cqtb-id-settings-btn:hover {
            background: var(--interactive-bg-secondary-hover) !important;
          }
          #cqtb-id-text-list {
            position: absolute;
            left: -9999px;
            top: 0;
            z-index: 20001;
            display: none;
            min-width: ${textListWidth}px;
            max-width: ${textListWidth}px;
            width: ${textListWidth}px;
            padding: 8px;
            border-radius: var(--radius-md, 4px);
            background: var(--main-surface-primary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-light) !important;
            box-shadow: var(--drop-shadow-md, 0 3px 3px #0000001f);
          }
          #cqtb-id-category-tabs {
            display: flex;
            margin-bottom: 5px;
          }
          .cqtb-category-tab {
            flex: 1 1 0;
            min-width: 0;
            max-width: 90px;
            width: 80px;
            margin-right: 4px;
            padding: 4px 0;
            border-radius: var(--radius-md, 4px);
            font-size: 12px;
            font-family: inherit;
            text-align: center;
            background: var(--interactive-bg-tertiary-default) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-light) !important;
            cursor: pointer;
            overflow-x: auto;
            transition: background 0.15s;
          }
          .cqtb-category-tab.active {
            background: var(--interactive-bg-tertiary-hover) !important;
            border-color: var(--border-default) !important;
            outline: 2px solid var(--border-default);
          }
          #cqtb-id-category-separator {
            height: 1px;
            margin: 4px 0;
            background: var(--border-default) !important;
          }
          .cqtb-text-option {
            display: block;
            width: 100%;
            min-width: 0;
            margin: 4px 0;
            padding: 4px;
            border-radius: var(--radius-md, 5px);
            font-size: 13px;
            font-family: inherit;
            text-align: left;
            white-space: pre-wrap;
            overflow-wrap: break-word;
            word-break: break-word;
            background: var(--interactive-bg-tertiary-default) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-default) !important;
            cursor: pointer;
          }
          .cqtb-text-option:hover,
          .cqtb-text-option:focus {
            background: var(--interactive-bg-tertiary-hover) !important;
            border-color: var(--border-default) !important;
            outline: 2px solid var(--border-default);
          }
       `
    });
    document.head.appendChild(style);

    // ---- UI elements ----
    const insertBtn = createEl('button', {
        id: 'cqtb-id-insert-btn', textContent: '✎', title: 'Add quick text', type: 'button'
    });
    const settingsBtn = createEl('button', {
        id: 'cqtb-id-settings-btn', textContent: '⚙️', title: 'Settings (ChatGPT Quick Text Buttons)', type: 'button'
    });
    const textList = createEl('div', { id: 'cqtb-id-text-list' });
    const categoryTabs = createEl('div', { id: 'cqtb-id-category-tabs' });
    const categorySeparator = createEl('div', { id: 'cqtb-id-category-separator' });
    const textOptions = createEl('div', { id: 'cqtb-id-text-options' });
    textList.append(categoryTabs, categorySeparator, textOptions);

    // --- Standardized Modal Implementation ---
    let cqtbSettingsModal = null;
    async function saveQuickTextConfig(obj) {
        await saveConfig(CONFIG_KEY, obj);
        FIXED_TEXTS_CONFIG = obj;
        activeCategory = Object.keys(FIXED_TEXTS_CONFIG)[0];
        renderCategories();
        renderTextOptions(activeCategory);
    }
    async function getCurrentConfig() {
        return await loadConfig(CONFIG_KEY, defaultFixedTexts);
    }
    function setupModalIfNeeded() {
        if (!cqtbSettingsModal) {
            cqtbSettingsModal = setupSettingsModal({
                modalId: 'cqtb-modal',
                titleText: 'ChatGPT Quick Text Buttons Settings',
                onSave: saveQuickTextConfig,
                getCurrentConfig: getCurrentConfig,
                anchorBtn: settingsBtn
            });
        }
    }

    // Modal Functions
    function setupSettingsModal({ modalId, titleText, onSave, getCurrentConfig, anchorBtn }) {
        let modalOverlay = document.getElementById(modalId);
        if (modalOverlay) return modalOverlay;

        // styles for hover (Prevent duplication with ID)
        if (!document.getElementById('cpta-modal-btn-hover-style')) {
            const style = document.createElement('style');
            style.id = 'cpta-modal-btn-hover-style';
            style.textContent = `
            #${modalId} button:hover {
                background: var(--interactive-bg-tertiary-hover) !important;
                border-color: var(--border-default) !important;
            }
        `;
            document.head.appendChild(style);
        }

        modalOverlay = document.createElement('div');
        modalOverlay.id = modalId;
        modalOverlay.style.display = 'none';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.zIndex = '2147483648';
        modalOverlay.style.left = '0';
        modalOverlay.style.top = '0';
        modalOverlay.style.width = '100vw';
        modalOverlay.style.height = '100vh';
        modalOverlay.style.background = 'none';
        modalOverlay.style.pointerEvents = 'auto';

        // modalBox
        const modalBox = document.createElement('div');
        modalBox.style.position = 'absolute';
        modalBox.style.width = MODAL_WIDTH + 'px';
        modalBox.style.padding = MODAL_PADDING + 'px';
        modalBox.style.borderRadius = `var(--radius-lg, ${MODAL_RADIUS}px)`;
        modalBox.style.background = 'var(--main-surface-primary)';
        modalBox.style.color = 'var(--text-primary)';
        modalBox.style.border = '1px solid var(--border-default)';
        modalBox.style.boxShadow = 'var(--drop-shadow-lg, 0 4px 16px #00000026)';
        // left/topはopenModal時に決定

        // Title
        const modalTitle = document.createElement('h5');
        modalTitle.innerText = titleText;
        modalTitle.style.marginTop = '0';
        modalTitle.style.marginBottom = MODAL_TITLE_MARGIN_BOTTOM + 'px';

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = MODAL_TEXTAREA_HEIGHT + 'px';
        textarea.style.boxSizing = 'border-box';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '13px';
        textarea.style.marginBottom = '0';
        textarea.style.border = '1px solid var(--border-default)';
        textarea.style.background = 'var(--bg-primary)';
        textarea.style.color = 'var(--text-primary)';

        // error messages
        const msgDiv = document.createElement('div');
        msgDiv.style.color = 'var(--text-danger,#f33)';
        msgDiv.style.marginTop = '2px';
        msgDiv.style.minHeight = '4px';

        // btnGroup
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.flexWrap = 'wrap';
        btnGroup.style.justifyContent = 'flex-end';
        btnGroup.style.gap = MODAL_BTN_GROUP_GAP + 'px';
        btnGroup.style.marginTop = '8px';

        // btnExport
        const btnExport = document.createElement('button');
        btnExport.type = 'button';
        btnExport.innerText = 'Export';
        Object.assign(btnExport.style, {
            background: 'var(--interactive-bg-tertiary-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: `var(--radius-md, ${MODAL_BTN_RADIUS}px)`,
            padding: MODAL_BTN_PADDING,
            fontSize: MODAL_BTN_FONT_SIZE + 'px',
            cursor: 'pointer',
            transition: 'background 0.12s'
        });

        // btnImport
        const btnImport = document.createElement('button');
        btnImport.type = 'button';
        btnImport.innerText = 'Import';
        Object.assign(btnImport.style, {
            background: 'var(--interactive-bg-tertiary-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: `var(--radius-md, ${MODAL_BTN_RADIUS}px)`,
            padding: MODAL_BTN_PADDING,
            fontSize: MODAL_BTN_FONT_SIZE + 'px',
            cursor: 'pointer',
            transition: 'background 0.12s'
        });

        // btnSave
        const btnSave = document.createElement('button');
        btnSave.type = 'button';
        btnSave.innerText = 'Save';
        btnSave.style.background = 'var(--interactive-bg-tertiary-default)';
        btnSave.style.color = 'var(--text-primary)';
        btnSave.style.border = '1px solid var(--border-default)';
        btnSave.style.borderRadius = `var(--radius-md, ${MODAL_BTN_RADIUS}px)`;
        btnSave.style.padding = MODAL_BTN_PADDING;
        btnSave.style.fontSize = MODAL_BTN_FONT_SIZE + 'px';
        btnSave.style.cursor = 'pointer';
        btnSave.style.transition = 'background 0.12s';

        // btnCancel
        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.innerText = 'Cancel';
        btnCancel.style.background = 'var(--interactive-bg-tertiary-default)';
        btnCancel.style.color = 'var(--text-primary)';
        btnCancel.style.border = '1px solid var(--border-default)';
        btnCancel.style.borderRadius = `var(--radius-md, ${MODAL_BTN_RADIUS}px)`;
        btnCancel.style.padding = MODAL_BTN_PADDING;
        btnCancel.style.fontSize = MODAL_BTN_FONT_SIZE + 'px';
        btnCancel.style.cursor = 'pointer';
        btnCancel.style.transition = 'background 0.12s';

        btnGroup.append(btnExport, btnImport, btnSave, btnCancel);
        modalBox.append(modalTitle, textarea, btnGroup, msgDiv);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        // Click to close
        function closeModal() { modalOverlay.style.display = 'none'; }

        // Export (Event Listener)
        btnExport.addEventListener('click', async () => {
            try {
                const config = await getCurrentConfig();
                const jsonString = JSON.stringify(config, null, 2);
                const filename = 'cqtb_config.json';
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                msgDiv.textContent = 'Export successful.';
                msgDiv.style.color = 'var(--text-accent, #66b5ff)';
            } catch (e) {
                msgDiv.textContent = 'Export failed: ' + e.message;
                msgDiv.style.color = 'var(--text-danger,#f33)';
            }
        });

        // Import (Event Listener)
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

        // Save (Event Listener)
        btnSave.addEventListener('click', async () => {
            try {
                const obj = JSON.parse(textarea.value);
                await onSave(obj);
                closeModal();
            } catch (e) {
                msgDiv.textContent = 'JSON parse error: ' + e.message;
                msgDiv.style.color = 'var(--text-danger,#f33)';
            }
        });

        // Cancel (Event Listener)
        btnCancel.addEventListener('click', closeModal);
        modalOverlay.addEventListener('mousedown', e => {
            if (e.target === modalOverlay) closeModal();
        });

        // --- Put it under the button ---
        async function openModal() {
            let cfg = await getCurrentConfig();
            textarea.value = JSON.stringify(cfg, null, 2);
            msgDiv.textContent = '';
            if (anchorBtn && anchorBtn.getBoundingClientRect) {
                const btnRect = anchorBtn.getBoundingClientRect();
                const margin = 8;
                let left = btnRect.left;
                let top = btnRect.bottom + 4;
                // Prevents right edge from protruding
                if (left + MODAL_WIDTH > window.innerWidth - margin) {
                    left = window.innerWidth - MODAL_WIDTH - margin;
                }
                left = Math.max(left, margin);
                modalBox.style.left = left + 'px';
                modalBox.style.top = top + 'px';
                modalBox.style.transform = '';
            } else {
                modalBox.style.left = '50%';
                modalBox.style.top = '120px';
                modalBox.style.transform = 'translateX(-50%)';
            }
            modalOverlay.style.display = 'block';
        }
        modalOverlay.open = openModal;
        modalOverlay.close = closeModal;
        return modalOverlay;
    }

    // --- append UI (SPA support) ---
    function appendUI() {
        if (!$('#cqtb-id-insert-btn')) document.body.appendChild(insertBtn);
        if (!$('#cqtb-id-settings-btn')) document.body.appendChild(settingsBtn);
        if (!$('#cqtb-id-text-list')) document.body.appendChild(textList);
    }

    // --- main logic ---
    let activeCategory = null;
    function reloadAndRender() {
        // load from cache
        if (!FIXED_TEXTS_CONFIG) FIXED_TEXTS_CONFIG = { ...defaultFixedTexts };
        if (!activeCategory || !FIXED_TEXTS_CONFIG[activeCategory]) {
            activeCategory = Object.keys(FIXED_TEXTS_CONFIG)[0];
        }
        renderCategories();
        renderTextOptions(activeCategory);
    }
    function renderCategories() {
        categoryTabs.innerHTML = '';
        const cats = Object.keys(FIXED_TEXTS_CONFIG);
        cats.forEach((cat, idx) => {
            const tab = createEl('button', {
                className: 'cqtb-category-tab' + (cat === activeCategory ? ' active' : ''),
                innerText: cat,
                type: 'button'
            });
            tab.addEventListener('mousedown', e => {
                e.stopPropagation();
                activeCategory = cat;
                renderCategories();
                renderTextOptions(cat);
            });
            categoryTabs.appendChild(tab);
        });
    }
    function renderTextOptions(cat) {
        textOptions.innerHTML = '';
        const texts = FIXED_TEXTS_CONFIG[cat] || [];
        texts.forEach(txt => {
            const btn = createEl('button', {
                type: 'button', className: 'cqtb-text-option',
                innerText: txt.length > 100 ? txt.slice(0, 100) + "…" : txt,
                title: txt
            });
            btn.addEventListener('mousedown', e => {
                e.stopPropagation();
                insertText(txt);
                textList.style.display = 'none';
            });
            textOptions.appendChild(btn);
        });
    }
    function insertText(text) {
        const form = $('form');
        const p = form?.querySelector('div p:last-of-type') ||
              form?.querySelector('[contenteditable="true"]');
        if (p) {
            p.innerText = p.innerText.trim() ? p.innerText + text : text;
            p.focus();
        } else {
            alert('Input box (p element) not found.');
        }
    }

    // --- place Quick Text Window ---
    function showTextListBelowButton() {
        textList.style.display = 'block';
        textList.style.left = '-9999px';
        textList.style.top = '0px';
        setTimeout(() => {
            const btnRect = insertBtn.getBoundingClientRect();
            const winWidth = textList.offsetWidth || textListWidth;
            let left, top;
            const margin = 8;
            if (textListAlign === "center") {
                const centerX = btnRect.left + (btnRect.width / 2);
                left = centerX - (winWidth / 2);
                left = Math.max(left, margin);
                top = btnRect.bottom + 4;
            } else if (textListAlign === "left") {
                left = btnRect.left;
                top = btnRect.bottom + 4;
                if (left + winWidth > window.innerWidth - margin) {
                    left = window.innerWidth - winWidth - margin;
                }
                left = Math.max(left, margin);
            } else if (textListAlign === "custom") {
                left = customPosition.left;
                top = customPosition.top;
            } else {
                left = btnRect.left;
                top = btnRect.bottom + 4;
            }
            textList.style.left = `${left}px`;
            textList.style.top = `${top}px`;
        }, 1);
    }

    // --- Hover/leave logic ---
    let hideTimeout;
    insertBtn.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        showTextListBelowButton();
    });
    insertBtn.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            if (!textList.matches(':hover')) textList.style.display = 'none';
        }, 250);
    });
    textList.addEventListener('mouseleave', () => {
        textList.style.display = 'none';
    });
    textList.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
    });

    // --- Open settings ---
    settingsBtn.onclick = () => {
        setupModalIfNeeded();
        cqtbSettingsModal.open();
    };

    // --- INIT ---
    async function initUI() {
        appendUI();
        FIXED_TEXTS_CONFIG = await loadConfig(CONFIG_KEY, defaultFixedTexts);
        reloadAndRender();
        textList.style.display = 'none';
    }
    function setupSPAandObserver() {
        window.addEventListener('load', initUI);
        ['pushState', 'replaceState'].forEach(fn => {
            const orig = history[fn];
            history[fn] = function (...args) {
                orig.apply(this, args);
                setTimeout(initUI, 200);
            };
        });
        window.addEventListener('popstate', () => setTimeout(initUI, 200));
        const observer = new MutationObserver(() => {
            if (!$('#cqtb-id-insert-btn')) initUI();
        });
        observer.observe(document.body, { childList: true, subtree: false });
    }

    // ---- Entry point ----
    setupSPAandObserver();
    initUI();

})();
