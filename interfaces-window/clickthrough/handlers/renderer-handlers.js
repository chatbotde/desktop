/**
 * Renderer Event Handlers for Interfaces Window
 * Handles DOM events for clickthrough toggling
 */

import { uiDetector } from '../core/ui-detector.js';
import { mouseTracker } from '../core/mouse-tracker.js';

class RendererEventHandlers {
  constructor() {
    this.clickthroughAPI = null;
  }

  /**
   * Initialize with API
   * @param {Object} api - Clickthrough API from preload
   */
  initialize(api) {
    this.clickthroughAPI = api;
  }

  /**
   * Handle click events
   * @param {MouseEvent} event - Mouse event
   */
  handleClick(event) {
    const target = event.target;
    
    // If clicking on UI element, ensure clickthrough is disabled
    if (uiDetector.isUIElement(target)) {
      this.clickthroughAPI?.disable();
    }
  }

  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    const target = event.target;
    
    // Check if mouse is over UI element
    const isUI = uiDetector.isUIElement(target);
    
    if (isUI) {
      // Disable clickthrough when over UI
      this.clickthroughAPI?.disable();
    } else {
      // Enable clickthrough when not over UI
      this.clickthroughAPI?.enable();
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboard(event) {
    // Ctrl+T to toggle clickthrough manually
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault();
      this.clickthroughAPI?.toggle();
    }
  }
}

// Export singleton instance
export const rendererHandlers = new RendererEventHandlers();
