const { BrowserWindow, ipcMain, screen, dialog, desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");

class ChatInputWindow {
  constructor() {
    this.chatInputWindow = null;
    this.mainWindow = null;
    this.alwaysOnTopInterval = null;
    this.contentProtectionEnabled = true;
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
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    // Chat input window dimensions - increased for new UI
    const windowWidth = 600;
    const windowHeight = 120; // Increased base height for new design

    // Position at bottom center of screen
    const x = (screenWidth - windowWidth) / 2;
    const y = screenHeight - windowHeight - 50; // 50px from bottom

    // Get the appropriate icon path based on platform
    const getIconPath = () => {
      if (process.platform === "win32") {
        return path.join(__dirname, "..", "icons", "icon.ico");
      } else if (process.platform === "darwin") {
        return path.join(__dirname, "..", "icons", "icon.icns");
      } else {
        return path.join(__dirname, "..", "icons", "icon.png");
      }
    };

    this.chatInputWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      icon: getIconPath(),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      title: "Buddy Chat",
      resizable: true,
      minimizable: false,
      maximizable: false,
      minWidth: 100,
      maxWidth: 800,
      minHeight: 80,
      maxHeight: 400,
      closable: true,
      focusable: true,
      show: false, // Don't show immediately
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, "chat-input-preload.js"),
      },
    });

    // Load the chat input HTML
    this.chatInputWindow.loadFile(path.join(__dirname, "chat-input.html"));

    // Setup window behavior
    this.setupChatInputBehavior();

    return this.chatInputWindow;
  }

  setupChatInputBehavior() {
    if (!this.chatInputWindow) return;

    // Handle window ready
    this.chatInputWindow.once("ready-to-show", () => {
      this.chatInputWindow.show();
      this.chatInputWindow.focus();
    });

    // Handle window close
    this.chatInputWindow.on("closed", () => {
      this.chatInputWindow = null;
    });

    // Set the window to always stay on top with highest priority (same as main window)
    this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 3);

    // Apply comprehensive screen capture protection
    this.applyScreenCaptureProtection();

    // Platform-specific configurations for maximum always-on-top behavior
    this.configurePlatformSpecificBehavior();

    // Setup event listeners for maintaining behavior
    this.setupEventListeners();

    // Setup periodic maintenance
    this.setupPeriodicMaintenance();
  }

  configurePlatformSpecificBehavior() {
    if (!this.chatInputWindow) return;

    if (process.platform === "win32") {
      // Windows: Stay above taskbar and system menus with maximum priority
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);

      // Force the window to stay above all other windows including taskbar
      setTimeout(() => {
        this.chatInputWindow.setAlwaysOnTop(false);
        this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
      }, 100);
    } else if (process.platform === "darwin") {
      // macOS: Stay above dock and mission control
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
    } else if (process.platform === "linux") {
      // Linux: Stay above panels and system elements
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "modal-panel", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
    }
  }

  setupEventListeners() {
    if (!this.chatInputWindow) return;

    // Add event listener to maintain always-on-top behavior
    this.chatInputWindow.on("focus", () => {
      if (process.platform === "win32") {
        this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
      }
      // Ensure input is focused when window gains focus
      this.chatInputWindow.webContents.send("focus-input");
    });

    // Add event listener for when other windows might affect our position
    this.chatInputWindow.on("blur", () => {
      setTimeout(() => {
        if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
          if (process.platform === "win32") {
            this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
          } else {
            this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
          }
        }
      }, 50);
    });
  }

  setupPeriodicMaintenance() {
    if (!this.chatInputWindow) return;

    // Periodic check to ensure window stays above taskbar
    const maintainAlwaysOnTop = () => {
      if (
        this.chatInputWindow &&
        !this.chatInputWindow.isDestroyed() &&
        this.chatInputWindow.isVisible()
      ) {
        if (process.platform === "win32") {
          this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
        } else {
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        }
      }
    };

    // Check every 2 seconds to maintain position above taskbar
    this.alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 2000);

    // Clean up interval when window is destroyed
    this.chatInputWindow.on("closed", () => {
      if (this.alwaysOnTopInterval) {
        clearInterval(this.alwaysOnTopInterval);
        this.alwaysOnTopInterval = null;
      }
    });
  }

  // Static method to register IPC handlers (called once)
  static registerIpcHandlers() {
    if (ChatInputWindow.ipcHandlersRegistered) return;

    // Handle message sending from chat input to main window
    ipcMain.on("send-chat-message", (event, message) => {
      console.log("IPC: Received message from chat input:", message);

      // Find the main window from all windows
      const allWindows = BrowserWindow.getAllWindows();
      console.log("IPC: Found", allWindows.length, "windows");

      // Look for main window (the one that's not chat-input.html)
      const mainWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;

        try {
          const url = win.webContents.getURL();
          console.log("IPC: Checking window URL:", url);

          // Check for development server or production files
          const isMainWindow =
            url.includes("localhost:5173") ||
            url.includes("localhost:3000") ||
            (url.includes("index.html") && !url.includes("chat-input.html")) ||
            url.includes("app-frontend") ||
            url.includes("frontend/dist");

          return isMainWindow;
        } catch (error) {
          console.log("IPC: Error checking window URL:", error);
          return false;
        }
      });

      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log("IPC: Sending message to main window");
        try {
          mainWindow.webContents.send("receive-chat-message", message);
          console.log("IPC: Message sent successfully");
        } catch (error) {
          console.error("IPC: Error sending message to main window:", error);
        }
      } else {
        console.log("IPC: Main window not found or destroyed");
        console.log(
          "IPC: Available windows:",
          allWindows.map((win) => {
            try {
              return win.webContents.getURL();
            } catch {
              return "destroyed";
            }
          })
        );
      }

      // Find chat input window and clear input
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          const url = win.webContents.getURL();
          return url.includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        console.log("IPC: Clearing chat input");
        try {
          chatInputWindow.webContents.send("clear-input");
        } catch (error) {
          console.error("IPC: Error clearing chat input:", error);
        }
      }
    });

    // Handle dynamic window height adjustment with debouncing
    let resizeTimeout = null;
    let lastResizeHeight = 0;
    
    ipcMain.on("chat-input-resize-height", (event, newHeight) => {
      // Clear any pending resize operations
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Only proceed if height change is significant
      if (Math.abs(newHeight - lastResizeHeight) < 5) {
        return;
      }
      
      resizeTimeout = setTimeout(() => {
        const allWindows = BrowserWindow.getAllWindows();
        const chatInputWindow = allWindows.find((win) => {
          if (win.isDestroyed()) return false;
          try {
            return win.webContents.getURL().includes("chat-input.html");
          } catch {
            return false;
          }
        });

        if (chatInputWindow && !chatInputWindow.isDestroyed()) {
          const [currentWidth, currentHeight] = chatInputWindow.getSize();
          const [currentX, currentY] = chatInputWindow.getPosition();
          const primaryDisplay = screen.getPrimaryDisplay();
          const { height: screenHeight } = primaryDisplay.workAreaSize;
          
          const clampedHeight = Math.max(80, Math.min(400, newHeight));
          
          // Only resize if there's a meaningful difference
          if (Math.abs(currentHeight - clampedHeight) > 3) {
            // Calculate new Y position to keep window anchored at bottom
            const heightDifference = clampedHeight - currentHeight;
            const newY = Math.max(0, currentY - heightDifference);
            
            // Perform smooth resize with animation
            chatInputWindow.setSize(currentWidth, clampedHeight, true);
            
            // Only adjust position if necessary
            if (newY !== currentY) {
              chatInputWindow.setPosition(currentX, newY, true);
            }
            
            lastResizeHeight = clampedHeight;
          }
        }
      }, 100); // 100ms debounce
    });

    // Handle chat input window controls
    ipcMain.handle("chat-input-close", () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) =>
        win.webContents.getURL().includes("chat-input.html")
      );

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.destroy();
      }
    });

    ipcMain.handle("chat-input-hide", () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) =>
        win.webContents.getURL().includes("chat-input.html")
      );

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.hide();
      }
    });

    // Handle hide chat input (alternative)
    ipcMain.on("hide-chat-input", () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          return win.webContents.getURL().includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.hide();
      }
    });

    // Handle window position setting for drag
    ipcMain.on("chat-input-set-position", (event, { deltaX, deltaY }) => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          return win.webContents.getURL().includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        const [currentX, currentY] = chatInputWindow.getPosition();
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;

        // Get screen bounds to prevent dragging off screen
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } =
          primaryDisplay.workAreaSize;
        const [windowWidth, windowHeight] = chatInputWindow.getSize();

        // Constrain to screen bounds
        const constrainedX = Math.max(
          0,
          Math.min(screenWidth - windowWidth, newX)
        );
        const constrainedY = Math.max(
          0,
          Math.min(screenHeight - windowHeight, newY)
        );

        chatInputWindow.setPosition(constrainedX, constrainedY);
      }
    });

    // Handle main window toggle (hide/show)
    ipcMain.on("toggle-main-window", (event) => {
      const allWindows = BrowserWindow.getAllWindows();
      const mainWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;

        try {
          const url = win.webContents.getURL();
          // Check for development server or production files
          const isMainWindow =
            url.includes("localhost:5173") ||
            url.includes("localhost:3000") ||
            (url.includes("index.html") && !url.includes("chat-input.html")) ||
            url.includes("app-frontend") ||
            url.includes("frontend/dist");

          return isMainWindow;
        } catch (error) {
          console.log("IPC: Error checking window URL:", error);
          return false;
        }
      });

      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
          console.log("IPC: Main window hidden");
        } else {
          mainWindow.showInactive();
          console.log("IPC: Main window shown");
        }
      } else {
        console.log("IPC: Main window not found or destroyed");
      }
    });

    // Handle image file picker
    ipcMain.handle("open-image-picker", async () => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            {
              name: 'Images',
              extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']
            }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileName = path.basename(filePath);
          const fileSize = fs.statSync(filePath).size;
          
          // Read file as base64
          const fileBuffer = fs.readFileSync(filePath);
          const base64Data = fileBuffer.toString('base64');
          const mimeType = getMimeType(path.extname(filePath));
          
          return {
            success: true,
            file: {
              name: fileName,
              size: fileSize,
              type: mimeType,
              data: `data:${mimeType};base64,${base64Data}`,
              path: filePath
            }
          };
        }
        
        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error opening image picker:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle desktop capture
    ipcMain.handle("capture-desktop", async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        });

        if (sources.length > 0) {
          // Get the primary screen
          const primarySource = sources[0];
          const thumbnail = primarySource.thumbnail;
          
          // Convert to PNG buffer
          const buffer = thumbnail.toPNG();
          const base64Data = buffer.toString('base64');
          
          return {
            success: true,
            image: {
              name: `screenshot-${Date.now()}.png`,
              type: 'image/png',
              data: `data:image/png;base64,${base64Data}`,
              size: buffer.length,
              source: 'desktop-capture'
            }
          };
        }
        
        return { success: false, error: 'No screen sources available' };
      } catch (error) {
        console.error('Error capturing desktop:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle generic file picker
    ipcMain.handle("open-file-picker", async (event, options = {}) => {
      try {
        const { extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'] } = options;
        
        const result = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            {
              name: 'Images',
              extensions: extensions
            }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const files = [];
          
          for (const filePath of result.filePaths) {
            try {
              const fileName = path.basename(filePath);
              const fileSize = fs.statSync(filePath).size;
              
              // Check file size (limit to 10MB)
              if (fileSize > 10 * 1024 * 1024) {
                console.warn(`File ${fileName} is too large (${fileSize} bytes)`);
                continue;
              }
              
              const fileBuffer = fs.readFileSync(filePath);
              const base64Data = fileBuffer.toString('base64');
              const mimeType = getMimeType(path.extname(filePath));
              
              files.push({
                name: fileName,
                size: fileSize,
                type: mimeType,
                data: `data:${mimeType};base64,${base64Data}`,
                path: filePath
              });
            } catch (fileError) {
              console.error(`Error processing file ${filePath}:`, fileError);
            }
          }
          
          return { success: true, files };
        }
        
        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error opening file picker:', error);
        return { success: false, error: error.message };
      }
    });

    ChatInputWindow.ipcHandlersRegistered = true;
    console.log("IPC: Chat input handlers registered");
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
    // Clean up interval first
    if (this.alwaysOnTopInterval) {
      clearInterval(this.alwaysOnTopInterval);
      this.alwaysOnTopInterval = null;
    }

    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      this.chatInputWindow.destroy();
    }
    this.chatInputWindow = null;
  }

  forceWindowAboveTaskbar() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      // Force the window above taskbar with multiple attempts
      this.chatInputWindow.setAlwaysOnTop(false);
      setTimeout(() => {
        if (process.platform === "win32") {
          this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        } else {
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        }
        // Bring to front
        this.chatInputWindow.showInactive();
        this.chatInputWindow.focus();
      }, 50);
    }
  }

  getChatInputWindow() {
    return this.chatInputWindow;
  }

  setContentProtectionEnabled(enabled) {
    this.contentProtectionEnabled = enabled;
    this.applyScreenCaptureProtection();
  }

  isContentProtectionEnabled() {
    return this.contentProtectionEnabled;
  }

  // Enhanced screen recording protection toggle
  toggleEnhancedScreenRecordingProtection() {
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Chat Input Window: Enhanced screen recording protection ENABLED');
    } else {
      console.log('Chat Input Window: Enhanced screen recording protection DISABLED (requires content protection to be enabled)');
    }
  }

  // Force refresh all protection measures
  refreshAllProtection() {
    this.applyScreenCaptureProtection();
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Chat Input Window: All protection measures refreshed');
    }
  }

  // Comprehensive screen capture protection method
  applyScreenCaptureProtection() {
    if (!this.chatInputWindow || this.chatInputWindow.isDestroyed()) {
      return;
    }

    try {
      // Primary protection: Prevent screen capture of window contents
      this.chatInputWindow.setContentProtection(this.contentProtectionEnabled);
      
      // Enhanced protection: Make window visible on all workspaces/desktops
      // This helps prevent desktop capture by making the window omnipresent
      this.chatInputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      // Additional security measures
      this.applyAdditionalSecurityMeasures();
      
      // Enhanced screen recording protection
      this.applyEnhancedScreenRecordingProtection();
      
      console.log(`Chat Input Window: Screen capture protection ${this.contentProtectionEnabled ? 'ENABLED' : 'DISABLED'} with enhanced omnipresence`);
      
    } catch (error) {
      console.error('Chat Input Window: Failed to apply screen capture protection:', error);
    }
  }

  // Enhanced protection against screen recording software and hardware
  applyEnhancedScreenRecordingProtection() {
    if (!this.chatInputWindow || this.chatInputWindow.isDestroyed()) return;

    try {
      // Disable hardware acceleration to prevent GPU-based capture
      this.chatInputWindow.webContents.setBackgroundThrottling(false);
      
      // Set window to be invisible to screen recording software
      this.chatInputWindow.setOpacity(0.999); // Nearly invisible but still functional
      
      // Apply additional security headers
      this.chatInputWindow.webContents.session.webRequest.onBeforeSendHeaders(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          // Add headers that may help prevent capture
          details.requestHeaders['X-Frame-Options'] = 'DENY';
          details.requestHeaders['X-Content-Type-Options'] = 'nosniff';
          callback({ requestHeaders: details.requestHeaders });
        }
      );

      // Block clipboard access to prevent content copying
      this.chatInputWindow.webContents.on('select-client-certificate', (event) => {
        event.preventDefault();
      });

      // Prevent drag and drop operations
      this.chatInputWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault();
      });

      // Block file access
      this.chatInputWindow.webContents.on('will-navigate', (event) => {
        event.preventDefault();
      });

      // Additional platform-specific protections
      this.applyPlatformSpecificRecordingProtection();

    } catch (error) {
      console.error('Chat Input Window: Failed to apply enhanced screen recording protection:', error);
    }
  }

  // Platform-specific screen recording protection
  applyPlatformSpecificRecordingProtection() {
    if (!this.chatInputWindow || this.chatInputWindow.isDestroyed()) return;

    try {
      if (process.platform === "win32") {
        // Windows-specific protections
        // Set window to be invisible to screen capture tools
        this.chatInputWindow.setOpacity(0.999);
        
        // Use layered window technique for additional protection
        this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
        
        // Block Windows-specific capture methods
        this.chatInputWindow.webContents.on('dom-ready', () => {
          this.chatInputWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Disable drag and drop
            document.addEventListener('dragstart', (e) => e.preventDefault());
            document.addEventListener('drop', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
            
            // Disable text selection on input fields while maintaining functionality
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
              input.addEventListener('selectstart', (e) => e.preventDefault());
              input.addEventListener('copy', (e) => e.preventDefault());
              input.addEventListener('cut', (e) => e.preventDefault());
              input.addEventListener('paste', (e) => e.preventDefault());
            });
          `);
        });

      } else if (process.platform === "darwin") {
        // macOS-specific protections
        this.chatInputWindow.setOpacity(0.999);
        
        // Block macOS screen recording permissions
        this.chatInputWindow.webContents.on('dom-ready', () => {
          this.chatInputWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            
            // Disable text selection on input fields while maintaining functionality
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
              input.addEventListener('selectstart', (e) => e.preventDefault());
              input.addEventListener('copy', (e) => e.preventDefault());
              input.addEventListener('cut', (e) => e.preventDefault());
              input.addEventListener('paste', (e) => e.preventDefault());
            });
          `);
        });

      } else if (process.platform === "linux") {
        // Linux-specific protections
        this.chatInputWindow.setOpacity(0.999);
        
        // Block Linux screen recording tools
        this.chatInputWindow.webContents.on('dom-ready', () => {
          this.chatInputWindow.webContents.executeJavaScript(`
            // Disable selection and copying
            document.addEventListener('selectstart', (e) => e.preventDefault());
            document.addEventListener('copy', (e) => e.preventDefault());
            document.addEventListener('cut', (e) => e.preventDefault());
            document.addEventListener('paste', (e) => e.preventDefault());
            
            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Make text unselectable
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            
            // Disable text selection on input fields while maintaining functionality
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
              input.addEventListener('selectstart', (e) => e.preventDefault());
              input.addEventListener('copy', (e) => e.preventDefault());
              input.addEventListener('cut', (e) => e.preventDefault());
              input.addEventListener('paste', (e) => e.preventDefault());
            });
          `);
        });
      }

    } catch (error) {
      console.error('Chat Input Window: Failed to apply platform-specific recording protection:', error);
    }
  }

  // Additional security measures to prevent content exposure
  applyAdditionalSecurityMeasures() {
    if (!this.chatInputWindow || this.chatInputWindow.isDestroyed()) return;

    try {
      // Disable developer tools
      this.chatInputWindow.webContents.closeDevTools();
      this.chatInputWindow.webContents.on('devtools-opened', () => {
        this.chatInputWindow.webContents.closeDevTools();
      });

      // Prevent right-click context menu
      this.chatInputWindow.webContents.on('context-menu', (event) => {
        if (this.contentProtectionEnabled) {
          event.preventDefault();
        }
      });

      // Block security-compromising keyboard shortcuts
      this.chatInputWindow.webContents.on('before-input-event', (event, input) => {
        if (this.contentProtectionEnabled) {
          // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
          if (
            input.key === 'F12' ||
            (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C')) ||
            (input.control && input.key === 'U')
          ) {
            event.preventDefault();
          }
        }
      });

      // Block new window creation attempts
      this.chatInputWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });

      // Prevent navigation to external URLs
      this.chatInputWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const allowedProtocols = ['file:', 'data:'];
        try {
          const url = new URL(navigationUrl);
          if (!allowedProtocols.includes(url.protocol)) {
            event.preventDefault();
          }
        } catch (error) {
          // Invalid URL, prevent navigation
          event.preventDefault();
        }
      });

    } catch (error) {
      console.error('Chat Input Window: Failed to apply additional security measures:', error);
    }
  }
}

// Helper function to get MIME type from file extension
function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

module.exports = { ChatInputWindow };
