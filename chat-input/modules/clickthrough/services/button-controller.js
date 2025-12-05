/**
 * Button Controller Service
 * Manages UI button state updates
 * Following Single Responsibility Principle (SRP)
 */

import { stateManager } from '../core/state-manager.js';

class ButtonController {
  constructor() {
    this.button = null;
    this.initialized = false;
  }

  /**
   * Initialize with button element
   * @param {HTMLElement} buttonElement - Clickthrough toggle button
   */
  initialize(buttonElement) {
    if (!buttonElement) {
      console.warn('[ButtonController] No button element provided');
      return;
    }
    
    this.button = buttonElement;
    this.initialized = true;
    
    // Set initial state
    this.updateButton();
    
    // Listen for state changes
    stateManager.onChange(() => {
      this.updateButton();
    });
    
    console.log('[ButtonController] Initialized');
  }

  /**
   * Update button appearance based on state
   */
  updateButton() {
    if (!this.button) return;
    
    if (stateManager.isEnabled()) {
      this.button.classList.add('active');
      this.button.title = 'Click-through enabled - Click to disable';
    } else {
      this.button.classList.remove('active');
      this.button.title = 'Click-through disabled - Click to enable';
    }
  }

  /**
   * Get button element
   * @returns {HTMLElement|null} Button element
   */
  getButton() {
    return this.button;
  }
}

// Export singleton instance
export const buttonController = new ButtonController();
