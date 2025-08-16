const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

class ChatInputWindow {
  constructor() {
    this.chatInputWindow = null;
    this.mainWindow = null;
  }

  // Static property to track IPC handler registration
  static ipcHandlersRegistered = false;

  createChatInputWindow() {
    if (this.chatInputWindow) {
      return this.chatInputWindow;
    }

    // Register IPC handlers once (before creating window)
    ChatInputWindow.registerIpcHandlers();

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Chat input window dimensions
    const windowWidth = 500;
    const windowHeight = 80;
    
    // Position at bottom center of screen
    const x = (screenWidth - windowWidth) / 2;
    const y = screenHeight - windowHeight - 50; // 50px from bottom

    this.chatInputWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      focusable: true,
      show: false, // Don't show immediately
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'chat-input-preload.js')
      }
    });

    // Load the chat input HTML
    this.chatInputWindow.loadFile(path.join(__dirname, 'chat-input.html'));

    // Setup window behavior
    this.setupChatInputBehavior();

    return this.chatInputWindow;
  }

  setupChatInputBehavior() {
    if (!this.chatInputWindow) return;

    // Handle window ready
    this.chatInputWindow.once('ready-to-show', () => {
      this.chatInputWindow.show();
      this.chatInputWindow.focus();
    });

    // Handle window close
    this.chatInputWindow.on('closed', () => {
      this.chatInputWindow = null;
    });

    // Keep window always on top
    this.chatInputWindow.setAlwaysOnTop(true, 'floating');
    
    // Handle focus events
    this.chatInputWindow.on('blur', () => {
      // Optional: hide window when it loses focus
      // this.chatInputWindow.hide();
    });

    this.chatInputWindow.on('focus', () => {
      // Ensure input is focused when window gains focus
      this.chatInputWindow.webContents.send('focus-input');
    });
  }

  // Static method to register IPC handlers (called once)
  static registerIpcHandlers() {
    if (ChatInputWindow.ipcHandlersRegistered) return;

    // Handle message sending from chat input to main window
    ipcMain.on('send-chat-message', (event, message) => {
      console.log('IPC: Received message from chat input:', message);
      
      // Find the main window from all windows
      const allWindows = BrowserWindow.getAllWindows();
      console.log('IPC: Found', allWindows.length, 'windows');
      
      // Look for main window (the one that's not chat-input.html)
      const mainWindow = allWindows.find(win => {
        if (win.isDestroyed()) return false;
        
        try {
          const url = win.webContents.getURL();
          console.log('IPC: Checking window URL:', url);
          
          // Check for development server or production files
          const isMainWindow = url.includes('localhost:5173') || 
                              url.includes('localhost:3000') ||
                              (url.includes('index.html') && !url.includes('chat-input.html')) ||
                              url.includes('app-frontend') ||
                              url.includes('frontend/dist');
          
          return isMainWindow;
        } catch (error) {
          console.log('IPC: Error checking window URL:', error);
          return false;
        }
      });
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('IPC: Sending message to main window');
        try {
          mainWindow.webContents.send('receive-chat-message', message);
          console.log('IPC: Message sent successfully');
        } catch (error) {
          console.error('IPC: Error sending message to main window:', error);
        }
      } else {
        console.log('IPC: Main window not found or destroyed');
        console.log('IPC: Available windows:', allWindows.map(win => {
          try {
            return win.webContents.getURL();
          } catch {
            return 'destroyed';
          }
        }));
      }
      
      // Find chat input window and clear input
      const chatInputWindow = allWindows.find(win => {
        if (win.isDestroyed()) return false;
        try {
          const url = win.webContents.getURL();
          return url.includes('chat-input.html');
        } catch {
          return false;
        }
      });
      
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        console.log('IPC: Clearing chat input');
        try {
          chatInputWindow.webContents.send('clear-input');
        } catch (error) {
          console.error('IPC: Error clearing chat input:', error);
        }
      }
    });

    // Handle chat input window controls
    ipcMain.handle('chat-input-close', () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find(win => 
        win.webContents.getURL().includes('chat-input.html')
      );
      
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.destroy();
      }
    });

    ipcMain.handle('chat-input-hide', () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find(win => 
        win.webContents.getURL().includes('chat-input.html')
      );
      
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.hide();
      }
    });

    ChatInputWindow.ipcHandlersRegistered = true;
    console.log('IPC: Chat input handlers registered');
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  show() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.show();
      this.chatInputWindow.focus();
    }
  }

  hide() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.hide();
    }
  }

  toggle() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      if (this.chatInputWindow.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  destroy() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.destroy();
    }
    this.chatInputWindow = null;
  }

  getChatInputWindow() {
    return this.chatInputWindow;
  }
}

module.exports = { ChatInputWindow };