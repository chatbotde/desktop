/**
 * Text Selection Orchestrator
 * DIP: Depends on abstractions (interfaces) not implementations
 * SRP: Single responsibility - coordinates text selection components
 * 
 * This class follows all SOLID principles:
 * - Single Responsibility: Coordinates components, doesn't implement their logic
 * - Open/Closed: Open for extension via dependency injection
 * - Liskov Substitution: All dependencies can be replaced with compatible implementations
 * - Interface Segregation: Uses focused interfaces for each dependency
 * - Dependency Inversion: Depends on abstractions, not concrete classes
 */

import { FabComponent, MiniBarComponent, PanelComponent } from './ui-components.js';
import { FabPositioningStrategy, MiniBarPositioningStrategy, PanelPositioningStrategy } from './positioning-strategies.js';
import { AskActionHandler, AddActionHandler, ChangeActionHandler, CopyActionHandler } from './action-handlers.js';
import { TextSelectionState, TimerManager } from './state-manager.js';

export class TextSelectionOrchestrator {
  /**
   * DIP: Constructor accepts abstractions (can be injected for testing)
   */
  constructor(
    stateManager = null,
    timerManager = null,
    actionHandlers = null,
    positioningStrategies = null
  ) {
    // DIP: Inject dependencies or create defaults
    this.state = stateManager || new TextSelectionState();
    this.timers = timerManager || new TimerManager();
    
    // Create action handlers
    this.actionHandlers = actionHandlers || {
      ask: new AskActionHandler(),
      add: new AddActionHandler(),
      change: new ChangeActionHandler(),
      copy: new CopyActionHandler()
    };
    
    // Create positioning strategies
    this.positioningStrategies = positioningStrategies || {
      fab: new FabPositioningStrategy(),
      miniBar: new MiniBarPositioningStrategy(),
      panel: new PanelPositioningStrategy()
    };
    
    // UI Components (will be created on demand)
    this.fabComponent = null;
    this.miniBarComponent = null;
    this.panelComponent = null;
    
    // Event handlers
    this.resizeHandler = null;
    this.distanceHandler = null;
    
    // Bind methods to preserve context
    this.handleUserInputChange = this.handleUserInputChange.bind(this);
    this.hide = this.hide.bind(this);
    this.handleAsk = this.handleAsk.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
  }

