import { dom } from '../core/dom.js';

let isClickThroughEnabled = false;
let clickThroughTimeout = null;
let lastMousePosition = { x: 0, y: 0 };
let mouseOverIframe = false;
let iframeCheckInterval = null;

// Generic patterns to identify UI elements automatically
const UI_PATTERNS = {
    // Class name patterns that suggest UI elements
    classPatterns: [
        /container$/i,
        /wrapper$/i,
        /modal$/i,
        /dialog$/i,
        /dropdown$/i,
        /menu$/i,
        /panel$/i,
        /sidebar$/i,
        /toolbar$/i,
        /button$/i,
        /input$/i,
        /card$/i,
        /popup$/i,
        /overlay$/i,
        /tooltip$/i
    ],
    // Data attributes that indicate interactivity
    dataAttributes: [
        'data-action',
        'data-clickable',
        'data-interactive',
        'data-ui',
        'data-component',
        'data-testid'
    ],
    // ARIA roles that indicate interactive elements
    ariaRoles: [
        'button',
        'menuitem',
        'link',
        'tab',
        'checkbox',
        'radio',
        'switch',
        'textbox',
        'searchbox',
        'combobox',
        'listbox',
        'menu',
        'menubar',
        'tablist',
        'dialog',
        'alertdialog',
        'toolbar',
        'tooltip'
    ]
};

/**
 * Check if mouse is over any iframe (general - works with any iframe structure)
 * This is a general implementation that works with any UI structure
 * Works even when there are no iframes (returns false gracefully)
 */
