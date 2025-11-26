/**
 * Minimal Mode UI Handler
 * 
 * Handles the UI changes when minimal mode is toggled via Ctrl+M.
 * In minimal mode:
 * - All UI elements are hidden (chat input, floating cards, etc.)
 * - The persistent toggle (right side transparent strip) stays exactly the same - no changes
 * - Clicking the persistent toggle restores all UI
 * 
 * This creates a distraction-free overlay that can be quickly accessed.
 */

class MinimalModeUI {
  constructor() {
    this.isMinimalMode = false;
    this.initialized = false;
    this.persistentToggle = null;
    this.hiddenElements = [];
    
    // Elements to hide in minimal mode
    this.elementsToHide = [
      '.chat-input-container',
      '.floating-cards-manager',
      '#floatingCardsContainer',
      '.hide-chat-button',
      '.attachments-container',
      '.badges-container'
    ];
  }

  /**
   * Initialize the minimal mode UI handler
   */
  initialize() {
    if (this.initialized) {
      console.log('MinimalModeUI: Already initialized');
      return;
    }

    console.log('MinimalModeUI: Initializing...');

    // Get persistent toggle element
    this.persistentToggle = document.getElementById('persistentToggle');
    
    if (!this.persistentToggle) {
      console.warn('MinimalModeUI: Persistent toggle not found, will retry...');
      // Retry after DOM is fully loaded
      setTimeout(() => this.initialize(), 100);
      return;
    }

    // Set up click handler on persistent toggle to restore UI
    this.setupPersistentToggleHandler();

    // Listen for minimal mode changes from main process
    this.setupIPCListeners();

    // Check initial state
    this.checkInitialState();

    this.initialized = true;
    console.log('MinimalModeUI: Initialized successfully');
  }

  /**
   * Set up click handler on persistent toggle
   * Only restores UI when in minimal mode - does not enable minimal mode on click
   */
  setupPersistentToggleHandler() {
    if (!this.persistentToggle) return;

    this.persistentToggle.addEventListener('click', () => {
      console.log('MinimalModeUI: Persistent toggle clicked');
      
      if (this.isMinimalMode) {
        // Restore UI from minimal mode
        this.disableMinimalMode();
        
        // Notify main process
        if (window.chatInputAPI && window.chatInputAPI.disableMinimalMode) {
          window.chatInputAPI.disableMinimalMode();
        }
      }
      // Don't enable minimal mode on click - only via Ctrl+M shortcut
    });

    console.log('MinimalModeUI: Persistent toggle handler set up');
  }

  /**
   * Set up IPC listeners for minimal mode changes
   */
  setupIPCListeners() {
    if (window.chatInputAPI && window.chatInputAPI.onMinimalModeChanged) {
      window.chatInputAPI.onMinimalModeChanged((isMinimal) => {
        console.log('MinimalModeUI: Received minimal mode change:', isMinimal);
        if (isMinimal) {
          this.enableMinimalMode();
        } else {
          this.disableMinimalMode();
        }
      });
    }
  }

  /**
   * Check initial state from main process
   */
  async checkInitialState() {
    if (window.chatInputAPI && window.chatInputAPI.getMinimalModeStatus) {
      try {
        const isMinimal = await window.chatInputAPI.getMinimalModeStatus();
        if (isMinimal) {
          this.enableMinimalMode();
        }
      } catch (error) {
        console.error('MinimalModeUI: Error checking initial state:', error);
      }
    }
  }

  /**
   * Enable minimal mode - hide all UI except persistent toggle
   * The persistent toggle stays exactly the same - no visual changes to it
   */
  enableMinimalMode() {
    if (this.isMinimalMode) {
      console.log('MinimalModeUI: Already in minimal mode');
      return;
    }

    console.log('MinimalModeUI: Enabling minimal mode');
    this.isMinimalMode = true;

    // Hide all specified elements with smooth transition
    this.elementsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element && element !== this.persistentToggle) {
          // Store original values
          element.dataset.minimalOriginalDisplay = element.style.display || '';
          element.dataset.minimalOriginalOpacity = element.style.opacity || '';
          
          // Fade out first
          element.style.transition = 'opacity 0.2s ease-out';
          element.style.opacity = '0';
          element.style.pointerEvents = 'none';
          
          // Then hide after transition
          setTimeout(() => {
            if (this.isMinimalMode && element.dataset.minimalOriginalDisplay !== undefined) {
              element.style.display = 'none';
            }
          }, 200);
          
          this.hiddenElements.push(element);
        }
      });
    });

    // Also hide any floating cards that are dynamically created
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach(card => {
      card.dataset.minimalOriginalDisplay = card.style.display || '';
      card.dataset.minimalOriginalOpacity = card.style.opacity || '';
      card.style.transition = 'opacity 0.2s ease-out';
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      setTimeout(() => {
        if (this.isMinimalMode) {
          card.style.display = 'none';
        }
      }, 200);
      this.hiddenElements.push(card);
    });

    // Add data attribute to body for any CSS hooks
    document.body.dataset.minimalMode = 'true';

    console.log('MinimalModeUI: Minimal mode enabled, hidden', this.hiddenElements.length, 'elements');
  }

  /**
   * Disable minimal mode - show all hidden UI elements
   * The persistent toggle stays exactly the same - no visual changes to it
   */
  disableMinimalMode() {
    if (!this.isMinimalMode) {
      console.log('MinimalModeUI: Already in full mode');
      return;
    }

    console.log('MinimalModeUI: Disabling minimal mode');
    this.isMinimalMode = false;

    // Remove body data attribute
    delete document.body.dataset.minimalMode;

    // Restore all hidden elements with smooth transition
    this.hiddenElements.forEach(element => {
      if (element) {
        // First restore display
        const originalDisplay = element.dataset.minimalOriginalDisplay;
        element.style.display = originalDisplay || '';
        element.style.pointerEvents = '';
        
        // Then fade in
        requestAnimationFrame(() => {
          element.style.transition = 'opacity 0.2s ease-in';
          element.style.opacity = element.dataset.minimalOriginalOpacity || '';
        });
        
        // Clean up data attributes
        delete element.dataset.minimalOriginalDisplay;
        delete element.dataset.minimalOriginalOpacity;
      }
    });

    // Clear hidden elements array
    this.hiddenElements = [];

    console.log('MinimalModeUI: Minimal mode disabled, all elements restored');
  }

  /**
   * Toggle minimal mode
   */
  toggle() {
    if (this.isMinimalMode) {
      this.disableMinimalMode();
    } else {
      this.enableMinimalMode();
    }
  }

  /**
   * Get current mode status
   * @returns {boolean} True if in minimal mode
   */
  getStatus() {
    return this.isMinimalMode;
  }
}

// Create and export singleton instance
const minimalModeUI = new MinimalModeUI();

export { minimalModeUI, MinimalModeUI };
export default minimalModeUI;
