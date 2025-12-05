/**
 * Iframe Monitor Service
 * Continuously monitors iframe hover state
 * Following Single Responsibility Principle (SRP)
 */

import { mouseTracker } from '../core/mouse-tracker.js';
import { getAllIframes, isElementHidden, isPointInElement } from '../utils/dom-helpers.js';

class IframeMonitorService {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 50; // Check every 50ms
    this.onStateChangeCallback = null;
  }

  /**
   * Start monitoring iframes
   * @param {Function} onStateChange - Callback when state changes
   */
  start(onStateChange) {
    if (this.intervalId) return;
    
    this.onStateChangeCallback = onStateChange;
    
    this.intervalId = setInterval(() => {
      this._checkIframeHover();
    }, this.checkInterval);
    
    console.log('[IframeMonitor] Started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[IframeMonitor] Stopped');
    }
  }

  /**
   * Check if mouse is over any iframe
   * @private
   */
  _checkIframeHover() {
    const position = mouseTracker.getPosition();
    const isOverIframe = this._isOverAnyIframe(position.x, position.y);
    const wasOverIframe = mouseTracker.isOverIframe();
    
    if (isOverIframe !== wasOverIframe) {
      mouseTracker.setIframeHover(isOverIframe);
      
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(isOverIframe);
      }
    }
  }

  /**
   * Check if point is over any visible iframe
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if over iframe
   */
  _isOverAnyIframe(x, y) {
    const iframes = getAllIframes();
    
    if (iframes.length === 0) {
      // Check WebView container for backward compatibility
      return this._isOverWebView(x, y);
    }
    
    for (const iframe of iframes) {
      if (isElementHidden(iframe)) continue;
      
      if (isPointInElement(x, y, iframe)) {
        return true;
      }
    }
    
    // Also check WebView container
    return this._isOverWebView(x, y);
  }

  /**
   * Check if point is over WebView container
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if over WebView
   */
  _isOverWebView(x, y) {
    const webViewContainer = document.getElementById('webview-container');
    if (!webViewContainer || webViewContainer.style.display === 'none') {
      return false;
    }
    
    return isPointInElement(x, y, webViewContainer);
  }
}

// Export singleton instance
export const iframeMonitor = new IframeMonitorService();
