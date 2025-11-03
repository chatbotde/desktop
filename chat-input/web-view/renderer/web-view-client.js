/**
 * WebView Renderer Module
 * Client-side utilities for managing web views
 */

class WebViewClient {
  constructor() {
    this.activeViews = new Map();
  }

  /**
   * Create a new web view
   * @param {Object} options - Configuration options
   * @returns {Promise<string>} - The view ID
   */
  async create(options = {}) {
    try {
      const result = await window.webView.create(options);
      
      if (result.success) {
        this.activeViews.set(result.viewId, {
          url: options.url || 'https://www.youtube.com',
          bounds: options.bounds || { x: 0, y: 0, width: 800, height: 600 },
          visible: true
        });
        
        console.log('[WebView Client] Created:', result.viewId);
        return result.viewId;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Create error:', error);
      throw error;
    }
  }

  /**
   * Update web view bounds
   * @param {string} viewId - The view identifier
   * @param {Object} bounds - New bounds { x, y, width, height }
   */
  async updateBounds(viewId, bounds) {
    try {
      const result = await window.webView.updateBounds(viewId, bounds);
      
      if (result.success) {
        const viewData = this.activeViews.get(viewId);
        if (viewData) {
          viewData.bounds = bounds;
        }
        console.log('[WebView Client] Bounds updated:', viewId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Update bounds error:', error);
      throw error;
    }
  }

  /**
   * Navigate to a different URL
   * @param {string} viewId - The view identifier
   * @param {string} url - The URL to navigate to
   */
  async navigate(viewId, url) {
    try {
      const result = await window.webView.navigate(viewId, url);
      
      if (result.success) {
        const viewData = this.activeViews.get(viewId);
        if (viewData) {
          viewData.url = url;
        }
        console.log('[WebView Client] Navigated to:', url);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Navigate error:', error);
      throw error;
    }
  }

  /**
   * Set user agent for the web view
   * @param {string} viewId - The view identifier
   * @param {string} userAgent - The user agent string
   */
  async setUserAgent(viewId, userAgent) {
    try {
      const result = await window.webView.setUserAgent(viewId, userAgent);
      
      if (result.success) {
        console.log('[WebView Client] User agent set:', viewId);
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Set user agent error:', error);
      throw error;
    }
  }

  /**
   * Show/hide the web view
   * @param {string} viewId - The view identifier
   * @param {boolean} visible - Visibility state
   */
  async setVisible(viewId, visible) {
    try {
      const result = await window.webView.setVisible(viewId, visible);
      
      if (result.success) {
        const viewData = this.activeViews.get(viewId);
        if (viewData) {
          viewData.visible = visible;
        }
        console.log('[WebView Client] Visibility set:', viewId, visible);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Set visible error:', error);
      throw error;
    }
  }

  /**
   * Destroy a web view
   * @param {string} viewId - The view identifier
   */
  async destroy(viewId) {
    try {
      const result = await window.webView.destroy(viewId);
      
      if (result.success) {
        this.activeViews.delete(viewId);
        console.log('[WebView Client] Destroyed:', viewId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Destroy error:', error);
      throw error;
    }
  }

  /**
   * Get all active web views
   * @returns {Promise<Array>}
   */
  async getActive() {
    try {
      const result = await window.webView.getActive();
      
      if (result.success) {
        return result.views;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WebView Client] Get active error:', error);
      throw error;
    }
  }

  /**
   * Get local view data
   * @param {string} viewId - The view identifier
   * @returns {Object|null}
   */
  getViewData(viewId) {
    return this.activeViews.get(viewId) || null;
  }

  /**
   * Get all local view data
   * @returns {Map}
   */
  getAllViewData() {
    return this.activeViews;
  }
}

// Export singleton instance
if (typeof window !== 'undefined') {
  window.webViewClient = new WebViewClient();
}