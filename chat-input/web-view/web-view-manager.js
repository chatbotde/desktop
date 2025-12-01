/**
 * WebContentsView Manager
 * Handles creation and management of web views for external websites
 */

const { WebContentsView } = require('electron');

class WebViewManager {
  constructor() {
    this.activeViews = new Map();
  }

  /**
   * Create a new WebContentsView for a website
   * @param {BrowserWindow} parentWindow - The parent window
   * @param {Object} options - Configuration options
   * @returns {WebContentsView}
   */
  createWebView(parentWindow, options = {}) {
    const {
      url = 'https://www.youtube.com',
      bounds = { x: 0, y: 0, width: 375, height: 667 },
      viewId = `webview-${Date.now()}`,
      isMobileView = false
    } = options;

    // Create WebContentsView
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Set mobile user agent if needed
    if (isMobileView) {
      view.webContents.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
      );
    }

    // Set bounds
    view.setBounds(bounds);

    // Load URL
    view.webContents.loadURL(url);

    // Inject mouse event tracking script when page loads
    view.webContents.on('did-finish-load', () => {
      view.webContents.executeJavaScript(`
        (function() {
          let isMouseOver = false;
          
          document.addEventListener('mouseenter', () => {
            if (!isMouseOver) {
              isMouseOver = true;
              console.log('[WebView Content] Mouse entered');
            }
          }, true);
          
          document.addEventListener('mouseleave', () => {
            if (isMouseOver) {
              isMouseOver = false;
              console.log('[WebView Content] Mouse left');
            }
          }, true);
          
          // Track cursor position
          let lastX = 0, lastY = 0;
          document.addEventListener('mousemove', (e) => {
            lastX = e.clientX;
            lastY = e.clientY;
          });
        })();
      `).catch(err => console.error('Failed to inject mouse tracking:', err));
    });

    // Add to parent window - this makes it interactive by default
    parentWindow.contentView.addChildView(view);
    
    // Make sure the parent window is NOT ignoring mouse events initially
    // This ensures the WebContentsView can receive clicks
    if (parentWindow.isIgnoringMouseEvents && parentWindow.isIgnoringMouseEvents()) {
      parentWindow.setIgnoreMouseEvents(false);
    }

    // Setup mouse event listener on parent window to detect clicks on WebView area
    this._setupMouseClickDetection(parentWindow, viewId, bounds);

    // Store reference
    this.activeViews.set(viewId, {
      view,
      parentWindow,
      url,
      bounds,
      isMobileView
    });

    // Setup event listeners
    this._setupViewListeners(view, viewId);

