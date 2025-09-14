import { state } from './state.js';
import { dom } from './dom.js';

export function initializeContentProtection() {
    if (window.chatInputAPI?.getContentProtection) {
        window.chatInputAPI.getContentProtection().then(enabled => {
            state.contentProtectionEnabled = enabled;
            updateContentProtectionButton();
        });
    }
    if (dom.contentProtectionButton) {
        dom.contentProtectionButton.addEventListener('click', () => toggleContentProtection());
    }
}

export function toggleContentProtection() {
    if (window.chatInputAPI?.toggleContentProtection) {
        window.chatInputAPI.toggleContentProtection().then(enabled => {
            state.contentProtectionEnabled = enabled;
            updateContentProtectionButton();
            console.log(`Content protection ${enabled ? 'enabled' : 'disabled'}`);
        }).catch(error => console.error('Failed to toggle content protection:', error));
    }
}

export function updateContentProtectionButton() {
    if (!dom.contentProtectionButton) return;
    if (state.contentProtectionEnabled) {
        dom.contentProtectionButton.classList.add('active');
        dom.contentProtectionButton.title = 'Content protection enabled - click to disable';
    } else {
        dom.contentProtectionButton.classList.remove('active');
        dom.contentProtectionButton.title = 'Content protection disabled - click to enable';
    }
}


