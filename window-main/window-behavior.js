/**
 * Window behavior management - handles always on top, focus events, etc.
 */

function setupWindowBehavior(win) {
  // Set the window to always stay on top with highest priority
  win.setAlwaysOnTop(true, "screen-saver", 2);

  // Platform-specific configurations for maximum always-on-top behavior
  configurePlatformSpecificBehavior(win);

  // Add event listeners for maintaining behavior
  setupEventListeners(win);

  // Enable content protection
  win.setContentProtection(true);

  // Setup periodic maintenance
  setupPeriodicMaintenance(win);
}

function configurePlatformSpecificBehavior(win) {
  if (process.platform === "win32") {
    // Windows: Stay above taskbar and system menus with maximum priority
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
    win.setAlwaysOnTop(true, "floating", 2);
    
    // Force the window to stay above all other windows including taskbar
    setTimeout(() => {
      win.setAlwaysOnTop(false);
      win.setAlwaysOnTop(true, "screen-saver", 2);
    }, 100);
  } else if (process.platform === "darwin") {
    // macOS: Stay above dock and mission control
    win.setAlwaysOnTop(true, "floating", 2);
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
  } else if (process.platform === "linux") {
    // Linux: Stay above panels and system elements
    win.setAlwaysOnTop(true, "pop-up-menu", 2);
    win.setAlwaysOnTop(true, "modal-panel", 2);
    win.setAlwaysOnTop(true, "floating", 2);
  }
}

function setupEventListeners(win) {
  // Add event listener to maintain always-on-top behavior
  win.on('focus', () => {
    if (process.platform === "win32") {
      win.setAlwaysOnTop(true, "screen-saver", 2);
    }
  });

  // Add event listener for when other windows might affect our position
  win.on('blur', () => {
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        if (process.platform === "win32") {
          win.setAlwaysOnTop(true, "screen-saver", 2);
        } else {
          win.setAlwaysOnTop(true, "floating", 2);
        }
      }
    }, 50);
  });
}

function setupPeriodicMaintenance(win) {
  // Periodic check to ensure window stays above taskbar
  const maintainAlwaysOnTop = () => {
    if (win && !win.isDestroyed() && win.isVisible()) {
      if (process.platform === "win32") {
        win.setAlwaysOnTop(true, "screen-saver", 2);
      } else {
        win.setAlwaysOnTop(true, "floating", 2);
      }
    }
  };

  // Check every 2 seconds to maintain position above taskbar
  const alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 2000);
  
  // Clean up interval when window is destroyed
  win.on('closed', () => {
    if (alwaysOnTopInterval) {
      clearInterval(alwaysOnTopInterval);
    }
  });
}

function forceWindowAboveTaskbar(win) {
  if (win && !win.isDestroyed()) {
    // Force the window above taskbar with multiple attempts
    win.setAlwaysOnTop(false);
    setTimeout(() => {
      if (process.platform === "win32") {
        win.setAlwaysOnTop(true, "screen-saver", 2);
        win.setAlwaysOnTop(true, "floating", 2);
      } else {
        win.setAlwaysOnTop(true, "floating", 2);
      }
      // Bring to front
      win.showInactive();
      win.focus();
    }, 50);
  }
}

module.exports = {
  setupWindowBehavior,
  forceWindowAboveTaskbar
};
