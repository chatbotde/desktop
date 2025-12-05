/**
 * Renderer Event Handlers
 * Handles DOM events in the renderer process
 * Following Single Responsibility Principle (SRP)
 */

import { clickthroughService } from '../services/clickthrough-service.js';
import { uiDetector } from '../core/ui-detector.js';
import { mouseTracker } from '../core/mouse-tracker.js';
import { iframeMonitor } from '../services/iframe-monitor-service.js';
import { getAllIframes, hasInteractionClasses } from '../utils/dom-helpers.js';

class RendererEventHandlers {
  /**
   * Handle click events
   * @param {MouseEvent} event - Mouse event
   */
  handleClick(event) {
    const target = event.target;
    
    // Disable click-through when clicking on UI elements
    if (uiDetector.isUIElement(target) && clickthroughService.isEnabled()) {
      clickthroughService.disable();
    }
  }

  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    const target = event.target;
    const position = mouseTracker.getPosition();
    
    const isUI = uiDetector.isUIElement(target);
    const overIframe = mouseTracker.isOverIframe();
    const cardInteracting = this._isCardInteracting();
    
    // Disable click-through if over UI, iframe, or interacting with cards
    if ((isUI || overIframe || cardInteracting) && clickthroughService.isEnabled()) {
      clickthroughService.disable();
    } 
    // Re-enable if cursor left all UI areas
    else if (!isUI && !overIframe && !cardInteracting && !clickthroughService.isEnabled()) {
      clickthroughService.enable();
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboard(event) {
    // Ctrl+T to toggle clickthrough
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault();
      clickthroughService.toggle();
    }
  }

  /**
   * Check if any card is being interacted with
   * @private
   * @returns {boolean} True if card is interacting
   */
  _isCardInteracting() {
    const iframes = getAllIframes();
    
    if (iframes.length === 0) {
      // Check for floating-card classes (backward compatibility)
      return document.querySelector('.floating-card.interacting, .floating-card.dragging, .floating-card.resizing') !== null;
    }
    
    for (const iframe of iframes) {
      if (hasInteractionClasses(iframe)) {
        return true;
      }
    }
    
    // Also check for specific floating-card classes
    return document.querySelector('.floating-card.interacting, .floating-card.dragging, .floating-card.resizing') !== null;
  }
}

// Export singleton instance
export const rendererHandlers = new RendererEventHandlers();
