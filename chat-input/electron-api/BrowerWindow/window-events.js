/**
 * Window Events Module
 * Handles event management for browser windows
 */

/**
 * Add event listener to a window
 */
function addEventListener(windowId, event, handler, windows, eventHandlers) {
  const window = windows.get(windowId);
  if (!window || window.isDestroyed()) {
    return false;
  }

  // Store handler reference for removal later
  if (!eventHandlers.has(windowId)) {
    eventHandlers.set(windowId, new Map());
  }
  
  const windowEvents = eventHandlers.get(windowId);
  if (!windowEvents.has(event)) {
    windowEvents.set(event, new Set());
  }
  
  windowEvents.get(event).add(handler);
  
  // Add the event listener
  window.on(event, handler);
  
  return true;
}

/**
 * Remove event listener from a window
 */
function removeEventListener(windowId, event, handler, windows, eventHandlers) {
  const window = windows.get(windowId);
  if (!window || window.isDestroyed()) {
    return false;
  }

  // Remove handler reference
  const windowEvents = eventHandlers.get(windowId);
  if (windowEvents && windowEvents.has(event)) {
    windowEvents.get(event).delete(handler);
    
    // Clean up empty event sets
    if (windowEvents.get(event).size === 0) {
      windowEvents.delete(event);
    }
    
    // Clean up empty window event maps
    if (windowEvents.size === 0) {
      eventHandlers.delete(windowId);
    }
  }
  
  // Remove the actual event listener
  window.removeListener(event, handler);
  
  return true;
}

/**
 * Remove all event listeners for a window
 */
function removeAllEventListeners(windowId, windows, eventHandlers) {
  const window = windows.get(windowId);
  if (!window || window.isDestroyed()) {
    return false;
  }

  // Remove all stored handlers
  const windowEvents = eventHandlers.get(windowId);
  if (windowEvents) {
    for (const [event, handlers] of windowEvents) {
      for (const handler of handlers) {
        window.removeListener(event, handler);
      }
    }
    eventHandlers.delete(windowId);
  }
  
  return true;
}

/**
 * Get all event listeners for a window
 */
function getEventListeners(windowId, eventHandlers) {
  const windowEvents = eventHandlers.get(windowId);
  if (!windowEvents) {
    return {};
  }
  
  const listeners = {};
  for (const [event, handlers] of windowEvents) {
    listeners[event] = handlers.size;
  }
  
  return listeners;
}

/**
 * Set up default event handlers for a window
 */
function setupDefaultEventHandlers(windowId, windows, eventHandlers, windowConfigs) {
  const window = windows.get(windowId);
  if (!window || window.isDestroyed()) {
    return false;
  }

  // Handle window closed
  const closedHandler = () => {
    removeAllEventListeners(windowId, windows, eventHandlers);
    windows.delete(windowId);
    windowConfigs.delete(windowId);
  };
  
  // Handle window ready-to-show
  const readyHandler = () => {
    console.log(`Window ${windowId} is ready to show`);
  };
  
  // Handle navigation events
  const navigationHandler = (event, url) => {
    console.log(`Window ${windowId} navigating to: ${url}`);
  };
  
  // Add default handlers
  addEventListener(windowId, 'closed', closedHandler, windows, eventHandlers);
  addEventListener(windowId, 'ready-to-show', readyHandler, windows, eventHandlers);
  
  // Add webContents navigation handler
  if (window.webContents) {
    window.webContents.on('will-navigate', navigationHandler);
    window.webContents.on('did-navigate', navigationHandler);
  }
  
  return true;
}

/**
 * Common event handler factories
 */
const eventHandlerFactories = {
  // Window state handlers
  onWindowStateChange: (callback) => {
    return () => {
      if (callback) callback();
    };
  },
  
  // Navigation handlers
  onNavigationStart: (callback) => {
    return (event, url) => {
      if (callback) callback(url, event);
    };
  },
  
  onNavigationComplete: (callback) => {
    return (event, url) => {
      if (callback) callback(url, event);
    };
  },
  
  // Load handlers
  onPageLoad: (callback) => {
    return (event) => {
      if (callback) callback(event);
    };
  },
  
  // Error handlers
  onPageError: (callback) => {
    return (event, errorCode, errorDescription, validatedURL) => {
      if (callback) callback({ errorCode, errorDescription, validatedURL, event });
    };
  }
};

module.exports = {
  addEventListener,
  removeEventListener,
  removeAllEventListeners,
  getEventListeners,
  setupDefaultEventHandlers,
  eventHandlerFactories
};