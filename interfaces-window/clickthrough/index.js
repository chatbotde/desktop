/**
 * Clickthrough Module for Interfaces Window
 * Main entry point for clickthrough functionality
 * 
 * Makes the entire window clickthrough except for elements marked with data-no-clickthrough
 */

import { mouseTracker } from './core/mouse-tracker.js';
import { stateManager } from './core/state-manager.js';
import { rendererHandlers } from './handlers/renderer-handlers.js';

/**
 * Initialize clickthrough system
 * @param {Object} clickthroughAPI - API object from preload script
 */
export function initialize(clickthroughAPI) {
  console.log('[Clickthrough] Initializing interfaces window clickthrough...');
  
  if (!clickthroughAPI) {
    console.error('[Clickthrough] No API provided');
    return;
  }
  
  // Initialize handlers with API
  rendererHandlers.initialize(clickthroughAPI);
  
  // Initialize mouse tracker
  mouseTracker.initialize();
  
  // Setup event listeners
  _setupEventListeners();
  
  // Start with clickthrough enabled (whole window transparent)
  clickthroughAPI.enable();
  
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
  }, true); // Use capture phase
  
  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    rendererHandlers.handleMouseMove(e);
  }, true); // Use capture phase
  
  // Keyboard handler
  document.addEventListener('keydown', (e) => {
    rendererHandlers.handleKeyboard(e);
  });
}

/**
 * Cleanup clickthrough system
 */
export function cleanup() {
  console.log('[Clickthrough] Cleaning up...');
  mouseTracker.destroy();
}

/**
 * Enable clickthrough manually
 */
export function enable() {
  if (window.clickthroughAPI) {
    window.clickthroughAPI.enable();
  }
}

/**
 * Disable clickthrough manually
 */
export function disable() {
  if (window.clickthroughAPI) {
    window.clickthroughAPI.disable();
  }
}

/**
 * Toggle clickthrough
 */
export function toggle() {
  if (window.clickthroughAPI) {
    window.clickthroughAPI.toggle();
  }
}