  /**
   * Initialize components and event listeners
   * SRP: Single responsibility - setup only
   */
  initialize() {
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.state.setMousePosition(e.clientX, e.clientY);
    }, { passive: true });

    // Listen for selection cleared event
    document.addEventListener('text-selection:cleared', () => {
      console.log('Orchestrator: Selection cleared, hiding UI');
      this.hide();
    });

    this.resizeHandler = () => this.positionComponents();
  }

  /**
   * Create UI components with dependency injection
   * DIP: Components receive dependencies through constructor
   */
  createComponents() {
    // Create action handler wrappers that include context
    const actionHandlerWrappers = {
      ask: () => this.handleAsk(),
      add: () => this.handleAdd(),
      change: () => this.handleChange(),
      copy: () => this.handleCopy()
    };

    // Create FAB component
    if (!this.fabComponent) {
      this.fabComponent = new FabComponent(
        this.positioningStrategies.fab,
        () => this.showPanel()
      );
      this.fabComponent.create();
    }

    // Create Mini Bar component
    if (!this.miniBarComponent) {
      this.miniBarComponent = new MiniBarComponent(
        this.positioningStrategies.miniBar,
        actionHandlerWrappers,
        this.handleUserInputChange,
        this.hide
      );
      this.miniBarComponent.create();
    }

    // Create Panel component
    if (!this.panelComponent) {
      this.panelComponent = new PanelComponent(
        this.positioningStrategies.panel,
        actionHandlerWrappers,
        this.handleUserInputChange,
        this.hide
      );
      this.panelComponent.create();
    }
  }

  /**
   * Handle user input changes
   * SRP: Single responsibility - update state
   */
  handleUserInputChange(value) {
    this.state.setUserInput(value);
  }

  /**
   * Build action context for handlers
   * SRP: Single responsibility - prepare context
   */
  buildActionContext() {
    const stateSnapshot = this.state.getState();
    
    return {
      currentText: stateSnapshot.currentText,
      userInput: stateSnapshot.userInput,
      searchInput: this.miniBarComponent?.getChildElement('searchInput'),
      textarea: this.panelComponent?.getChildElement('textarea'),
      changeButton: this.panelComponent?.getChildElement('changeBtn'),
      copyButtons: [
        this.miniBarComponent?.getChildElement('copyBtn'),
        this.panelComponent?.getChildElement('copyBtnPanel')
      ].filter(Boolean),
      onHide: this.hide,
      onUserInputChange: this.handleUserInputChange
    };
  }

  /**
   * Action handler: Ask
   */
  async handleAsk() {
    const context = this.buildActionContext();
    await this.actionHandlers.ask.execute(context);
  }

  /**
   * Action handler: Add
   */
  async handleAdd() {
    const context = this.buildActionContext();
    await this.actionHandlers.add.execute(context);
  }

  /**
   * Action handler: Change
   */
  async handleChange() {
    const context = this.buildActionContext();
    await this.actionHandlers.change.execute(context);
  }

  /**
   * Action handler: Copy
   */
  async handleCopy() {
    const context = this.buildActionContext();
    await this.actionHandlers.copy.execute(context);
  }

  /**
   * Show text selection UI
   * SRP: Single responsibility - coordinate display
   */
  show(text, payload = null) {
    console.log('Orchestrator: Showing selection controls with text length', text?.length || 0);

    // Reset user input state
    this.state.setUserInput('');

    // Create components if needed
    this.createComponents();

    // Update state
    this.state.setCurrentText(text, payload);
    const mousePos = this.state.getMousePosition();
    this.state.setShowOrigin(mousePos.x, mousePos.y);

    // Set preview text
    if (this.panelComponent) {
      this.panelComponent.setPreviewText(text);
    }

    // Clear inputs
    if (this.miniBarComponent) {
      this.miniBarComponent.resetElement();
    }
    if (this.panelComponent) {
      this.panelComponent.clearInput();
    }

    // Show minimalist mini toolbar by default
    this.state.setVisibility(false, false, true);
    
    // Hide other UI elements first
    if (this.fabComponent) {
      this.fabComponent.hide();
    }
    if (this.panelComponent) {
      this.panelComponent.hide();
    }

    // Show and position mini bar
    if (this.miniBarComponent) {
      this.miniBarComponent.position(mousePos.x, mousePos.y);
      this.miniBarComponent.show();
      
      // Focus input after animation
      setTimeout(() => {
        if (this.state.getState().isMiniVisible) {
          this.miniBarComponent.focusInput();
        }
      }, 250);
    }

    // Setup window resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // Clear existing timers
    this.timers.clearAllTimers();

    // Start auto-hide timer
    this.startAutoHideTimer();

    // Setup distance-based hide handler
    this.setupDistanceHandler();
  }

  /**
   * Show expanded panel
   * SRP: Single responsibility - switch to panel view
   */
  showPanel() {
    if (!this.panelComponent) this.createComponents();
    
    if (this.fabComponent) this.fabComponent.hide();
    if (this.miniBarComponent) this.miniBarComponent.hide();
    
    this.state.setVisibility(true, false, false);
    
    const mousePos = this.state.getMousePosition();
    this.panelComponent.position(mousePos.x, mousePos.y);
    this.panelComponent.show();
  }

  /**
   * Position all visible components
   * SRP: Single responsibility - update positions
   */
  positionComponents() {
    const stateSnapshot = this.state.getState();
    const mousePos = this.state.getMousePosition();

    if (stateSnapshot.isVisible && this.panelComponent) {
      this.panelComponent.position(mousePos.x, mousePos.y);
    }

    if (stateSnapshot.isFabVisible && this.fabComponent) {
      this.fabComponent.position(mousePos.x, mousePos.y);
    }

    if (stateSnapshot.isMiniVisible && this.miniBarComponent) {
      this.miniBarComponent.position(mousePos.x, mousePos.y);
    }
  }

  /**
   * Start auto-hide timer
   * SRP: Single responsibility - timer management
   */
  startAutoHideTimer() {
    const AUTO_HIDE_DELAY = 2000; // 2 seconds

    this.timers.startTimer('autoHide', () => {
      const stateSnapshot = this.state.getState();
      
      // Don't hide if user is interacting
      const active = document.activeElement;
      if (this.miniBarComponent && active && this.miniBarComponent.getElement()?.contains(active)) {
        this.startAutoHideTimer(); // Restart timer
        return;
      }

      // Check mouse proximity
      if (this.miniBarComponent) {
        const rect = this.miniBarComponent.getElement()?.getBoundingClientRect();
        const mousePos = this.state.getMousePosition();
        
        if (rect) {
          // Check if mouse is inside
          if (mousePos.x >= rect.left && mousePos.x <= rect.right && 
              mousePos.y >= rect.top && mousePos.y <= rect.bottom) {
            this.startAutoHideTimer(); // Restart timer
            return;
          }

          // Check proximity
          const dx = Math.max(rect.left - mousePos.x, 0, mousePos.x - rect.right);
          const dy = Math.max(rect.top - mousePos.y, 0, mousePos.y - rect.bottom);
          const distance = Math.sqrt(dx*dx + dy*dy);
          
          if (distance < 150) {
            this.startAutoHideTimer(); // Restart timer
            return;
          }
        }
      }

      // No interaction, hide
      if (stateSnapshot.isMiniVisible) {
        this.hide();
      }
    }, AUTO_HIDE_DELAY);
  }

  /**
   * Setup distance-based hide handler
   * SRP: Single responsibility - distance monitoring
   */
  setupDistanceHandler() {
    const GRACE_PERIOD = 400;
    const DISTANCE_THRESHOLD = 250;

    // Remove existing handler
    if (this.distanceHandler) {
      window.removeEventListener('mousemove', this.distanceHandler);
    }

    this.distanceHandler = () => {
      const stateSnapshot = this.state.getState();
      if (!stateSnapshot.isMiniVisible) return;
      
      // Grace period
      const timeSinceShow = Date.now() - stateSnapshot.showTime;
      if (timeSinceShow < GRACE_PERIOD) return;
      
      // Don't hide if interacting
      const active = document.activeElement;
      if (this.miniBarComponent && active && this.miniBarComponent.getElement()?.contains(active)) {
        return;
      }
      
      // Check distance
      if (this.miniBarComponent) {
        const rect = this.miniBarComponent.getElement()?.getBoundingClientRect();
        const mousePos = this.state.getMousePosition();
        
        if (rect) {
          // Inside check
          if (mousePos.x >= rect.left && mousePos.x <= rect.right && 
              mousePos.y >= rect.top && mousePos.y <= rect.bottom) {
            return;
          }

          // Distance check
          const dx = Math.max(rect.left - mousePos.x, 0, mousePos.x - rect.right);
          const dy = Math.max(rect.top - mousePos.y, 0, mousePos.y - rect.bottom);
          const distance = Math.sqrt(dx*dx + dy*dy);

          if (distance > DISTANCE_THRESHOLD) {
            this.hide();
          }
        }
      }
    };
    
    // Start distance handler after grace period
    setTimeout(() => {
      if (this.state.getState().isMiniVisible) {
        window.addEventListener('mousemove', this.distanceHandler, { passive: true });
      }
    }, GRACE_PERIOD);
  }

  /**
   * Hide all UI components
   * SRP: Single responsibility - cleanup and hide
   */
  hide() {
    console.log('Orchestrator: Hiding all components');

    // Clear inputs
    if (this.miniBarComponent) {
      this.miniBarComponent.resetElement();
    }
    if (this.panelComponent) {
      this.panelComponent.clearInput();
    }
    this.state.setUserInput('');

    // Hide all components
    if (this.panelComponent) {
      this.panelComponent.hide();
    }
    if (this.fabComponent) {
      this.fabComponent.hide();
    }
    if (this.miniBarComponent) {
      this.miniBarComponent.hide();
    }

    // Update state
    this.state.setVisibility(false, false, false);

    // Cleanup
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.distanceHandler) {
      window.removeEventListener('mousemove', this.distanceHandler);
    }

    this.timers.clearAllTimers();
    this.state.resetState();
  }

  /**
   * Destroy all components
   * SRP: Single responsibility - complete cleanup
   */
  destroy() {
    this.hide();
    
    if (this.fabComponent) {
      this.fabComponent.destroy();
      this.fabComponent = null;
    }
    if (this.miniBarComponent) {
      this.miniBarComponent.destroy();
      this.miniBarComponent = null;
    }
    if (this.panelComponent) {
      this.panelComponent.destroy();
      this.panelComponent = null;
    }
  }
}
