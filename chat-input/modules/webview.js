/**
 * WebView Module
 * Handles toggling and managing WebContentsView for external websites
 */

let activeWebViewId = null;
let isWebViewVisible = false;
let isMobileView = false;
let webViewBounds = {
    x: 100,
    y: 100,
    width: 400,
    height: 400
};
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeStartBounds = null;
let resizeHandle = null;
let webViewContainer = null;
let webViewControls = null;

// Mobile view dimensions (iPhone-like)
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 667;
const MOBILE_HEADER_HEIGHT = 60;

// Desktop view dimensions
const DESKTOP_WIDTH = 400;
const DESKTOP_HEIGHT = 400;
const DESKTOP_HEADER_HEIGHT = 40;

// Minimum sizes for header visibility
const MIN_WIDTH_FOR_HEADER = 200;
const MIN_HEIGHT_FOR_HEADER = 150;
const RESIZE_HANDLE_SIZE = 10;
const CARD_PADDING = 12;
const CONTROLS_HEIGHT = 36;
const CONTROLS_GAP = 8;

/**
 * Initialize WebView UI overlay
 */
function initializeWebViewUI() {
    if (webViewContainer) return;

    // Create container overlay
    webViewContainer = document.createElement('div');
    webViewContainer.id = 'webview-container';
    webViewContainer.className = 'webview-container'; // Add class for easy detection
    webViewContainer.setAttribute('data-ui', 'true'); // Mark as UI element
    webViewContainer.style.cssText = `
        position: fixed;
        z-index: 99999;
        display: none;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        background: #1a1a1a;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        padding: ${CARD_PADDING}px;
    `;

    // Floating controls (outside the card): URL input + Close button
    webViewControls = document.createElement('div');
    webViewControls.className = 'webview-controls';
    webViewControls.style.cssText = `
        position: fixed;
        z-index: 100000;
        display: none;
        left: 0;
        top: 0;
        width: ${webViewBounds.width}px;
        height: ${CONTROLS_HEIGHT}px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
    `;

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'Enter URL...';
    urlInput.value = 'https://www.youtube.com';
    urlInput.className = 'webview-url-input';
    urlInput.style.cssText = `
        flex: 1;
        padding: 8px 14px;
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 8px;
        background: rgba(30, 41, 59, 0.95);
        color: white;
        font-size: 13px;
        outline: none;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
    `;
    // Helper function to normalize URLs - automatically add https:// if missing
    const normalizeUrl = (input) => {
        if (!input || !input.trim()) return input;
        
        const trimmed = input.trim();
        
        // If it already has a protocol, return as is
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        
        // If it starts with //, add https:
        if (trimmed.startsWith('//')) {
            return 'https:' + trimmed;
        }
        
        // For localhost or IP addresses, add https://
        if (/^(localhost|(\d{1,3}\.){3}\d{1,3})/i.test(trimmed)) {
            return 'https://' + trimmed;
        }
        
        // For domain-like strings (contains at least one dot or is a known TLD pattern)
        // Add https:// prefix
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(trimmed) || 
            /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z0-9.-]+/.test(trimmed)) {
            return 'https://' + trimmed;
        }
        
        // For simple domain names without TLD (like "google"), add https://www. prefix
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(trimmed)) {
            return 'https://www.' + trimmed + '.com';
        }
        
        // Default: add https://
        return 'https://' + trimmed;
    };

    urlInput.addEventListener('focus', () => {
        urlInput.style.borderColor = 'rgba(59, 130, 246, 0.7)';
        urlInput.style.background = 'rgba(30, 41, 59, 1)';
        urlInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });

    urlInput.addEventListener('blur', () => {
        // Normalize URL on blur to show the corrected URL
        if (urlInput.value && !urlInput.value.startsWith('http://') && !urlInput.value.startsWith('https://')) {
            const normalizedUrl = normalizeUrl(urlInput.value);
            urlInput.value = normalizedUrl;
        }
        urlInput.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        urlInput.style.background = 'rgba(30, 41, 59, 0.95)';
        urlInput.style.boxShadow = 'none';
    });

    urlInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && activeWebViewId) {
            const normalizedUrl = normalizeUrl(urlInput.value);
            urlInput.value = normalizedUrl; // Update input to show normalized URL
            await navigateWebView(normalizedUrl);
        }
    });

    const closeBtn = createHeaderButton('×', 'Close');
    closeBtn.addEventListener('click', () => toggleWebView());

    const dragBtn = createHeaderButton('⠿', 'Drag');
    dragBtn.style.cursor = 'move';
    dragBtn.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - webViewBounds.x;
        dragOffset.y = e.clientY - webViewBounds.y;
        e.preventDefault();
        e.stopPropagation();
    });

    webViewControls.appendChild(urlInput);
    webViewControls.appendChild(closeBtn);
    webViewControls.appendChild(dragBtn);

    // Create content area placeholder
    const content = document.createElement('div');
    content.className = 'webview-content';
    content.style.cssText = `
        width: 100%;
        height: 100%;
        background: #000;
        position: relative;
    `;

    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading...';
    placeholder.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
    `;
    content.appendChild(placeholder);

    // Create resize handles (8 directions)
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    handles.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${direction}`;
        handle.dataset.direction = direction;
        handle.style.cssText = getResizeHandleStyle(direction);
        webViewContainer.appendChild(handle);
    });

    webViewContainer.appendChild(content);
    document.body.appendChild(webViewContainer);
    document.body.appendChild(webViewControls);

    // Setup event listeners
    setupResizeListeners();
    setupClickthroughIntegration();
}