    return { view, viewId };
  }

  /**
   * Setup event listeners for the web view
   * @private
   */
  _setupViewListeners(view, viewId) {
    // Navigation events
    view.webContents.on('did-start-loading', () => {
      console.log(`[WebView ${viewId}] Started loading`);
    });

    view.webContents.on('did-finish-load', () => {
      console.log(`[WebView ${viewId}] Finished loading`);
    });

    view.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`[WebView ${viewId}] Failed to load:`, errorDescription);
    });

    // New window handling
    view.webContents.setWindowOpenHandler(({ url }) => {
      console.log(`[WebView ${viewId}] Blocked new window:`, url);
      return { action: 'deny' };
    });

    // Security
    view.webContents.on('will-navigate', (event, url) => {
      console.log(`[WebView ${viewId}] Navigating to:`, url);
    });

    // Mouse events for click-through integration
    view.webContents.on('enter-html-full-screen', () => {
      console.log(`[WebView ${viewId}] Mouse entered (via full screen event)`);
      this._notifyMouseState(viewId, true);
    });

    view.webContents.on('leave-html-full-screen', () => {
      console.log(`[WebView ${viewId}] Mouse left (via full screen event)`);
      this._notifyMouseState(viewId, false);
    });
  }

  /**
   * Notify chat-input window about mouse state over WebView
   * @private
   */
  _notifyMouseState(viewId, isOver) {
    const viewData = this.activeViews.get(viewId);
    if (viewData && viewData.parentWindow && !viewData.parentWindow.isDestroyed()) {
      viewData.parentWindow.webContents.send('webview-mouse-state', { viewId, isOver });
    }
  }

  /**
   * Update web view bounds
   * @param {string} viewId - The view identifier
   * @param {Object} bounds - New bounds { x, y, width, height }
   */
  updateBounds(viewId, bounds) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      viewData.view.setBounds(bounds);
      viewData.bounds = bounds;
    }
  }

  /**
   * Navigate to a different URL
   * @param {string} viewId - The view identifier
   * @param {string} url - The URL to navigate to
   */
  navigate(viewId, url) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      viewData.view.webContents.loadURL(url);
      viewData.url = url;
    }
  }

  /**
   * Set user agent for the web view
   * @param {string} viewId - The view identifier
   * @param {string} userAgent - The user agent string
   */
  setUserAgent(viewId, userAgent) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      viewData.view.webContents.setUserAgent(userAgent);
    }
  }

  /**
   * Show/hide the web view
   * @param {string} viewId - The view identifier
   * @param {boolean} visible - Visibility state
   */
  setVisible(viewId, visible) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      viewData.view.setVisible(visible);
    }
  }

  /**
   * Set click-through mode for web view
   * @param {string} viewId - The view identifier
   * @param {boolean} enabled - Click-through enabled state
   */
  setClickThrough(viewId, enabled) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      try {
        // Set ignore mouse events on the web contents view
        viewData.view.setBackgroundColor({ r: 0, g: 0, b: 0, a: enabled ? 0 : 255 });
        
        // Make the view ignore mouse events when click-through is enabled
        if (enabled) {
          // Note: WebContentsView doesn't have setIgnoreMouseEvents like BrowserWindow
          // We need to handle this at the parent window level
          const { parentWindow } = viewData;
          if (parentWindow && !parentWindow.isDestroyed()) {
            // The parent window's click-through state will handle this
            console.log(`[WebView ${viewId}] Click-through enabled`);
          }
        } else {
          console.log(`[WebView ${viewId}] Click-through disabled`);
        }
      } catch (error) {
        console.error(`[WebView ${viewId}] Failed to set click-through:`, error);
      }
    }
  }

  /**
   * Focus the web view
   * @param {string} viewId - The view identifier
   */
  focusView(viewId) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      try {
        const { view, parentWindow } = viewData;
        
        // Always focus the parent window first (even if already focused)
        if (parentWindow && !parentWindow.isDestroyed()) {
          parentWindow.focus();
          
          // Disable click-through temporarily to ensure clicks work
          if (parentWindow.isIgnoringMouseEvents && parentWindow.isIgnoringMouseEvents()) {
            parentWindow.setIgnoreMouseEvents(false);
          }
        }
        
        // Then focus the WebContentsView's webContents
        view.webContents.focus();
        
        // Force activation by executing a focus script in the webContents
        view.webContents.executeJavaScript('window.focus();').catch(() => {});
        
        console.log(`[WebView ${viewId}] Focused`);
      } catch (error) {
        console.error(`[WebView ${viewId}] Failed to focus:`, error);
      }
    }
  }

  /**
   * Remove and destroy a web view
   * @param {string} viewId - The view identifier
   */
  destroyView(viewId) {
    const viewData = this.activeViews.get(viewId);
    if (viewData) {
      const { view, parentWindow } = viewData;
      
      // Remove from parent
      parentWindow.contentView.removeChildView(view);
      
      // Clean up
      this.activeViews.delete(viewId);
      
      console.log(`[WebView ${viewId}] Destroyed`);
    }
  }

  /**
   * Get all active views
   * @returns {Map}
   */
  getActiveViews() {
    return this.activeViews;
  }

  /**
   * Destroy all views
   */
  destroyAll() {
    for (const [viewId] of this.activeViews) {
      this.destroyView(viewId);
    }
  }
}

// Singleton instance
const webViewManager = new WebViewManager();

module.exports = {
  createWebView: (parentWindow, options) => webViewManager.createWebView(parentWindow, options),
  updateBounds: (viewId, bounds) => webViewManager.updateBounds(viewId, bounds),
  navigate: (viewId, url) => webViewManager.navigate(viewId, url),
  setUserAgent: (viewId, userAgent) => webViewManager.setUserAgent(viewId, userAgent),
  setVisible: (viewId, visible) => webViewManager.setVisible(viewId, visible),
  setClickThrough: (viewId, enabled) => webViewManager.setClickThrough(viewId, enabled),
  focusView: (viewId) => webViewManager.focusView(viewId),
  destroyView: (viewId) => webViewManager.destroyView(viewId),
  getActiveViews: () => webViewManager.getActiveViews(),
  destroyAll: () => webViewManager.destroyAll()
};