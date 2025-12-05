/**
 * UI Element Detector
 * Detects if elements are part of the UI using multiple heuristics
 * Following Single Responsibility Principle (SRP)
 */

import { UI_PATTERNS } from '../utils/patterns.js';

class UIDetector {
  /**
   * Check if an element is part of the UI
   * Auto-detects UI elements using multiple heuristics
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is part of UI
   */
  isUIElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    
    // Check WebView container
    if (this._isWebViewElement(element)) return true;
    
    // Check if it's an iframe
    if (element.tagName === 'IFRAME') return true;
    
    // Check interactive elements
    if (this._isInteractiveElement(element)) return true;
    
    // Check event handlers
    if (this._hasEventHandlers(element)) return true;
    
    // Check data attributes
    if (this._hasDataAttributes(element)) return true;
    
    // Check ARIA roles
    if (this._hasARIARole(element)) return true;
    
    // Check class patterns
    if (this._hasUIClasses(element)) return true;
    
    // Check contenteditable
    if (element.contentEditable === 'true') return true;
    
    // Check computed styles
    if (this._hasUIStyles(element)) return true;
    
    // Check draggable
    if (element.draggable) return true;
    
    // Check tabindex
    if (element.hasAttribute('tabindex')) return true;
    
    // Check parent elements
    if (this._hasUIParents(element)) return true;
    
    return false;
  }

  /**
   * Check if element is WebView or inside it
   * @private
   */
  _isWebViewElement(element) {
    return element.id === 'webview-container' || element.closest('#webview-container') !== null;
  }

  /**
   * Check if element is an interactive HTML element
   * @private
   */
  _isInteractiveElement(element) {
    return UI_PATTERNS.interactiveElements.includes(element.tagName);
  }

  /**
   * Check if element has event handlers
   * @private
   */
  _hasEventHandlers(element) {
    return element.onclick || element.onmousedown || element.onmouseup || 
           element.ondblclick || element.oncontextmenu;
  }

  /**
   * Check if element has data attributes suggesting interactivity
   * @private
   */
  _hasDataAttributes(element) {
    return UI_PATTERNS.dataAttributes.some(attr => element.hasAttribute(attr));
  }

  /**
   * Check if element has ARIA role
   * @private
   */
  _hasARIARole(element) {
    const role = element.getAttribute('role');
    return role && UI_PATTERNS.ariaRoles.includes(role);
  }

  /**
   * Check if element has UI-related classes
   * @private
   */
  _hasUIClasses(element) {
    if (element.classList.length === 0) return false;
    
    const classString = Array.from(element.classList).join(' ');
    return UI_PATTERNS.classPatterns.some(pattern => pattern.test(classString));
  }

  /**
   * Check if element has UI-related styles
   * @private
   */
  _hasUIStyles(element) {
    const computedStyle = window.getComputedStyle(element);
    
    // Check cursor style
    if (computedStyle.cursor === 'pointer' || computedStyle.cursor === 'text') {
      return true;
    }
    
    // Check z-index
    const zIndex = computedStyle.zIndex;
    if (zIndex && zIndex !== 'auto' && parseInt(zIndex) > 0) {
      return true;
    }
    
    // Check opacity (semi-transparent overlays)
    const opacity = parseFloat(computedStyle.opacity);
    if (opacity > 0 && opacity < 1 && computedStyle.display !== 'none') {
      return true;
    }
    
    // Check position (fixed/absolute with reasonable size)
    const position = computedStyle.position;
    if (position === 'fixed' || position === 'absolute') {
      const rect = element.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if element has UI-related parents
   * @private
   */
  _hasUIParents(element, maxDepth = 5) {
    let parent = element.parentElement;
    let depth = 0;
    
    while (parent && depth < maxDepth) {
      // Check parent class patterns
      if (parent.classList.length > 0) {
        const parentClasses = Array.from(parent.classList).join(' ');
        if (UI_PATTERNS.classPatterns.some(pattern => pattern.test(parentClasses))) {
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
}

// Export singleton instance
export const uiDetector = new UIDetector();
