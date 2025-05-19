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
    // Width of the quick text list window (px)
    const textListWidth = 500;

    // Window position mode:
    // "center" = center under button
    // "left"   = left edge under button
    // "custom" = custom absolute coordinates
    const textListAlign = "left"; // "center"|"left"|"custom"
    // Used only when textListAlign is "custom"
    const customPosition = { left: 300, top: 150 };

    // Width of the settings modal window (px)
    const modalBoxWidth = 440;

    // --------------------------------

    /**
     * Simple DOM utilities for brevity/readability.
     * $: Single element selector
     * createEl: Element creation with property assignment
     */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const createEl = (tag, props = {}) => Object.assign(document.createElement(tag), props);

    // GM storage key for snippets. Default includes a sample greeting category (in Japanese, for demo).
    const STORAGE_KEY = 'fixedTexts';
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

    /**
     * Loads snippets from storage, or falls back to default.
     * @returns {Promise<Object>} Snippet object by category
     */
    async function loadTexts() {
        try {
            const stored = await GM_getValue(STORAGE_KEY);
            return stored ? JSON.parse(stored) : { ...defaultFixedTexts };
        } catch (e) {
            return { ...defaultFixedTexts };
        }
    }

    /**
     * Saves the given snippets object to storage.
     * @param {Object} obj
     */
    async function saveTexts(obj) {
        await GM_setValue(STORAGE_KEY, JSON.stringify(obj));
    }

    // --- CSS for all UI components (ChatGPT Theme Color) ---
    const style = createEl('style', {
        textContent: `
        #ftb-id-insert-btn, #ftb-id-settings-btn {
          position: fixed;
          top: 10px;
          width: 32px; height: 32px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          z-index: 20000;
          background: var(--interactive-bg-secondary-default, #202123) !important;
          color: var(--interactive-label-secondary-default, #ececf1) !important;
          border: 1px solid var(--interactive-border-secondary-default, #cccccc) !important;
        }
        #ftb-id-insert-btn { right: 400px; }
        #ftb-id-settings-btn { right: 360px; }
        #ftb-id-insert-btn:hover, #ftb-id-settings-btn:hover { background: var(--btn-hover-bg); }

        #ftb-id-text-list {
          position: absolute;
          left: -9999px;
          top: 0;
          min-width: ${textListWidth}px;
          max-width: ${textListWidth}px;
          width: ${textListWidth}px;
          border-radius: 4px;
          padding: 8px;
          z-index: 20001;
          display: none;
          background: var(--main-surface-primary, #fff) !important;
          color: var(--text-primary, #222) !important;
          border: 1px solid var(--border-light, #cccccc) !important;
          box-shadow: 0 2px 8px var(--border-default, #3333);
        }
        #ftb-id-category-tabs { display: flex; margin-bottom: 5px; }
        .ftb-category-tab {
          flex: 1 1 0;
          min-width: 0;
          max-width: 90px;
          width: 80px;
          text-align: center;
          padding: 4px 0;
          margin-right: 4px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 12px;
          transition: background 0.15s;
          background: var(--interactive-bg-tertiary-default, #fff) !important;
          color: var(--text-primary, #222) !important;
          border: 1px solid var(--border-light, #cccccc) !important;
        }
        .ftb-category-tab:last-child { margin-right: 0; }
        .ftb-category-tab.active {
          background: var(--interactive-bg-tertiary-hover, #f9f9f9) !important;
          border-color: var(--border-default, #888) !important;
          outline: 2px solid var(--border-default, #888);
         }
        #ftb-id-category-separator {
          height: 1px;
          background: var(--border-default, #cccccc) !important;
          margin: 4px 0;
        }
        .ftb-text-option {
          display: block;
          width: 100%;
          min-width: 0;
          margin: 4px 0;
          padding: 4px;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          background: var(--interactive-bg-tertiary-default, #fff) !important;
          color: var(--text-primary, #222) !important;
          border: 1px solid var(--border-default, #cccccc) !important;
          border-radius: 5px;
        }
        .ftb-text-option:hover,
        .ftb-text-option:focus {
          background: var(--interactive-bg-tertiary-hover, #f9f9f9) !important;
          border-color: var(--border-default, #888) !important;
          outline: 2px solid var(--border-default, #888);
        }

        #ftb-id-modal-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: none;
          display: none;
          pointer-events: none;
          z-index: 9999;
        }
        #ftb-id-modal-box {
          position: absolute;
          width: ${modalBoxWidth}px;
          padding: 16px;
          border-radius: 8px;
          z-index: 2147483648;
          pointer-events: auto;
          background: var(--main-surface-primary, #fff) !important;
          color: var(--text-primary, #222) !important;
          border: 1px solid var(--border-default, #888) !important;
          box-shadow: 0 4px 16px var(--border-default, #3336);
        }
        #ftb-id-modal-box textarea {
          width: 100%;
          height: 200px;
          box-sizing: border-box;
          font-family: monospace;
          font-size: 13px;
          border: 1px solid var(--border-default, #cccccc) !important;
          background: var(--bg-primary, #fff) !important;
          color: var(--text-primary, #222) !important;
        }
        .ftb-btn-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .ftb-btn-group button {
          background: var(--interactive-bg-tertiary-default, #fff) !important;
          color: var(--text-primary, #222) !important;
          border: 1px solid var(--border-default, #cccccc) !important;
          border-radius: 5px;
          padding: 5px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.12s;
        }
        .ftb-btn-group button:hover {
          background: var(--interactive-bg-tertiary-hover, #f9f9f9) !important;
          border-color: var(--border-default, #888) !important;
        }
      `
    });
    document.head.appendChild(style);

    // ---- UI elements: Buttons, list, settings modal ----
    const insertBtn = createEl('button', {
        id: 'ftb-id-insert-btn', textContent: '✎', title: 'Add quick text', type: 'button'
    });
    const settingsBtn = createEl('button', {
        id: 'ftb-id-settings-btn', textContent: '⚙️', title: 'Settings', type: 'button'
    });
    const textList = createEl('div', { id: 'ftb-id-text-list' });
    const categoryTabs = createEl('div', { id: 'ftb-id-category-tabs' });
    const categorySeparator = createEl('div', { id: 'ftb-id-category-separator' });
    const textOptions = createEl('div', { id: 'ftb-id-text-options' });
    textList.append(categoryTabs, categorySeparator, textOptions);

    // Settings modal elements
    const modalOverlay = createEl('div', { id: 'ftb-id-modal-overlay' });
    const modalBox = createEl('div', { id: 'ftb-id-modal-box' });
    const textarea = createEl('textarea');
    const btnGroup = createEl('div', { className: 'ftb-btn-group' });
    const btnSave = createEl('button', { type: 'button', innerText: 'Save' });
    const btnCancel = createEl('button', { type: 'button', innerText: 'Cancel' });

    btnGroup.append(btnCancel, btnSave);
    modalBox.append(textarea, btnGroup);
    modalOverlay.append(modalBox);

    /**
     * Attach UI components to document (safe for SPA reloads)
     */
    function appendUI() {
        if (!$('#ftb-id-insert-btn')) document.body.appendChild(insertBtn);
        if (!$('#ftb-id-settings-btn')) document.body.appendChild(settingsBtn);
        if (!$('#ftb-id-text-list')) document.body.appendChild(textList);
        if (!$('#ftb-id-modal-overlay')) document.body.appendChild(modalOverlay);
    }

    // App state: loaded snippets and active category
    let fixedTexts = {};
    let activeCategory = null;

    /**
     * Reload snippets from storage, render category tabs and text options.
     * Ensures the active category exists.
     */
    async function reloadAndRender() {
        fixedTexts = await loadTexts();
        if (!activeCategory || !fixedTexts[activeCategory]) {
            activeCategory = Object.keys(fixedTexts)[0];
        }
        renderCategories();
        renderTextOptions(activeCategory);
    }

    /**
     * Render category tabs for each snippet group.
     * Highlights the active category.
     */
    function renderCategories() {
        categoryTabs.innerHTML = '';
        const cats = Object.keys(fixedTexts);
        cats.forEach((cat, idx) => {
            const tab = createEl('button', {
                className: 'ftb-category-tab' + (cat === activeCategory ? ' active' : ''),
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

    /**
     * Render the snippet text options for the current category.
     * Each text is a clickable button; click to paste into ChatGPT input.
     */
    function renderTextOptions(cat) {
        textOptions.innerHTML = '';
        const texts = fixedTexts[cat] || [];
        texts.forEach(txt => {
            const btn = createEl('button', {
                type: 'button', className: 'ftb-text-option',
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

    /**
     * Paste the specified text into the ChatGPT input field (always at the end).
     * Warns if the input box cannot be found.
     */
    function insertText(text) {
        const form = $('form');
        const p = form?.querySelector('div p:last-of-type');
        if (p) {
            p.innerText = p.innerText.trim() ? p.innerText + text : text;
            p.focus();
        } else {
            alert('Input box (p element) not found.');
        }
    }

    // ------- Window positioning logic: behavior switch via config --------
    /**
     * Show the quick text list window below the "Quick Text" button.
     * The position depends on textListAlign ("center", "left", or "custom"):
     * - "center": Centered horizontally below the button.
     * - "left":   Left edge aligns with the button, but shifts left if overflowing right.
     * - "custom": Uses fixed coordinates (customPosition).
     *
     * Uses setTimeout to wait for layout/render before measuring width.
     * Keeps window inside viewport with margin.
     */
    function showTextListBelowButton() {
        textList.style.display = 'block';
        textList.style.left = '-9999px';
        textList.style.top = '0px';

        setTimeout(() => {
            const btnRect = insertBtn.getBoundingClientRect();
            const winWidth = textList.offsetWidth || textListWidth;
            let left, top;
            const margin = 8; // px, viewport margin

            if (textListAlign === "center") {
                // Center horizontally below button
                const centerX = btnRect.left + (btnRect.width / 2);
                left = centerX - (winWidth / 2);
                left = Math.max(left, margin);
                top = btnRect.bottom + 4;
            } else if (textListAlign === "left") {
                // Left edge under button, adjust if overflows right edge
                left = btnRect.left;
                top = btnRect.bottom + 4;
                if (left + winWidth > window.innerWidth - margin) {
                    left = window.innerWidth - winWidth - margin;
                }
                left = Math.max(left, margin);
            } else if (textListAlign === "custom") {
                // Use absolute coordinates
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
    // -----------------------------------------------------------------------

    // ------- Hover/leave event logic for text window -------
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

    /**
     * Show settings modal below the settings button.
     * Keeps window inside viewport with margin.
     */
    settingsBtn.onclick = async () => {
        await reloadAndRender();
        textarea.value = JSON.stringify(fixedTexts, null, 2);

        // Position modal below settings button, adjusted for right overflow
        const btnRect = settingsBtn.getBoundingClientRect();
        const margin = 8;
        let left = btnRect.left;
        let top = btnRect.bottom + 4;
        if (left + modalBoxWidth > window.innerWidth - margin) {
            left = window.innerWidth - modalBoxWidth - margin;
        }
        left = Math.max(left, margin);

        modalOverlay.style.display = 'block';
        modalBox.style.left = `${left}px`;
        modalBox.style.top = `${top}px`;
    };

    /**
     * Save settings modal edits and update UI.
     * Warns on JSON parse errors.
     */
    btnSave.onclick = async () => {
        try {
            const obj = JSON.parse(textarea.value);
            await saveTexts(obj);
            fixedTexts = obj;
            activeCategory = Object.keys(fixedTexts)[0];
            renderCategories();
            renderTextOptions(activeCategory);
            modalOverlay.style.display = 'none';
        } catch (e) {
            alert('JSON parse failed: ' + e.message);
        }
    };

    // Close modal on cancel
    btnCancel.onclick = () => {
        modalOverlay.style.display = 'none';
    };

    // Optional: close modal if overlay is clicked (not the modal box itself)
    modalOverlay.addEventListener('mousedown', e => {
        if (e.target === modalOverlay) modalOverlay.style.display = 'none';
    });

    /**
     * One-time UI and state initialization (safe for re-entry, idempotent).
     */
    async function initUI() {
        appendUI();
        await reloadAndRender();
        textList.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    /**
     * SPA support: re-attach UI after navigation, and re-initialize after DOM replacement.
     * Uses MutationObserver to recover from dynamic UI changes (e.g. page reload via SPA).
     */
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
            if (!$('#ftb-id-insert-btn')) initUI();
        });
        observer.observe(document.body, { childList: true, subtree: false });
    }

    // ---- Entry point ----
    setupSPAandObserver();
    initUI();

})();
