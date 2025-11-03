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
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'webview-header';
    header.style.cssText = `
        height: ${isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT}px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        cursor: move;
        user-select: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Header title
    const title = document.createElement('div');
    title.className = 'webview-title';
    title.textContent = 'Web View';
    title.style.cssText = `
        color: white;
        font-size: 14px;
        font-weight: 600;
        flex: 1;
    `;

    // URL input
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'Enter URL...';
    urlInput.value = 'https://www.youtube.com';
    urlInput.className = 'webview-url-input';
    urlInput.style.cssText = `
        flex: 1;
        margin: 0 12px;
        padding: 6px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 12px;
        outline: none;
    `;

    urlInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && activeWebViewId) {
            await navigateWebView(urlInput.value);
        }
    });

    // Header buttons
    const headerButtons = document.createElement('div');
    headerButtons.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Mobile/Desktop toggle button
    const viewToggleBtn = createHeaderButton(isMobileView ? '🖥️' : '📱', 
        isMobileView ? 'Switch to Desktop View' : 'Switch to Mobile View');
    viewToggleBtn.addEventListener('click', () => toggleMobileView());

    // Minimize button
    const minBtn = createHeaderButton('_', 'Minimize');
    minBtn.addEventListener('click', () => {
        const smallWidth = isMobileView ? 320 : 320;
        const smallHeight = isMobileView ? 480 : 180;
        updateWebViewSize(smallWidth, smallHeight);
    });

    // Maximize button
    const maxBtn = createHeaderButton('□', 'Maximize');
    maxBtn.addEventListener('click', () => {
        const largeWidth = isMobileView ? 414 : 800;
        const largeHeight = isMobileView ? 736 : 600;
        updateWebViewSize(largeWidth, largeHeight);
    });

    // Close button
    const closeBtn = createHeaderButton('×', 'Close');
    closeBtn.addEventListener('click', () => toggleWebView());

    headerButtons.appendChild(viewToggleBtn);
    headerButtons.appendChild(minBtn);
    headerButtons.appendChild(maxBtn);
    headerButtons.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(urlInput);
    header.appendChild(headerButtons);

    // Create content area placeholder
    const content = document.createElement('div');
    content.className = 'webview-content';
    content.style.cssText = `
        width: 100%;
        height: calc(100% - ${isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT}px);
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

    webViewContainer.appendChild(header);
    webViewContainer.appendChild(content);
    document.body.appendChild(webViewContainer);

    // Setup event listeners
    setupDragListeners(header);
    setupResizeListeners();
    setupClickthroughIntegration();
}

function createHeaderButton(text, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    `;
    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
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
        const header = webViewContainer.querySelector('.webview-header');
        const headerVisible = header.style.display !== 'none';
        const headerHeight = isMobileView ? MOBILE_HEADER_HEIGHT : 
            (headerVisible ? DESKTOP_HEADER_HEIGHT : 0);
        const contentY = headerVisible ? headerHeight : 0;
        const contentHeight = headerVisible ? webViewBounds.height - headerHeight : webViewBounds.height;

        window.webView.updateBounds(activeWebViewId, {
            x: Math.round(webViewBounds.x),
            y: Math.round(webViewBounds.y + contentY),
            width: Math.round(webViewBounds.width),
            height: Math.round(contentHeight)
        });
    }
}

function updateHeaderVisibility() {
    if (!webViewContainer) return;

    const header = webViewContainer.querySelector('.webview-header');
    const content = webViewContainer.querySelector('.webview-content');
    
    const shouldShowHeader = webViewBounds.width >= MIN_WIDTH_FOR_HEADER && 
                            webViewBounds.height >= MIN_HEIGHT_FOR_HEADER;

    if (shouldShowHeader) {
        header.style.display = 'flex';
        const headerHeight = isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT;
        content.style.height = `calc(100% - ${headerHeight}px)`;
        header.style.height = `${headerHeight}px`;
    } else {
        header.style.display = 'none';
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
    
    // Update button appearance
    const viewToggleBtn = webViewContainer?.querySelector('.webview-header button[title*="View"]');
    if (viewToggleBtn) {
        viewToggleBtn.textContent = isMobileView ? '🖥️' : '📱';
        viewToggleBtn.title = isMobileView ? 'Switch to Desktop View' : 'Switch to Mobile View';
    }
    
    // Update header height
    const header = webViewContainer?.querySelector('.webview-header');
    if (header) {
        header.style.height = `${isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT}px`;
    }
    
    // Update content height
    const content = webViewContainer?.querySelector('.webview-content');
    if (content) {
        content.style.height = `calc(100% - ${isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT}px)`;
    }
    
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
            const headerHeight = isMobileView ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT;
            
            webViewBounds = {
                x: 100,
                y: 100,
                width: width,
                height: height
            };
            
            const result = await window.webView.create({
                url: 'https://www.youtube.com',
                bounds: {
                    x: Math.round(webViewBounds.x),
                    y: Math.round(webViewBounds.y + headerHeight),
                    width: Math.round(webViewBounds.width),
                    height: Math.round(webViewBounds.height - headerHeight)
                },
                isMobileView: isMobileView
            });

            if (result.success) {
                activeWebViewId = result.viewId;
                isWebViewVisible = true;
                webViewContainer.style.display = 'block';
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
        } else {
            console.error('[WebView] Failed to destroy:', result.error);
        }
    } catch (error) {
        console.error('[WebView] Destroy error:', error);
    }
}

/**
 * Navigate web view to URL
 */
export async function navigateWebView(url) {
    if (!activeWebViewId || !window.webView) {
        console.warn('[WebView] No active view to navigate');
        return;
    }

    try {
        const result = await window.webView.navigate(activeWebViewId, url);
        
        if (result.success) {
            console.log('[WebView] Navigated to:', url);
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