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
    
    // Also update the button in the content card if it exists
    updateContentCardProtectionButton();
}

// Update the protection button in the content card
function updateContentCardProtectionButton() {
    const contentCard = document.querySelector('.content-card');
    if (!contentCard) return;
    
    const protectionButton = contentCard.querySelector('.action-item[data-action="protection"]');
    if (!protectionButton) return;
    
    if (state.contentProtectionEnabled) {
        protectionButton.classList.add('active');
        protectionButton.setAttribute('aria-pressed', 'true');
        // Update the text to show it's on
        const span = protectionButton.querySelector('span');
        if (span) {
            span.textContent = 'Invisible Mode (On)';
        }
    } else {
        protectionButton.classList.remove('active');
        protectionButton.setAttribute('aria-pressed', 'false');
        // Update the text to show it's off
        const span = protectionButton.querySelector('span');
        if (span) {
            span.textContent = 'Invisible Mode (Off)';
        }
    }
}


