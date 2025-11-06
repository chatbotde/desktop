const { ipcMain, BrowserWindow } = require('electron');
const SelectionHook = require('selection-hook');

/**
 * Text Selection Monitor
 * Monitors text selection changes across the system using OS-level APIs
 */
class TextSelectionMonitor {
  constructor() {
    this.isMonitoring = false;
    this.onSelectionCallbacks = [];
    this.lastSelection = null;
    this.lastSelectionTime = 0;
    this.selectionHook = null;
    this.debounceTimer = null;
    this.debounceDelay = 300; // milliseconds
    this.minTimeBetweenSameSelection = 1000; // Allow same text to trigger again after 1 second
  }

  /**
   * Start monitoring text selection changes
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    console.log('Text Selection Monitor: Starting text selection monitoring');
    this.isMonitoring = true;

    try {
      // Create a new instance of the selection hook
      this.selectionHook = new SelectionHook();
      
      // Listen for text selection changes
      this.selectionHook.on('text-selection', (data) => {
        this.handleSelectionChange(data);
      });
      
      // Start monitoring with default configuration
      this.selectionHook.start();
      
      console.log('Text Selection Monitor: Successfully started');
    } catch (error) {
      console.error('Text Selection Monitor: Error starting monitor:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Stop monitoring text selection changes
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('Text Selection Monitor: Stopping text selection monitoring');
    this.isMonitoring = false;

    // Clear any pending debounced events
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    try {
      if (this.selectionHook) {
        this.selectionHook.stop();
        this.selectionHook.cleanup();
        this.selectionHook = null;
      }
    } catch (error) {
      console.error('Text Selection Monitor: Error stopping monitor:', error);
    }
  }

  /**
   * Handle selection change events with debouncing
   */
  handleSelectionChange(selectionData) {
    if (!this.isMonitoring) return;

    // Debounce rapid selection changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processSelectionChange(selectionData);
      this.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * Process selection change events
   */
  processSelectionChange(selectionData) {
    try {
      // Validate selection data
      if (!selectionData || typeof selectionData !== 'object') {
        console.log('Text Selection Monitor: Invalid selection data received');
        return;
      }

      // Check if selection has actually changed
      if (this.hasSelectionChanged(this.lastSelection, selectionData)) {
        console.log('Text Selection Monitor: Text selection changed', selectionData?.text?.substring(0, 50) + '...');
        this.lastSelection = selectionData;
        this.lastSelectionTime = Date.now(); // Update timestamp

        // Notify all callbacks
        this.onSelectionCallbacks.forEach(callback => {
          try {
            callback(selectionData);
          } catch (error) {
            console.error('Text Selection Monitor: Error in selection callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Text Selection Monitor: Error handling selection change:', error);
    }
  }

  /**
   * Check if selection has changed
   */
  hasSelectionChanged(oldSelection, newSelection) {
    if (!oldSelection && !newSelection) return false;
    if (!oldSelection || !newSelection) return true;

    // Compare text content
    const oldText = oldSelection.text || '';
    const newText = newSelection.text || '';
    
    // If text is different, it's definitely a change
    if (oldText !== newText && newText.trim().length > 0) {
      return true;
    }
    
    // If text is the same, allow it to trigger again if enough time has passed
    // This allows users to select the same text again after the UI disappears
    if (oldText === newText && newText.trim().length > 0) {
      const timeSinceLastSelection = Date.now() - this.lastSelectionTime;
      if (timeSinceLastSelection >= this.minTimeBetweenSameSelection) {
        return true; // Allow same text to trigger again after delay
      }
    }
    
    return false;
  }

  /**
   * Add a callback for selection changes
   */
  onSelection(callback) {
    if (typeof callback === 'function') {
      this.onSelectionCallbacks.push(callback);
    }
  }

  /**
   * Remove a callback
   */
  removeCallback(callback) {
    const index = this.onSelectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.onSelectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Get monitoring status
   */
  isActive() {
    return this.isMonitoring;
  }

  /**
   * Get current selection
   */
  getCurrentSelection() {
    if (this.selectionHook) {
      try {
        return this.selectionHook.getCurrentSelection();
      } catch (error) {
        console.error('Text Selection Monitor: Error getting current selection:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Set debounce delay
   */
  setDebounceDelay(delay) {
    this.debounceDelay = delay;
  }
}

// Create singleton instance
const textSelectionMonitor = new TextSelectionMonitor();

// Export for use in main process
module.exports = {
  TextSelectionMonitor,
  textSelectionMonitor
};