const { app, ipcMain } = require("electron");
const { LaunchWindowManager } = require("./launch-window");
const { registerIpcHandlers } = require("./window-main");
const { ChatInputWindow } = require("./chat-input/chat-input-window");

// Global instances
let launchWindowManager = null;
let chatInputWindow = null;
let ipcHandlersRegistered = false;
let chatInputIpcHandlersRegistered = false;

function createLaunchWindow() {
  if (!launchWindowManager) {
    launchWindowManager = new LaunchWindowManager();
  }
  
  const launchWin = launchWindowManager.createLaunchWindow();
  
  // Setup IPC handlers (only once)
  if (!ipcHandlersRegistered) {
    console.log('Main: Setting up IPC handlers');
    
    ipcMain.on('open-main-window', () => {
      console.log('Main: Opening main window');
      const mainWindow = launchWindowManager.openMainWindow();
      
      // Create and show chat input window automatically
      if (!chatInputWindow) {
        console.log('Main: Creating chat input window');
        chatInputWindow = new ChatInputWindow();
        chatInputWindow.createChatInputWindow();
        chatInputWindow.setMainWindow(mainWindow);
        
        // Show chat input window after a short delay to ensure main window is ready
        setTimeout(() => {
          chatInputWindow.show();
        }, 1000);
      } else {
        console.log('Main: Reusing existing chat input window');
        chatInputWindow.setMainWindow(mainWindow);
        chatInputWindow.show();
      }
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
      }
    });

    ipcHandlersRegistered = true;
    console.log('Main: IPC handlers registered');
  }
  
  return launchWin;
}

app.whenReady().then(createLaunchWindow);

app.on("window-all-closed", () => {
  // Don't quit the app when all windows are closed
  // The launch window should persist
  // Only quit when explicitly closed via Ctrl+Alt+Y
});

app.on("will-quit", () => {
  // Clean up when quitting
  if (chatInputWindow) {
    chatInputWindow.destroy();
  }
  if (launchWindowManager) {
    launchWindowManager.closeLaunchWindow();
  }
});
