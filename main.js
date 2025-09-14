const { app, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const { LaunchWindowManager } = require("./launch-window");
const { ChatInputWindow } = require("./chat-input/chat-input-window");
const { AutoStartupManager } = require("./startup");

// Set app icon
if (process.platform === 'win32') {
  app.setAppUserModelId("com.sonicthinking.buddy");
}

// Global instances
let launchWindowManager = null;
let autoStartupManager = null;
let chatInputWindow = null;
let ipcHandlersRegistered = false;
let chatInputIpcHandlersRegistered = false;

function createLaunchWindow() {
  if (!launchWindowManager) {
    launchWindowManager = new LaunchWindowManager();
  }
  
  const launchWin = launchWindowManager.createLaunchWindow();
  
  // Ensure launch window has highest priority from start
  setTimeout(() => {
    if (launchWindowManager) {
      launchWindowManager.forceWindowAboveAll();
    }
  }, 500);
  
  // Setup IPC handlers (only once)
  if (!ipcHandlersRegistered) {
    console.log('Main: Setting up IPC handlers');
    
    ipcMain.on('open-main-window', () => {
      // Main window disabled – open or focus chat input instead
      console.log('Main: Opening chat input (main window disabled)');
      if (!chatInputWindow) {
        chatInputWindow = new ChatInputWindow();
        chatInputWindow.createChatInputWindow();
      }
      chatInputWindow.show();
      setTimeout(() => {
        if (launchWindowManager) {
          launchWindowManager.forceWindowAboveAll();
        }
      }, 200);
    });

    // Handle chat input window toggle
    ipcMain.on('toggle-chat-input', () => {
      console.log('Main: Toggle chat input requested');
      if (!chatInputWindow) {
        console.log('Main: Creating new chat input window');
        chatInputWindow = new ChatInputWindow();
        chatInputWindow.createChatInputWindow();
        
        // Set main window reference if available
        const mainWindow = launchWindowManager.getMainWindow();
        if (mainWindow) {
          chatInputWindow.setMainWindow(mainWindow);
        }
      } else {
        console.log('Main: Toggling existing chat input window');
        chatInputWindow.toggle();
        
        // Ensure launch window stays above chat input when toggled
        setTimeout(() => {
          if (launchWindowManager) {
            launchWindowManager.forceWindowAboveAll();
          }
        }, 200);
      }
    });

    // Handle chat input hide request
    ipcMain.on('hide-chat-input', () => {
      console.log('Main: Hide chat input requested');
      if (chatInputWindow) {
        chatInputWindow.hide();
      }
    });

    // Launch window content protection handlers (Highest Priority)
    ipcMain.handle('launch-window-toggle-content-protection', () => {
      if (launchWindowManager) {
        const enabled = launchWindowManager.toggleContentProtection();
        console.log(`Main: Launch window content protection ${enabled ? 'ENABLED' : 'DISABLED'} with highest priority`);
        return enabled;
      }
      return false;
    });

    ipcMain.handle('launch-window-get-content-protection', () => {
      if (launchWindowManager) {
        return launchWindowManager.isContentProtectionEnabled();
      }
      return false;
    });

    ipcMain.handle('launch-window-enable-content-protection', () => {
      if (launchWindowManager) {
        launchWindowManager.enableContentProtection();
        console.log('Main: Launch window content protection ENABLED with highest priority');
        return true;
      }
      return false;
    });

    ipcMain.handle('launch-window-disable-content-protection', () => {
      if (launchWindowManager) {
        launchWindowManager.disableContentProtection();
        console.log('Main: Launch window content protection DISABLED');
        return true;
      }
      return false;
    });

    // Memory optimization handlers

    ipcMain.handle('launch-window-toggle-memory-optimization', () => {
      if (launchWindowManager) {
        const enabled = launchWindowManager.toggleMemoryOptimization();
        console.log(`Main: Launch window memory optimization ${enabled ? 'ENABLED' : 'DISABLED'}`);
        return enabled;
      }
      return false;
    });

    ipcMain.handle('launch-window-get-memory-status', () => {
      if (launchWindowManager) {
        return launchWindowManager.getMemoryOptimizationStatus();
      }
      return { enabled: false, isInactive: false, hasInactiveTimer: false, hasHoverTimeout: false };
    });

    // NEW: Add handlers for the new memory management functions
    ipcMain.handle('launch-window-perform-memory-cleanup', async () => {
      if (launchWindowManager) {
        try {
          const result = await launchWindowManager.performMemoryCleanup();
          console.log('Main: Launch window memory cleanup completed');
          return result;
        } catch (error) {
          console.error('Main: Launch window memory cleanup failed:', error);
          return { error: error.message };
        }
      }
      return { error: 'Launch window manager not available' };
    });

    ipcMain.handle('launch-window-adjust-optimization-level', () => {
      if (launchWindowManager) {
        try {
          launchWindowManager.adjustOptimizationLevel();
          console.log('Main: Launch window optimization level adjusted');
          return { success: true };
        } catch (error) {
          console.error('Main: Launch window optimization adjustment failed:', error);
          return { error: error.message, success: false };
        }
      }
      return { error: 'Launch window manager not available', success: false };
    });

    ipcHandlersRegistered = true;
    console.log('Main: IPC handlers registered');
  }
  
  return launchWin;
}

app.whenReady().then(async () => {
  try {
    // Initialize auto-startup functionality
    autoStartupManager = new AutoStartupManager();
    
    // Setup auto-startup on first run or after installation
    await autoStartupManager.setupAutoStartup();
    
    createLaunchWindow();
    
    // Register global shortcuts
    registerGlobalShortcuts();
  } catch (error) {
    console.error('Main: Error during app initialization:', error);
    // Continue with basic functionality even if auto-startup fails
    createLaunchWindow();
    registerGlobalShortcuts();
  }
});

function registerGlobalShortcuts() {
  // Register Ctrl+H to hide/show chat input window
  const ret = globalShortcut.register('CommandOrControl+H', () => {
    console.log('Main: Global shortcut Ctrl+H pressed');
    if (chatInputWindow) {
      if (chatInputWindow.getChatInputWindow() && chatInputWindow.getChatInputWindow().isVisible()) {
        console.log('Main: Hiding chat input via global shortcut');
        chatInputWindow.hide();
      } else {
        console.log('Main: Showing chat input via global shortcut');
        chatInputWindow.show();
      }
    } else {
      console.log('Main: Chat input window not available, creating new one');
      // Create chat input window if it doesn't exist
      chatInputWindow = new ChatInputWindow();
      chatInputWindow.createChatInputWindow();
      
      // Set main window reference if available
      const mainWindow = launchWindowManager ? launchWindowManager.getMainWindow() : null;
      if (mainWindow) {
        chatInputWindow.setMainWindow(mainWindow);
      }
      
      chatInputWindow.show();
    }
  });

  if (!ret) {
    console.log('Main: Failed to register global shortcut Ctrl+H');
  } else {
    console.log('Main: Global shortcut Ctrl+H registered successfully');
  }
}

app.on("window-all-closed", () => {
  // Don't quit the app when all windows are closed
  // The launch window should persist
  // Only quit when explicitly closed via Ctrl+Alt+Y
});

app.on("will-quit", () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  // Clean up when quitting
  if (chatInputWindow) {
    chatInputWindow.destroy();
  }
  if (launchWindowManager) {
    launchWindowManager.closeLaunchWindow();
  }
});
