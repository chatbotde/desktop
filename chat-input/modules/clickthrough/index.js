/**
 * Clickthrough Module
 * Main entry point for clickthrough functionality
 * Following SOLID principles with clear separation of concerns
 */

import { clickthroughService } from './services/clickthrough-service.js';
import { iframeMonitor } from './services/iframe-monitor-service.js';
import { buttonController } from './services/button-controller.js';
import { mouseTracker } from './core/mouse-tracker.js';
import { stateManager } from './core/state-manager.js';
import { rendererHandlers } from './handlers/renderer-handlers.js';
import { messageHandlers } from './handlers/message-handlers.js';
import { injectStyles } from './utils/dom-helpers.js';

/**
 * Initialize clickthrough system
 * @param {Object} options - Configuration options
 * @param {Object} options.chatInputAPI - Chat input API object
 * @param {HTMLElement} options.button - Clickthrough toggle button
 */
export function initialize({ chatInputAPI, button }) {
  console.log('[Clickthrough] Initializing...');
  
  // Initialize services with dependencies (DIP)
  clickthroughService.initialize(chatInputAPI);
  
  // Initialize button controller
  if (button) {
    buttonController.initialize(button);
    
    // Add button click handler
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      clickthroughService.toggle();
    });
  }
  
  // Initialize mouse tracker
  mouseTracker.initialize();
  
  // Restore previous state
  stateManager.restoreState();
  
  // Setup event listeners
  _setupEventListeners();
  
  // Start iframe monitoring
  iframeMonitor.start((isOverIframe) => {
    if (isOverIframe && clickthroughService.isEnabled()) {
      clickthroughService.disable();
    } else if (!isOverIframe && !clickthroughService.isEnabled()) {
      // Re-check if we should enable
      const position = mouseTracker.getPosition();
      const target = document.elementFromPoint(position.x, position.y);
      if (target && !rendererHandlers._isCardInteracting()) {
        clickthroughService.enable();
      }
    }
  });
  
  // Inject required styles
  _injectStyles();
  
  // Listen for state changes to broadcast to iframes
  stateManager.onChange(() => {
    messageHandlers.broadcastState();
  });
  
  // Cleanup on window unload
  window.addEventListener('beforeunload', cleanup);
  
  console.log('[Clickthrough] Initialized successfully');
}

/**
 * Setup event listeners
 * @private
 */
function _setupEventListeners() {
  // Click handler
  document.addEventListener('click', (e) => {
    rendererHandlers.handleClick(e);
  });
  
  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    rendererHandlers.handleMouseMove(e);
  });
  
  // Keyboard handler
  document.addEventListener('keydown', (e) => {
    rendererHandlers.handleKeyboard(e);
  });
  
  // Message handler for iframe communication
  window.addEventListener('message', (e) => {
    messageHandlers.handleMessage(e);
  });
}

/**
 * Inject required styles
 * @private
 */
function _injectStyles() {
  const styleId = 'clickthrough-styles';
  const cssText = `
    /* Ensure iframes are always interactive when click-through is disabled */
    iframe {
      pointer-events: auto !important;
    }
    
    /* When parent card is being interacted with, ensure it stays interactive */
    .floating-card.interacting iframe,
    .floating-card.dragging iframe,
    .floating-card.resizing iframe,
    .floating-card:hover iframe {
      pointer-events: auto !important;
    }
  `;
  
  injectStyles(styleId, cssText);
}

/**
 * Cleanup resources
 */
export function cleanup() {
  iframeMonitor.stop();
  mouseTracker.destroy();
  console.log('[Clickthrough] Cleanup complete');
}

/**
 * Toggle clickthrough mode
 */
export function toggle() {
  clickthroughService.toggle();
}

/**
 * Enable clickthrough mode
 */
export function enable() {
  clickthroughService.enable();
}

/**
 * Disable clickthrough mode
 */
export function disable() {
  clickthroughService.disable();
}

/**
 * Get current state
 * @returns {boolean} True if enabled
 */
export function isEnabled() {
  return stateManager.isEnabled();
}

// Export individual services for advanced usage
export {
  clickthroughService,
  iframeMonitor,
  buttonController,
  mouseTracker,
  stateManager,
  rendererHandlers,
  messageHandlers
};
