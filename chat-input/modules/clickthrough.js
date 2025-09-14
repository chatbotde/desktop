import { dom } from './dom.js';

let isClickThroughEnabled = false;
let clickThroughTimeout = null;

function enableClickThrough() {
    if (window.chatInputAPI?.enableClickThrough) {
        window.chatInputAPI.enableClickThrough();
        isClickThroughEnabled = true;
        updateClickThroughButton();
    }
}

function disableClickThrough() {
    if (window.chatInputAPI?.disableClickThrough) {
        window.chatInputAPI.disableClickThrough();
        isClickThroughEnabled = false;
        updateClickThroughButton();
    }
}

export function toggleClickThrough() {
    if (isClickThroughEnabled) disableClickThrough(); else enableClickThrough();
}

function handleSmartClickThrough(event) {
    if (clickThroughTimeout) clearTimeout(clickThroughTimeout);
    const target = event.target;
    const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input');
    if (isUIElement) {
        disableClickThrough();
        clickThroughTimeout = setTimeout(() => enableClickThrough(), 1000);
    } else {
        enableClickThrough();
    }
}

function updateClickThroughButton() {
    if (!dom.clickThroughButton) return;
    if (isClickThroughEnabled) {
        dom.clickThroughButton.classList.add('active');
        dom.clickThroughButton.title = 'Click-through enabled - Click to disable';
    } else {
        dom.clickThroughButton.classList.remove('active');
        dom.clickThroughButton.title = 'Click-through disabled - Click to enable';
    }
}

export function initializeClickThrough() {
    // Start disabled so UI remains clickable by default
    // Users can enable via Ctrl+T or the toolbar button
    // enableClickThrough();
    document.addEventListener('click', handleSmartClickThrough);
    document.addEventListener('mousemove', (event) => {
        const target = event.target;
        const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input, .floating-card, #floatingCard1, #floatingCard2, #floatingCard3, #floatingCard4');
        const interactingCard = document.querySelector('.floating-card.interacting');
        if ((isUIElement || interactingCard) && isClickThroughEnabled) {
            disableClickThrough();
        } else if (!isUIElement && !interactingCard && !isClickThroughEnabled) {
            // Cursor left UI: re-enable click-through automatically
            enableClickThrough();
        }
    });
    if (dom.clickThroughButton) {
        dom.clickThroughButton.addEventListener('click', (e) => { e.stopPropagation(); toggleClickThrough(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 't') { e.preventDefault(); toggleClickThrough(); }
    });
}


