import { dom } from './dom.js';

let isClickThroughEnabled = false;
let clickThroughTimeout = null;
let lastMousePosition = { x: 0, y: 0 };
let mouseOverIframe = false;
let iframeCheckInterval = null;

// Define UI container selectors that should always be interactive
const UI_CONTAINERS = [
    '.chat-input-container',
    '.attachments-container',
    '.floating-cards-manager',
    '.floating-card',
    '.dropdown-menu',
    '.speed-dial',
    '.mcp-modal',
    '.submenu'
];

/**
 * Check if mouse is over any frontend UI area (iframes containing the React app)
 * This includes floating cards and any other iframes showing the frontend
 */
function isOverFrontendUI(x, y) {
    // Get all visible iframes (floating cards contain the frontend React app)
    const iframes = document.querySelectorAll('iframe');
    
    for (const iframe of iframes) {
        // Skip hidden iframes
        const parent = iframe.closest('.floating-card');
        if (parent && parent.style.display === 'none') continue;
        
        const rect = iframe.getBoundingClientRect();
        
        // Check if mouse coordinates are within iframe bounds
        if (x >= rect.left && 
            x <= rect.right && 
            y >= rect.top && 
            y <= rect.bottom) {
            return true;
        }
    }
    
    return false;
}

/**
 * Continuously check if mouse is over iframe
 * This solves the problem where mousemove events don't fire when cursor is inside iframe
 */
function startIframeMonitoring() {
    if (iframeCheckInterval) return;
    
    iframeCheckInterval = setInterval(() => {
        // Check if mouse is over any iframe using last known position
        const overIframe = isOverFrontendUI(lastMousePosition.x, lastMousePosition.y);
        
        if (overIframe !== mouseOverIframe) {
            mouseOverIframe = overIframe;
            
            if (overIframe) {
                // Mouse entered iframe - disable click-through
                if (isClickThroughEnabled) {
                    disableClickThrough();
                }
            }
        }
    }, 50); // Check every 50ms for smooth detection
}

function stopIframeMonitoring() {
    if (iframeCheckInterval) {
        clearInterval(iframeCheckInterval);
        iframeCheckInterval = null;
    }
}

/**
 * Check if an element is part of the UI
 * This automatically includes all children of UI containers
 */
function isUIElement(element) {
    if (!element) return false;
    
    // Check if element is an iframe (frontend UI)
    if (element.tagName === 'IFRAME') {
        return true;
    }
    
    // Check if element or any parent is a UI container
    for (const selector of UI_CONTAINERS) {
        if (element.closest(selector)) {
            return true;
        }
    }
    
    // Check for interactive elements (buttons, inputs, textareas, etc.)
    const interactiveElements = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'];
    if (interactiveElements.includes(element.tagName)) {
        return true;
    }
    
    // Check for elements with click handlers or interactive attributes
    if (element.onclick || 
        element.hasAttribute('data-action') || 
        element.hasAttribute('data-subaction') ||
        element.hasAttribute('role') && ['button', 'menuitem', 'link'].includes(element.getAttribute('role'))) {
        return true;
    }
    
    return false;
}

/**
 * Check if any card is currently being interacted with
 */
function isCardInteracting() {
    return document.querySelector('.floating-card.interacting, .floating-card.dragging, .floating-card.resizing') !== null;
}

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
    // Always disable click-through when clicking on UI elements
    // Never automatically enable - user must use Ctrl+T or button to toggle
    if (isUIElement(target) && isClickThroughEnabled) {
        disableClickThrough();
    }
    // Don't enable clickthrough automatically on clicks outside UI
    // Let the mousemove handler deal with it based on cursor position
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
    document.addEventListener('click', handleSmartClickThrough);
    
    // Track mouse position continuously
    document.addEventListener('mousemove', (event) => {
        // Update last known mouse position
        lastMousePosition.x = event.clientX;
        lastMousePosition.y = event.clientY;
        
        const target = event.target;
        const isUI = isUIElement(target);
        const overFrontend = isOverFrontendUI(event.clientX, event.clientY);
        const cardInteracting = isCardInteracting();
        
        // Update iframe state
        mouseOverIframe = overFrontend;
        
        // Disable click-through if over any UI element, frontend iframe, or interacting with cards
        if ((isUI || overFrontend || cardInteracting) && isClickThroughEnabled) {
            disableClickThrough();
        } else if (!isUI && !overFrontend && !cardInteracting && !isClickThroughEnabled) {
            // Cursor left all UI areas: re-enable click-through automatically
            enableClickThrough();
        }
    });
    
    // Monitor when mouse enters/leaves iframes
    // This handles the case where mousemove events stop firing inside iframes
    document.addEventListener('mouseenter', (event) => {
        if (event.target.tagName === 'IFRAME') {
            mouseOverIframe = true;
            if (isClickThroughEnabled) {
                disableClickThrough();
            }
        }
    }, true); // Use capture phase to catch iframe events
    
    document.addEventListener('mouseleave', (event) => {
        if (event.target.tagName === 'IFRAME') {
            mouseOverIframe = false;
        }
    }, true);
    
    // Start continuous monitoring for iframe hover detection
    startIframeMonitoring();
    
    // Add pointer-events style management for iframes
    const style = document.createElement('style');
    style.textContent = `
        /* Ensure iframes are always interactive when click-through is disabled */
        iframe {
            pointer-events: auto !important;
        }
        
        /* When parent card is being interacted with, ensure it stays interactive */
        .floating-card.interacting iframe,
        .floating-card.dragging iframe,
        .floating-card.resizing iframe,
        .floating-card:hover iframe {
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);
    
    if (dom.clickThroughButton) {
        dom.clickThroughButton.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            toggleClickThrough(); 
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 't') { 
            e.preventDefault(); 
            toggleClickThrough(); 
        }
    });
    
    // Cleanup on window unload
    window.addEventListener('beforeunload', () => {
        stopIframeMonitoring();
    });
}