function isOverFrontendUI(x, y) {
    // Get all iframes in the document
    const iframes = document.querySelectorAll('iframe');
    
    // If no iframes exist, that's fine - just return false (works without iframes)
    if (iframes.length === 0) {
        // Still check WebView container if it exists (for backward compatibility)
        const webViewContainer = document.getElementById('webview-container');
        if (webViewContainer && webViewContainer.style.display !== 'none') {
            const rect = webViewContainer.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return true;
            }
        }
        return false;
    }
    
    for (const iframe of iframes) {
        // Skip if iframe is not visible
        const style = window.getComputedStyle(iframe);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            continue;
        }
        
        // Check if parent container is hidden (general check)
        let parent = iframe.parentElement;
        let isParentHidden = false;
        while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                isParentHidden = true;
                break;
            }
            parent = parent.parentElement;
        }
        
        if (isParentHidden) continue;
        
        // Check if mouse coordinates are within iframe bounds
        const rect = iframe.getBoundingClientRect();
        if (x >= rect.left && 
            x <= rect.right && 
            y >= rect.top && 
            y <= rect.bottom) {
            return true;
        }
    }
    
    // Also check WebView container if it exists (for backward compatibility)
    const webViewContainer = document.getElementById('webview-container');
    if (webViewContainer && webViewContainer.style.display !== 'none') {
        const rect = webViewContainer.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
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
        
        // Also check WebView container bounds (even though cursor is above it)
        const webViewContainer = document.getElementById('webview-container');
        let overWebView = false;
        if (webViewContainer && webViewContainer.style.display !== 'none') {
            const rect = webViewContainer.getBoundingClientRect();
            overWebView = lastMousePosition.x >= rect.left && 
                         lastMousePosition.x <= rect.right && 
                         lastMousePosition.y >= rect.top && 
                         lastMousePosition.y <= rect.bottom;
            
            if (overWebView) {
                console.log('[ClickThrough] Polling detected cursor over WebView');
            }
        }
        
        const isOverUI = overIframe || overWebView;
        
        if (isOverUI !== mouseOverIframe) {
            mouseOverIframe = isOverUI;
            
            if (isOverUI) {
                // Mouse entered iframe or WebView - disable click-through
                if (isClickThroughEnabled) {
                    console.log('[ClickThrough] Auto-disabling (over UI)');
                    disableClickThrough();
                }
            } else {
                // Mouse left UI - re-enable click-through only if no other UI is under cursor
                const target = document.elementFromPoint(lastMousePosition.x, lastMousePosition.y);
                const isStillOverUI = isUIElement(target);
                if (!isStillOverUI && !isClickThroughEnabled) {
                    console.log('[ClickThrough] Auto-enabling (left UI)');
                    enableClickThrough();
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
 * Auto-detects UI elements using multiple heuristics - no manual selector updates needed!
 */
function isUIElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
        return false;
    }
    
    // Check if element is the WebView container or inside it
    if (element.id === 'webview-container' || element.closest('#webview-container')) {
        return true;
    }
    
    // Check if element is an iframe (frontend UI)
    if (element.tagName === 'IFRAME') {
        return true;
    }
    
    // Check for standard interactive HTML elements
    const interactiveElements = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A', 'VIDEO', 'AUDIO', 'CANVAS'];
    if (interactiveElements.includes(element.tagName)) {
        return true;
    }
    
    // Check for elements with event listeners or handlers
    if (element.onclick || element.onmousedown || element.onmouseup || 
        element.ondblclick || element.oncontextmenu) {
        return true;
    }
    
    // Check for any data-* attributes that suggest interactivity
    for (const attr of UI_PATTERNS.dataAttributes) {
        if (element.hasAttribute(attr)) {
            return true;
        }
    }
    
    // Check ARIA roles
    const role = element.getAttribute('role');
    if (role && UI_PATTERNS.ariaRoles.includes(role)) {
        return true;
    }
    
    // Check class names against patterns
    const classList = element.classList;
    if (classList.length > 0) {
        const classString = Array.from(classList).join(' ');
        for (const pattern of UI_PATTERNS.classPatterns) {
            if (pattern.test(classString)) {
                return true;
            }
        }
    }
    
    // Check for contenteditable
    if (element.contentEditable === 'true') {
        return true;
    }
    
    // Check for cursor style (pointer indicates clickable)
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer' || computedStyle.cursor === 'text') {
        return true;
    }
    
    // Check for elements with z-index (often UI overlays)
    const zIndex = computedStyle.zIndex;
    if (zIndex && zIndex !== 'auto' && parseInt(zIndex) > 0) {
        return true;
    }
    
    // Check for elements with opacity less than 1 but not hidden (often UI overlays)
    const opacity = parseFloat(computedStyle.opacity);
    if (opacity > 0 && opacity < 1 && computedStyle.display !== 'none') {
        return true;
    }
    
    // Check for elements with position fixed or absolute (often UI components)
    const position = computedStyle.position;
    if (position === 'fixed' || position === 'absolute') {
        // Additional check: must be visible and have reasonable size
        const rect = element.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
            return true;
        }
    }
    
    // Check for draggable elements
    if (element.draggable) {
        return true;
    }
    
    // Check for tabindex (indicates keyboard navigable)
    if (element.hasAttribute('tabindex')) {
        return true;
    }
    
    // Recursively check parent elements (up to 5 levels)
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
        // Check parent class patterns
        const parentClasses = Array.from(parent.classList).join(' ');
        for (const pattern of UI_PATTERNS.classPatterns) {
            if (pattern.test(parentClasses)) {
                return true;
            }
        }
        
        // Check if parent has high z-index
        const parentStyle = window.getComputedStyle(parent);
        const parentZIndex = parentStyle.zIndex;
        if (parentZIndex && parentZIndex !== 'auto' && parseInt(parentZIndex) > 0) {
            return true;
        }
        
        parent = parent.parentElement;
        depth++;
    }
    
    return false;
}

/**
 * Check if any iframe container is currently being interacted with
 * General implementation - works with any container structure
 * Works even when there are no iframes (returns false gracefully)
 */
function isCardInteracting() {
    // Check for any element containing an iframe that has interaction classes
    const iframes = document.querySelectorAll('iframe');
    
    // If no iframes, still check for interaction classes (works without iframes)
    if (iframes.length === 0) {
        // Check for specific floating-card classes (backward compatibility)
        return document.querySelector('.floating-card.interacting, .floating-card.dragging, .floating-card.resizing') !== null;
    }
    
    for (const iframe of iframes) {
        let container = iframe.parentElement;
        // Check up to 3 levels up for interaction classes
        for (let i = 0; i < 3 && container; i++) {
            if (container.classList && 
                (container.classList.contains('interacting') || 
                 container.classList.contains('dragging') || 
                 container.classList.contains('resizing'))) {
                return true;
            }
            container = container.parentElement;
        }
    }
    
    // Also check for specific floating-card classes (backward compatibility)
    return document.querySelector('.floating-card.interacting, .floating-card.dragging, .floating-card.resizing') !== null;
}

