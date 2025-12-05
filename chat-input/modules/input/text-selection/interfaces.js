/**
 * Interfaces and Base Classes for Text Selection System
 * Following Interface Segregation Principle (ISP) - client-specific interfaces
 */

/**
 * Base interface for UI components
 * ISP: Focused interface for UI component lifecycle
 */
export class IUIComponent {
  create() {
    throw new Error('create() must be implemented');
  }

  show() {
    throw new Error('show() must be implemented');
  }

  hide() {
    throw new Error('hide() must be implemented');
  }

  isVisible() {
    throw new Error('isVisible() must be implemented');
  }

  getElement() {
    throw new Error('getElement() must be implemented');
  }

  destroy() {
    throw new Error('destroy() must be implemented');
  }
}

/**
 * Interface for positioning strategies
 * ISP: Focused interface for positioning logic
 */
export class IPositioningStrategy {
  calculatePosition(mouseX, mouseY, elementWidth, elementHeight) {
    throw new Error('calculatePosition() must be implemented');
  }
}

/**
 * Interface for action handlers
 * ISP: Focused interface for action execution
 */
export class IActionHandler {
  execute(context) {
    throw new Error('execute() must be implemented');
  }

  canExecute(context) {
    return true;
  }
}

/**
 * Interface for state management
 * ISP: Focused interface for state operations
 */
export class IStateManager {
  getState() {
    throw new Error('getState() must be implemented');
  }

  setState(state) {
    throw new Error('setState() must be implemented');
  }

  resetState() {
    throw new Error('resetState() must be implemented');
  }
}

/**
 * Interface for timer management
 * ISP: Focused interface for timer operations
 */
export class ITimerManager {
  startTimer(name, callback, delay) {
    throw new Error('startTimer() must be implemented');
  }

  clearTimer(name) {
    throw new Error('clearTimer() must be implemented');
  }

  clearAllTimers() {
    throw new Error('clearAllTimers() must be implemented');
  }
}

/**
 * Interface for event dispatchers
 * ISP: Focused interface for event handling
 */
export class IEventDispatcher {
  addEventListener(eventName, handler) {
    throw new Error('addEventListener() must be implemented');
  }

  removeEventListener(eventName, handler) {
    throw new Error('removeEventListener() must be implemented');
  }

  dispatchEvent(eventName, data) {
    throw new Error('dispatchEvent() must be implemented');
  }
}
