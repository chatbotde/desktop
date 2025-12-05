import { IStateManager } from './interfaces.js';

/**
 * TextSelectionState
 * SRP: Single responsibility - manages text selection state
 */
export class TextSelectionState extends IStateManager {
  constructor() {
    super();
    this.state = {
      currentText: '',
      currentPayload: null,
      userInput: '',
      isVisible: false,
      isFabVisible: false,
      isMiniVisible: false,
      lastMouseX: window.innerWidth / 2,
      lastMouseY: window.innerHeight / 2,
      showOriginX: 0,
      showOriginY: 0,
      showTime: 0
    };
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  resetState() {
    this.state.currentText = '';
    this.state.currentPayload = null;
    this.state.userInput = '';
    this.state.isVisible = false;
    this.state.isFabVisible = false;
    this.state.isMiniVisible = false;
  }

  // Convenience methods
  setCurrentText(text, payload = null) {
    this.state.currentText = text;
    this.state.currentPayload = payload;
  }

  setUserInput(input) {
    this.state.userInput = input;
  }

  setMousePosition(x, y) {
    this.state.lastMouseX = x;
    this.state.lastMouseY = y;
  }

  setVisibility(isVisible, isFab, isMini) {
    this.state.isVisible = isVisible;
    this.state.isFabVisible = isFab;
    this.state.isMiniVisible = isMini;
  }

  setShowOrigin(x, y) {
    this.state.showOriginX = x;
    this.state.showOriginY = y;
    this.state.showTime = Date.now();
  }

  getCurrentText() {
    return this.state.currentText;
  }

  getUserInput() {
    return this.state.userInput;
  }

  getMousePosition() {
    return {
      x: this.state.lastMouseX,
      y: this.state.lastMouseY
    };
  }

  isAnyVisible() {
    return this.state.isVisible || this.state.isFabVisible || this.state.isMiniVisible;
  }
}

/**
 * TimerManager
 * SRP: Single responsibility - manages all timers
 */
export class TimerManager extends IStateManager {
  constructor() {
    super();
    this.timers = new Map();
  }

  startTimer(name, callback, delay) {
    // Clear existing timer with same name
    this.clearTimer(name);
    
    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(name);
    }, delay);
    
    this.timers.set(name, timerId);
  }

  clearTimer(name) {
    if (this.timers.has(name)) {
      clearTimeout(this.timers.get(name));
      this.timers.delete(name);
    }
  }

  clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
  }

  hasTimer(name) {
    return this.timers.has(name);
  }
}