function createHeaderButton(text, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
        width: 28px;
        height: 28px;
        border: 1px solid rgba(59, 130, 246, 0.3);
        background: rgba(30, 41, 59, 0.95);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
    `;
    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(59, 130, 246, 0.3)';
        btn.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(30, 41, 59, 0.95)';
        btn.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        btn.style.transform = 'scale(1)';
    });
    return btn;
}

function getResizeHandleStyle(direction) {
    const baseStyle = `
        position: absolute;
        background: transparent;
        z-index: 10;
    `;

    const cursors = {
        nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
        e: 'e-resize', se: 'se-resize', s: 's-resize',
        sw: 'sw-resize', w: 'w-resize'
    };

    const positions = {
        nw: 'top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize;',
        n: 'top: 0; left: 10px; right: 10px; height: 5px; cursor: n-resize;',
        ne: 'top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize;',
        e: 'top: 10px; right: 0; bottom: 10px; width: 5px; cursor: e-resize;',
        se: 'bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize;',
        s: 'bottom: 0; left: 10px; right: 10px; height: 5px; cursor: s-resize;',
        sw: 'bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize;',
        w: 'top: 10px; left: 0; bottom: 10px; width: 5px; cursor: w-resize;'
    };

    return baseStyle + positions[direction];
}

function setupDragListeners(header) {
    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        dragOffset.x = e.clientX - webViewBounds.x;
        dragOffset.y = e.clientY - webViewBounds.y;
        e.preventDefault();
    });
}

function setupResizeListeners() {
    const handles = webViewContainer.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle = handle.dataset.direction;
            resizeStartBounds = { ...webViewBounds };
            dragOffset.x = e.clientX;
            dragOffset.y = e.clientY;
            e.stopPropagation();
            e.preventDefault();
        });
    });
}

function setupClickthroughIntegration() {
    // Make WebView container part of the automatic click-through detection
    // The clickthrough system will automatically handle enable/disable based on cursor position
    
    // Add mouse enter/leave listeners for explicit tracking
    if (webViewContainer) {
        webViewContainer.addEventListener('mouseenter', () => {
            console.log('[WebView] Mouse entered - should disable click-through');
        });
        
        webViewContainer.addEventListener('mouseleave', () => {
            console.log('[WebView] Mouse left - should enable click-through');
        });
    }

    // Listen for IPC mouse state events from WebContentsView
    if (window.webView && window.webView.onMouseState) {
        window.webView.onMouseState((data) => {
            console.log('[WebView] IPC Mouse state:', data);
            
            // Get the clickthrough module
            const clickthroughEnabled = sessionStorage.getItem('clickthrough-enabled') === 'true';
            
            if (data.isOver) {
                // Mouse is over WebView - disable click-through if it's enabled
                if (clickthroughEnabled && window.chatInputAPI?.disableClickThrough) {
                    console.log('[WebView] Disabling click-through (mouse over WebView)');
                    window.chatInputAPI.disableClickThrough();
                }
            } else {
                // Mouse left WebView - re-enable click-through if it was on
                if (!clickthroughEnabled && window.chatInputAPI?.enableClickThrough) {
                    console.log('[WebView] Re-enabling click-through (mouse left WebView)');
                    window.chatInputAPI.enableClickThrough();
                }
            }
        });
    }
}

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        webViewBounds.x = e.clientX - dragOffset.x;
        webViewBounds.y = e.clientY - dragOffset.y;
        updateWebViewPosition();
    } else if (isResizing) {
        handleResize(e);
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
});

function handleResize(e) {
    const deltaX = e.clientX - dragOffset.x;
    const deltaY = e.clientY - dragOffset.y;

    let { x, y, width, height } = resizeStartBounds;

    switch (resizeHandle) {
        case 'nw':
            x += deltaX; y += deltaY; width -= deltaX; height -= deltaY;
            break;
        case 'n':
            y += deltaY; height -= deltaY;
            break;
        case 'ne':
            y += deltaY; width += deltaX; height -= deltaY;
            break;
        case 'e':
            width += deltaX;
            break;
        case 'se':
            width += deltaX; height += deltaY;
            break;
        case 's':
            height += deltaY;
            break;
        case 'sw':
            x += deltaX; width -= deltaX; height += deltaY;
            break;
        case 'w':
            x += deltaX; width -= deltaX;
            break;
    }

    // Enforce minimum sizes
    if (width < 200) width = 200;
    if (height < 150) height = 150;

    webViewBounds = { x, y, width, height };
    updateWebViewPosition();
    updateHeaderVisibility();
}

function updateWebViewPosition() {
    if (!webViewContainer) return;

    webViewContainer.style.left = webViewBounds.x + 'px';
    webViewContainer.style.top = webViewBounds.y + 'px';
    webViewContainer.style.width = webViewBounds.width + 'px';
    webViewContainer.style.height = webViewBounds.height + 'px';

    // Update actual WebContentsView bounds
    if (activeWebViewId && window.webView) {
        const contentY = CARD_PADDING;
        const contentHeight = webViewBounds.height - (CARD_PADDING * 2);

        window.webView.updateBounds(activeWebViewId, {
            x: Math.round(webViewBounds.x + CARD_PADDING),
            y: Math.round(webViewBounds.y + contentY),
            width: Math.round(webViewBounds.width - (CARD_PADDING * 2)),
            height: Math.round(contentHeight)
        });
    }

    // Position floating controls above the card, outside
    if (webViewControls) {
        webViewControls.style.left = webViewBounds.x + 'px';
        webViewControls.style.top = Math.max(0, webViewBounds.y - CONTROLS_HEIGHT - CONTROLS_GAP) + 'px';
        webViewControls.style.width = webViewBounds.width + 'px';
    }
}

function updateHeaderVisibility() {
    if (!webViewContainer) return;

    const content = webViewContainer.querySelector('.webview-content');
    if (content) {
        content.style.height = '100%';
    }

    updateWebViewPosition();
}

async function updateWebViewSize(width, height) {
    webViewBounds.width = width;
    webViewBounds.height = height;
    updateWebViewPosition();
    updateHeaderVisibility();
}

/**
 * Toggle between mobile and desktop view
 */
export async function toggleMobileView() {
    isMobileView = !isMobileView;
    
    // If we have an active WebView, update its user agent
    if (activeWebViewId && window.webView) {
        try {
            // Set mobile user agent when in mobile view
            const userAgent = isMobileView ? 
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1' :
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            
            await window.webViewClient.setUserAgent(activeWebViewId, userAgent);
            
            // Reload the page to apply the new user agent
            const urlInput = webViewContainer?.querySelector('.webview-url-input');
            if (urlInput) {
                await navigateWebView(urlInput.value);
            }
        } catch (error) {
            console.error('[WebView] Failed to toggle mobile view:', error);
        }
    }
    
    console.log(`[WebView] Switched to ${isMobileView ? 'mobile' : 'desktop'} view`);
}

/**
 * Toggle web view visibility
 */
export async function toggleWebView() {
    try {
        if (!window.webView) {
            console.error('WebView API not available');
            return;
        }

        // Initialize UI if needed
        if (!webViewContainer) {
            initializeWebViewUI();
        }

        // If no active view, create one
        if (!activeWebViewId) {
            console.log('[WebView] Creating new web view');
            
            // Set initial dimensions based on view mode
            const width = isMobileView ? MOBILE_WIDTH : DESKTOP_WIDTH;
            const height = isMobileView ? MOBILE_HEIGHT : DESKTOP_HEIGHT;
            
            webViewBounds = {
                x: 100,
                y: 100,
                width: width,
                height: height
            };
            
            const result = await window.webView.create({
                url: 'https://www.youtube.com',
                bounds: {
                    x: Math.round(webViewBounds.x + CARD_PADDING),
                    y: Math.round(webViewBounds.y + CARD_PADDING),
                    width: Math.round(webViewBounds.width - (CARD_PADDING * 2)),
                    height: Math.round(webViewBounds.height - (CARD_PADDING * 2))
                },
                isMobileView: isMobileView
            });

            if (result.success) {
                activeWebViewId = result.viewId;
                isWebViewVisible = true;
                webViewContainer.style.display = 'block';
                if (webViewControls) {
                    webViewControls.style.display = 'flex';
                }
                updateHeaderVisibility();
                console.log('[WebView] Created:', activeWebViewId);
            } else {
                console.error('[WebView] Failed to create:', result.error);
            }
        } else {
            // Toggle visibility
            isWebViewVisible = !isWebViewVisible;
            
            const result = await window.webView.setVisible(activeWebViewId, isWebViewVisible);
            
            if (result.success) {
                webViewContainer.style.display = isWebViewVisible ? 'block' : 'none';
                if (webViewControls) {
                    webViewControls.style.display = isWebViewVisible ? 'flex' : 'none';
                }
                console.log('[WebView] Toggled visibility:', isWebViewVisible);
            } else {
                console.error('[WebView] Failed to toggle:', result.error);
            }
        }
    } catch (error) {
        console.error('[WebView] Toggle error:', error);
    }
}

/**
 * Destroy active web view
 */
export async function destroyWebView() {
    if (!activeWebViewId || !window.webView) return;

    try {
        const result = await window.webView.destroy(activeWebViewId);
        
        if (result.success) {
            console.log('[WebView] Destroyed:', activeWebViewId);
            activeWebViewId = null;
            isWebViewVisible = false;
            isMobileView = false; // Reset to desktop view
            if (webViewControls) {
                webViewControls.style.display = 'none';
            }
        } else {
            console.error('[WebView] Failed to destroy:', result.error);
        }
    } catch (error) {
        console.error('[WebView] Destroy error:', error);
    }
}

/**
 * Normalize URL - automatically add https:// if missing
 */
function normalizeUrl(input) {
    if (!input || !input.trim()) return input;
    
    const trimmed = input.trim();
    
    // If it already has a protocol, return as is
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    
    // If it starts with //, add https:
    if (trimmed.startsWith('//')) {
        return 'https:' + trimmed;
    }
    
    // For localhost or IP addresses, add https://
    if (/^(localhost|(\d{1,3}\.){3}\d{1,3})/i.test(trimmed)) {
        return 'https://' + trimmed;
    }
    
    // For domain-like strings (contains at least one dot or is a known TLD pattern)
    // Add https:// prefix
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(trimmed) || 
        /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z0-9.-]+/.test(trimmed)) {
        return 'https://' + trimmed;
    }
    
    // For simple domain names without TLD (like "google"), add https://www. prefix
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/.test(trimmed)) {
        return 'https://www.' + trimmed + '.com';
    }
    
    // Default: add https://
    return 'https://' + trimmed;
}

/**
 * Navigate web view to URL
 */
export async function navigateWebView(url) {
    if (!activeWebViewId || !window.webView) {
        console.warn('[WebView] No active view to navigate');
        return;
    }

    // Normalize URL before navigating
    const normalizedUrl = normalizeUrl(url);

    try {
        const result = await window.webView.navigate(activeWebViewId, normalizedUrl);
        
        if (result.success) {
            console.log('[WebView] Navigated to:', normalizedUrl);
        } else {
            console.error('[WebView] Failed to navigate:', result.error);
        }
    } catch (error) {
        console.error('[WebView] Navigate error:', error);
    }
}

/**
 * Check if web view is active
 */
export function isWebViewActive() {
    return activeWebViewId !== null;
}

/**
 * Check if web view is visible
 */
export function isWebViewShowing() {
    return isWebViewVisible;
}

/**
 * Check if mobile view is enabled
 */
export function isMobileViewEnabled() {
    return isMobileView;
}