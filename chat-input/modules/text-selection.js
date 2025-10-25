import { getClipboardText } from './clipboard-injector.js';

/**
 * Text Selection Handler
 * Handles text selection events from the main process and UI interactions
 */

// Handle text selection changes from main process
export function handleTextSelection() {
  console.log('Text Selection: Setting up event listener');
  
  // Listen for text selection changes from main process
  if (window.electronAPI && window.electronAPI.onTextSelectionChanged) {
    window.electronAPI.onTextSelectionChanged((event, selectionData) => {
      console.log('Text Selection: Received selection data', selectionData);
      
      // Extract text from selection data
      const text = selectionData?.text || selectionData?.content || '';
      console.log('Text Selection: Extracted text length', text?.length || 0);
      
      // Only process non-empty text selections
      if (text && text.length > 0 && text.trim().length > 0) {
        // Build a simple signature to avoid duplicate injections
        const signature = JSON.stringify({
          t: 'text-selection',
          c: typeof text === 'string' ? text.slice(0, 1024) : null,
          timestamp: Date.now()
        });
        
        // Create a payload similar to clipboard payload
        const payload = {
          text: text,
          type: 'text/plain'
        };
        
        // Dispatch the same event that clipboard UI listens to
        try {
          document.dispatchEvent(new CustomEvent('clipboard:detected', {
            detail: { payload, signature }
          }));
          console.log('Text Selection: Dispatched clipboard:detected event with text length', text?.length || 0);
        } catch (error) {
          console.error('Text Selection: Error dispatching clipboard:detected event', error);
        }
      } else {
        console.log('Text Selection: Ignoring empty selection');
      }
    });
  } else {
    console.warn('Text Selection: electronAPI.onTextSelectionChanged not available');
  }
  
  // Listen for add text to input requests
  if (window.electronAPI && window.electronAPI.onAddTextToInput) {
    window.electronAPI.onAddTextToInput((event, text) => {
      console.log('Text Selection: Received add text to input request', text);
      
      // Add text directly to input
      if (text && typeof text === 'string') {
        try {
          // Import the appendToInput function dynamically to avoid circular dependencies
          import('./clipboard-injector.js').then(module => {
            module.appendToInput(text);
          });
        } catch (error) {
          console.error('Text Selection: Error adding text to input', error);
        }
      }
    });
  }
}

// Initialize text selection handling
export function initializeTextSelection() {
  try {
    console.log('Text Selection: Initializing text selection handling');
    
    // Add a small delay to ensure the DOM and other modules are ready
    setTimeout(() => {
      handleTextSelection();
      console.log('Text Selection: Initialized text selection handling');
    }, 100);
  } catch (error) {
    console.error('Text Selection: Failed to initialize text selection handling', error);
  }
}