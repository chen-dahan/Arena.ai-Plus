/*
 * Arena.ai Plus – Popup Script
 * Copyright (C) 2025 Arena.ai Plus
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

(function () {
    'use strict';

    // DOM refs
    const battleNotificationInput = document.getElementById('battle-notification');
    const notificationToggle = document.getElementById('notification-toggle');
    const notificationHint = document.getElementById('notification-hint');

    // ---- Notification toggle ----
    notificationToggle.addEventListener('click', () => {
        const newState = !battleNotificationInput.checked;
        battleNotificationInput.checked = newState;
        notificationToggle.classList.toggle('on', newState);
        savePreference(BATTLE_NOTIFICATION_KEY, newState, 'BATTLE_NOTIFICATION_CHANGED');
        updateNotificationHint();
    });

    // ---- Load saved preferences ----
    async function loadPreferences() {
        try {
            const result = await chrome.storage.sync.get([BATTLE_NOTIFICATION_KEY]);

            // Notification
            const notificationEnabled = result[BATTLE_NOTIFICATION_KEY] ?? true;
            battleNotificationInput.checked = notificationEnabled;
            notificationToggle.classList.toggle('on', notificationEnabled);
            updateNotificationHint();
        } catch (error) {
            console.warn('Failed to load preferences:', error);
        }
    }

    // ---- Notification hint ----
    function updateNotificationHint() {
        if (!('Notification' in window)) {
            notificationHint.textContent = 'Notifications not supported in this browser';
            notificationHint.className = 'notification-hint notification-hint--error';
            notificationToggle.style.pointerEvents = 'none';
            notificationToggle.style.opacity = '0.5';
        } else if (Notification.permission === 'denied') {
            notificationHint.textContent = 'Notifications blocked. Enable in browser settings.';
            notificationHint.className = 'notification-hint notification-hint--error';
        } else {
            notificationHint.textContent = '';
            notificationHint.className = 'notification-hint';
        }
    }

    // ---- Save & notify content scripts ----
    async function savePreference(key, value, messageType) {
        try {
            await chrome.storage.sync.set({ [key]: value });
            const tabs = await chrome.tabs.query({ url: 'https://arena.ai/*' });
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { type: messageType, value }).catch(() => { });
            }
        } catch (error) {
            console.warn('Failed to save preference:', error);
        }
    }

    // ---- Version display ----
    function displayVersion() {
        const versionSpan = document.getElementById('popup-version');
        if (versionSpan && chrome.runtime.getManifest) {
            versionSpan.textContent = `v${chrome.runtime.getManifest().version}`;
        }
    }

    // ---- Tooltip handler ----
    const tooltip = document.getElementById('popup-tooltip');
    let hideTimeout;

    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            const info = COLUMN_TOOLTIPS[el.dataset.tooltip];
            if (!info) return;

            tooltip.innerHTML = `
                <div class="lmarena-price-tooltip__header">
                    <span class="lmarena-price-tooltip__header-title">${info.title}</span>
                    <span class="lmarena-price-tooltip__header-brand">
                        <span class="lmarena-price-tooltip__header-brand-text"><em>Arena</em>.ai Plus</span>
                        <img src="icons/arenaaiplus-icon.svg" class="lmarena-price-tooltip__header-icon" alt="">
                    </span>
                </div>
                <div class="lmarena-price-tooltip__explanation">${info.description}</div>
            `;
            tooltip.classList.add('lmarena-price-tooltip--visible');

            const rect = el.getBoundingClientRect();
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = '0px';
            const tooltipHeight = tooltip.offsetHeight;
            tooltip.style.top = `${rect.top - tooltipHeight - 6}px`;
        });

        el.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                tooltip.classList.remove('lmarena-price-tooltip--visible');
            }, 100);
        });
    });

    // ---- Initialize ----
    loadPreferences();
    displayVersion();
})();
