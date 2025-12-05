/**
 * Text Selection UI Manager
 * REFACTORED to follow SOLID principles
 * 
 * This file now uses the orchestrator pattern with dependency injection
 * All components are separated into focused, testable classes:
 * - State Management: TextSelectionState, TimerManager
 * - UI Components: FabComponent, MiniBarComponent, PanelComponent
 * - Positioning: Various positioning strategies
 * - Actions: AskActionHandler, AddActionHandler, ChangeActionHandler, CopyActionHandler
 * - Coordination: TextSelectionOrchestrator
 */

import { TextSelectionOrchestrator } from './text-selection/orchestrator.js';

// Create singleton orchestrator instance
// DIP: Can be replaced with a different orchestrator for testing
const textSelectionOrchestrator = new TextSelectionOrchestrator();

/**
 * Initialize text selection UI
 * SRP: Single responsibility - setup only
 */
export function initTextSelectionUI() {
  console.log('Text Selection UI: Initializing SOLID-compliant architecture');

  // Initialize the orchestrator
  textSelectionOrchestrator.initialize();

  // Listen for text selection events
  document.addEventListener('text-selection:detected', (e) => {
    console.log('Text Selection UI: Received text-selection:detected event');
    const { text, payload } = e.detail || {};

    if (text && typeof text === 'string' && text.trim().length > 0) {
      textSelectionOrchestrator.show(text, payload);
    }
  });

  console.log('Text Selection UI: Initialization complete');
}

/**
 * Show text selection UI programmatically
 * DIP: Delegates to orchestrator
 */
export function showTextSelectionUI(text, payload = null) {
  if (text && typeof text === 'string' && text.trim().length > 0) {
    textSelectionOrchestrator.show(text, payload);
  }
}

/**
 * Hide text selection UI programmatically
 * DIP: Delegates to orchestrator
 */
export function hideTextSelectionUI() {
  textSelectionOrchestrator.hide();
}

/**
 * Get orchestrator instance (for testing/debugging)
 * Allows dependency injection and testing
 */
export function getOrchestrator() {
  return textSelectionOrchestrator;
}