function enableClickThrough() {
    if (window.chatInputAPI?.enableClickThrough) {
        window.chatInputAPI.enableClickThrough();
        isClickThroughEnabled = true;
        sessionStorage.setItem('clickthrough-enabled', 'true');
        updateClickThroughButton();
        // Emit event for other modules
        document.dispatchEvent(new CustomEvent('clickthrough-changed', { 
            detail: { enabled: true } 
        }));
    }
}

function disableClickThrough() {
    if (window.chatInputAPI?.disableClickThrough) {
        window.chatInputAPI.disableClickThrough();
        isClickThroughEnabled = false;
        sessionStorage.setItem('clickthrough-enabled', 'false');
        updateClickThroughButton();
        // Emit event for other modules
        document.dispatchEvent(new CustomEvent('clickthrough-changed', { 
            detail: { enabled: false } 
        }));
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

/**
 * Handle messages from any iframe for click-through control
 * General implementation - works with any iframe structure
 */
function handleFrontendMessage(event) {
    // Accept messages from any iframe (general approach)
    if (event.data && event.data.type === 'clickthrough-control') {
        const { action, data } = event.data;
        
        console.log('[ClickThrough] Received message from iframe:', action);
        
        switch (action) {
            case 'enable':
                enableClickThrough();
                // Send state update back to all iframes
                sendStateToAllIframes();
                break;
            case 'disable':
                disableClickThrough();
                // Send state update back to all iframes
                sendStateToAllIframes();
                break;
            case 'toggle':
                toggleClickThrough();
                // Send state update back to all iframes
                sendStateToAllIframes();
                break;
            case 'get-state':
                // Send current state to the requesting iframe
                sendStateToIframe(event.source);
                // Also broadcast to all iframes for consistency
                sendStateToAllIframes();
                break;
            default:
                console.warn('[ClickThrough] Unknown action from iframe:', action);
        }
    }
}

/**
 * Send current click-through state to a specific iframe window
 */
function sendStateToIframe(targetWindow) {
    if (!targetWindow) return;
    
    const state = {
        type: 'clickthrough-state',
        enabled: isClickThroughEnabled
    };
    
    try {
        targetWindow.postMessage(state, '*');
    } catch (error) {
        console.debug('[ClickThrough] Could not send state to iframe:', error);
    }
}

/**
 * Send current click-through state to all iframes (general broadcast)
 * Works with any iframe structure - no assumptions about containers
 * Works even when there are no iframes (gracefully does nothing)
 */
function sendStateToAllIframes() {
    const iframes = document.querySelectorAll('iframe');
    
    // If no iframes, that's fine - just return (works without iframes)
    if (iframes.length === 0) {
        return;
    }
    
    const state = {
        type: 'clickthrough-state',
        enabled: isClickThroughEnabled
    };
    
    iframes.forEach(iframe => {
        try {
            // Only send to iframes that have loaded content
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(state, '*');
            }
        } catch (error) {
            // Ignore cross-origin errors silently
            console.debug('[ClickThrough] Could not send state to iframe:', error);
        }
    });
}

export function initializeClickThrough() {
    // Start disabled so UI remains clickable by default
    // Users can enable via Ctrl+T or the toolbar button
    document.addEventListener('click', handleSmartClickThrough);
    
    // Listen for messages from frontend iframes (if any exist)
    // This works even when there are no iframes - listener just won't receive messages
    window.addEventListener('message', handleFrontendMessage);
    
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
    
    // Send state updates when click-through changes (broadcast to all iframes)
    document.addEventListener('clickthrough-changed', () => {
        sendStateToAllIframes();
    });
    
    // Cleanup on window unload
    window.addEventListener('beforeunload', () => {
        stopIframeMonitoring();
        window.removeEventListener('message', handleFrontendMessage);
    });
}


