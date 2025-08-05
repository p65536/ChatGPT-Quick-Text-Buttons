// ==UserScript==
// @name         ChatGPT Quick Text Buttons [DEPRECATED]
// @namespace    https://github.com/p65536
// @version      1.2.0 [DEPRECATED]
// @license      MIT
// @description  Adds customizable buttons to paste predefined text into the ChatGPT input field.
// @icon         https://chatgpt.com/favicon.ico
// @author       p65536
// @match        https://chatgpt.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  // Prevent duplicate insertion
  if (document.getElementById('cqtb-deprecation-dialog')) return;

  // Create <dialog>
  const dialog = document.createElement('dialog');
  dialog.id = 'cqtb-deprecation-dialog';
  dialog.style = `
    top: 10%;
    left: 10%;
    padding: 24px;
    border: none;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    background: white;
    color: #111;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    line-height: 1.6;
    z-index: 99999;
  `;

  // Dialog content
  dialog.innerHTML = `
    <h2 style="margin-top: 0; font-size: 18px;">\"ChatGPT Quick Text Buttons\" is no longer maintained</h2>
    <p>Please use the successor script:</p>
    <p><a href="https://greasyfork.org/en/scripts/544699-quick-text-buttons" target="_blank" style="color: #1a73e8;">View the new script on Greasy Fork</a></p>
    <div style="text-align: right; margin-top: 24px;">
      <button id="cqtb-dialog-close" style="
        padding: 6px 14px;
        font-size: 14px;
        background: #333;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      ">Close</button>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  document.getElementById('cqtb-dialog-close').onclick = () => dialog.close();
})();
