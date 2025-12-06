/**
 * UI Element Detector for Interfaces Window
 * Detects if elements should block clickthrough (data-no-clickthrough)
 */

class UIDetector {
  /**
   * Check if an element should block clickthrough
   * Uses data-no-clickthrough attribute or checks if element is interactive
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element should be interactive (block clickthrough)
   */
  isUIElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    
    // Primary check: data-no-clickthrough attribute
    if (element.hasAttribute('data-no-clickthrough')) {
      return true;
    }
    
    // Check if parent has data-no-clickthrough
    if (element.closest('[data-no-clickthrough]')) {
      return true;
    }
    
    // Check interactive elements as fallback
    if (this._isInteractiveElement(element)) {
      return true;
    }
    
    // Check event handlers
    if (this._hasEventHandlers(element)) {
      return true;
    }
    
    // Check contenteditable
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if element is an interactive HTML element
   * @private
   */
  _isInteractiveElement(element) {
    const interactiveElements = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A', 'VIDEO', 'AUDIO'];
    return interactiveElements.includes(element.tagName);
  }

  /**
   * Check if element has event handlers
   * @private
   */
  _hasEventHandlers(element) {
    return element.onclick || element.onmousedown || element.onmouseup || 
           element.ondblclick || element.oncontextmenu;
  }
}

// Export singleton instance
export const uiDetector = new UIDetector();
