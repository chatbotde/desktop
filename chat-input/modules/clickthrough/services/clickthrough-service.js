/**
 * Clickthrough Service
 * Core service for enabling/disabling clickthrough mode
 * Following Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP)
 */

import { stateManager } from '../core/state-manager.js';

class ClickthroughService {
  constructor() {
    this.api = null;
  }

  /**
   * Initialize service with API dependency
   * Following Dependency Inversion Principle (DIP)
   * @param {Object} chatInputAPI - API object with clickthrough methods
   */
  initialize(chatInputAPI) {
    if (!chatInputAPI) {
      console.warn('[ClickthroughService] No API provided');
      return;
    }
    this.api = chatInputAPI;
  }

  /**
   * Enable clickthrough mode
   */
  enable() {
    if (!this.api?.enableClickThrough) {
      console.error('[ClickthroughService] API not initialized');
      return;
    }
    
    this.api.enableClickThrough();
    stateManager.enable();
    console.log('[ClickthroughService] Enabled');
  }

  /**
   * Disable clickthrough mode
   */
  disable() {
    if (!this.api?.disableClickThrough) {
      console.error('[ClickthroughService] API not initialized');
      return;
    }
    
    this.api.disableClickThrough();
    stateManager.disable();
    console.log('[ClickthroughService] Disabled');
  }

  /**
   * Toggle clickthrough mode
   */
  toggle() {
    if (stateManager.isEnabled()) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Get current state
   * @returns {boolean} Current enabled state
   */
  isEnabled() {
    return stateManager.isEnabled();
  }
}

// Export singleton instance
export const clickthroughService = new ClickthroughService();
