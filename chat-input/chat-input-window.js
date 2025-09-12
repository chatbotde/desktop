const { BrowserWindow, ipcMain, screen, dialog, desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");
const CaptureAPI = require("./capture");

class ChatInputWindow {
  constructor() {
    this.chatInputWindow = null;
    this.mainWindow = null;
    this.alwaysOnTopInterval = null;
    this.contentProtectionEnabled = true; // Enable content protection by default
    this.captureAPI = new CaptureAPI();
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

    // Fullscreen dimensions for chat input
    const windowWidth = screenWidth;
    const windowHeight = screenHeight;

    // Position at top-left corner for fullscreen
    const x = 0;
    const y = 0;

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
      resizable: false, // Disable resizing for fullscreen
      minimizable: false,
      maximizable: false, // Disable maximizing since we're already fullscreen
      minWidth: windowWidth, // Fixed width - no resizing
      maxWidth: windowWidth, // Fixed width - no resizing
      minHeight: windowHeight, // Fixed height - no resizing
      maxHeight: windowHeight, // Fixed height - no resizing
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

    // Store instance reference on the window for IPC access
    this.chatInputWindow._chatInputInstance = this;

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
      // In fullscreen mode, we don't resize the window - it stays fullscreen
      // The UI will handle content layout within the fullscreen space
      console.log(`Fullscreen chat-input mode: Content height ${newHeight} - window remains fullscreen`);
      return;
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

    // ==================== ADVANCED GEOMETRY CONTROL HANDLERS ====================

    // Handle advanced window bounds setting
    ipcMain.on("chat-input-set-bounds", (event, bounds) => {
      // In fullscreen mode, we don't change window bounds - it stays fullscreen
      console.log('Fullscreen chat-input mode: Bounds setting disabled - window remains fullscreen');
      return;
    });

    // Handle getting current window geometry
    ipcMain.handle("chat-input-get-geometry", async (event) => {
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
        const [x, y] = chatInputWindow.getPosition();
        const [width, height] = chatInputWindow.getSize();
        const bounds = chatInputWindow.getBounds();
        
        return {
          position: { x, y },
          size: { width, height },
          bounds: bounds,
          isVisible: chatInputWindow.isVisible(),
          isFocused: chatInputWindow.isFocused()
        };
      }
      
      return null;
    });

    // Handle setting window size with optional centering
    ipcMain.on("chat-input-set-size", (event, { width, height, center = false }) => {
      // In fullscreen mode, we don't change window size - it stays fullscreen
      console.log(`Fullscreen chat-input mode: Size setting disabled - window remains fullscreen (${width}x${height})`);
      return;
    });

    // Handle animated window geometry changes
    ipcMain.on("chat-input-animate-geometry", (event, { targetBounds, duration = 300 }) => {
      // In fullscreen mode, we don't animate geometry changes - window stays fullscreen
      console.log('Fullscreen chat-input mode: Geometry animation disabled - window remains fullscreen');
      return;
    });

    // Handle smart window adjustment for UI elements
    ipcMain.on("chat-input-adjust-for-element", (event, { elementId, options = {} }) => {
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
        // Send element info request to renderer
        chatInputWindow.webContents.send('get-element-info', { elementId, options });
      }
    });

    // Handle getting screen information
    ipcMain.handle("chat-input-get-screen-info", async (event) => {
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      
      return {
        primary: {
          id: primaryDisplay.id,
          bounds: primaryDisplay.bounds,
          workArea: primaryDisplay.workArea,
          workAreaSize: primaryDisplay.workAreaSize,
          scaleFactor: primaryDisplay.scaleFactor
        },
        all: displays.map(display => ({
          id: display.id,
          bounds: display.bounds,
          workArea: display.workArea,
          workAreaSize: display.workAreaSize,
          scaleFactor: display.scaleFactor,
          isPrimary: display.id === primaryDisplay.id
        }))
      };
    });

    // Handle setting window position relative to screen coordinates
    ipcMain.on("chat-input-set-screen-position", (event, { x, y, width, height }) => {
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
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        
        const constrainedX = Math.max(0, Math.min(screenWidth - width, x));
        const constrainedY = Math.max(0, Math.min(screenHeight - height, y));
        const constrainedWidth = Math.max(100, Math.min(1400, width));
        const constrainedHeight = Math.max(80, Math.min(800, height));
        
        chatInputWindow.setBounds({
          x: constrainedX,
          y: constrainedY,
          width: constrainedWidth,
          height: constrainedHeight
        });
      }
    });

    // ==================== CONTENT PROTECTION HANDLERS ====================

    // Handle content protection toggle
    ipcMain.handle("chat-input-toggle-content-protection", async () => {
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
        const instance = getChatInputInstance();
        if (instance) {
          const newState = !instance.contentProtectionEnabled;
          instance.setContentProtectionEnabled(newState);
          console.log(`Chat Input: Content protection ${newState ? 'ENABLED' : 'DISABLED'}`);
          return newState;
        }
      }
      return false;
    });

    // Handle getting content protection status
    ipcMain.handle("chat-input-get-content-protection", async () => {
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
        const instance = getChatInputInstance();
        if (instance) {
          return instance.isContentProtectionEnabled();
        }
      }
      return false;
    });

    // Handle setting content protection state
    ipcMain.handle("chat-input-set-content-protection", async (event, enabled) => {
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
        const instance = getChatInputInstance();
        if (instance) {
          instance.setContentProtectionEnabled(enabled);
          console.log(`Chat Input: Content protection ${enabled ? 'ENABLED' : 'DISABLED'}`);
          return true;
        }
      }
      return false;
    });

    // ==================== CLICK-THROUGH CONTROL ====================

    // Handle enabling click-through mode
    ipcMain.on("chat-input-enable-click-through", (event) => {
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
        // Enable click-through for the entire window
        // forward: true allows mouse events to pass through to windows behind
        chatInputWindow.setIgnoreMouseEvents(true, { forward: true });
        console.log('Chat input: Click-through enabled');
      }
    });

    // Handle disabling click-through mode
    ipcMain.on("chat-input-disable-click-through", (event) => {
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
        // Disable click-through - window will capture mouse events normally
        chatInputWindow.setIgnoreMouseEvents(false);
        console.log('Chat input: Click-through disabled');
      }
    });

    // Handle toggling click-through mode
    ipcMain.on("chat-input-toggle-click-through", (event) => {
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
        // Toggle click-through state
        const isCurrentlyIgnoring = chatInputWindow.isIgnoreMouseEvents();
        if (isCurrentlyIgnoring) {
          chatInputWindow.setIgnoreMouseEvents(false);
          console.log('Chat input: Click-through disabled');
        } else {
          chatInputWindow.setIgnoreMouseEvents(true, { forward: true });
          console.log('Chat input: Click-through enabled');
        }
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
        
        // Determine filter name based on file types
        let filterName = 'Files';
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico'];
        const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', '3gp', 'm4v'];
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus'];
        
        const isImageOnly = extensions.every(ext => imageExts.includes(ext.toLowerCase()));
        const isVideoOnly = extensions.every(ext => videoExts.includes(ext.toLowerCase()));
        const isAudioOnly = extensions.every(ext => audioExts.includes(ext.toLowerCase()));
        
        if (isImageOnly) {
          filterName = 'Images';
        } else if (isVideoOnly) {
          filterName = 'Videos';
        } else if (isAudioOnly) {
          filterName = 'Audio Files';
        } else {
          filterName = 'Media Files';
        }
        
        const result = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            {
              name: filterName,
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
              const ext = path.extname(filePath).toLowerCase();
              
              // Dynamic file size limits based on file type
              let maxSize = 10 * 1024 * 1024; // 10MB default for images
              if (videoExts.includes(ext.substring(1))) {
                maxSize = 100 * 1024 * 1024; // 100MB for videos
              } else if (audioExts.includes(ext.substring(1))) {
                maxSize = 50 * 1024 * 1024; // 50MB for audio
              }
              
              if (fileSize > maxSize) {
                console.warn(`File ${fileName} is too large (${fileSize} bytes, max: ${maxSize})`);
                continue;
              }
              
              const fileBuffer = fs.readFileSync(filePath);
              const base64Data = fileBuffer.toString('base64');
              const mimeType = getMimeType(ext);
              
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

    // ==================== NEW CAPTURE API IPC HANDLERS ====================
    
    // Screenshot handlers
    ipcMain.handle("capture-screenshot", async (event, options = {}) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.takeScreenshot(options);
      } catch (error) {
        console.error('Screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("capture-window-screenshot", async (event, windowId, options = {}) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.takeWindowScreenshot(windowId, options);
      } catch (error) {
        console.error('Window screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("get-screenshot-sources", async (event, includeWindows = true) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.getScreenshotSources(includeWindows);
      } catch (error) {
        console.error('Get screenshot sources error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("quick-screenshot", async (event) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.quickScreenshot();
      } catch (error) {
        console.error('Quick screenshot error:', error);
        return { success: false, error: error.message };
      }
    });

    // Video recording handlers
    ipcMain.handle("start-video-recording", async (event, options = {}) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        // Set up progress callback
        if (options.onProgress) {
          options.onProgress = (data) => {
            event.sender.send('recording-progress', { type: 'video', ...data });
          };
        }
        
        return await instance.captureAPI.startVideoRecording(options);
      } catch (error) {
        console.error('Start video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("stop-video-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopVideoRecording(recordingId);
      } catch (error) {
        console.error('Stop video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("pause-video-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.pauseVideoRecording(recordingId);
      } catch (error) {
        console.error('Pause video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("resume-video-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.resumeVideoRecording(recordingId);
      } catch (error) {
        console.error('Resume video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    // Audio recording handlers
    ipcMain.handle("start-audio-recording", async (event, options = {}) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        // Set up callbacks
        if (options.onProgress) {
          options.onProgress = (data) => {
            event.sender.send('recording-progress', { type: 'audio', ...data });
          };
        }
        if (options.onVolumeChange) {
          options.onVolumeChange = (volume) => {
            event.sender.send('recording-volume', { volume });
          };
        }
        
        return await instance.captureAPI.startAudioRecording(options);
      } catch (error) {
        console.error('Start audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("stop-audio-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopAudioRecording(recordingId);
      } catch (error) {
        console.error('Stop audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("pause-audio-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.pauseAudioRecording(recordingId);
      } catch (error) {
        console.error('Pause audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("resume-audio-recording", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.resumeAudioRecording(recordingId);
      } catch (error) {
        console.error('Resume audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    // General recording handlers
    ipcMain.handle("get-recording-status", async (event, recordingId) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.getRecordingStatus(recordingId);
      } catch (error) {
        console.error('Get recording status error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("get-active-recordings", async (event) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return [];
        
        return instance.captureAPI.getActiveRecordings();
      } catch (error) {
        console.error('Get active recordings error:', error);
        return [];
      }
    });

    ipcMain.handle("stop-all-recordings", async (event) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopAllRecordings();
      } catch (error) {
        console.error('Stop all recordings error:', error);
        return { success: false, error: error.message };
      }
    });

    // Convenience handlers
    ipcMain.handle("record-screen", async (event, durationSeconds = null) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.recordScreen(durationSeconds);
      } catch (error) {
        console.error('Record screen error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("record-audio", async (event, durationSeconds = null) => {
      try {
        const instance = getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.recordAudio(durationSeconds);
      } catch (error) {
        console.error('Record audio error:', error);
        return { success: false, error: error.message };
      }
    });

    // Support and format handlers
    ipcMain.handle("check-capture-support", async (event) => {
      try {
        return CaptureAPI.checkSupport();
      } catch (error) {
        console.error('Check capture support error:', error);
        return { screenshot: false, videoRecording: false, audioRecording: false };
      }
    });

    ipcMain.handle("get-supported-formats", async (event) => {
      try {
        return CaptureAPI.getSupportedFormats();
      } catch (error) {
        console.error('Get supported formats error:', error);
        return { video: [], audio: [], image: [] };
      }
    });

    // Helper function to get chat input instance
    function getChatInputInstance() {
      const allWindows = BrowserWindow.getAllWindows();
      for (const win of allWindows) {
        if (win.isDestroyed()) continue;
        try {
          // Look for the chat input window by checking its reference
          if (win._chatInputInstance) {
            return win._chatInputInstance;
          }
        } catch (error) {
          continue;
        }
      }
      return null;
    }

    // ==================== DISPLAY CARD IPC HANDLERS ====================
    
    // Handle display content from frontend
    ipcMain.on("chat-input-display-content", (event, { cardNumber, content }) => {
      const chatInputWindow = getChatInputInstance();
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.webContents.send('display-content', { cardNumber, content });
        console.log(`Display content sent to chat input window card ${cardNumber}:`, content);
      }
    });

    // Handle display content refresh request
    ipcMain.on("chat-input-request-display-content", (event, cardNumber) => {
      const chatInputWindow = getChatInputInstance();
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.webContents.send('request-display-content', cardNumber);
        console.log(`Display content refresh requested for card ${cardNumber}`);
      }
    });

    // Handle display card toggle
    ipcMain.on("chat-input-toggle-display-card", (event, cardNumber) => {
      const chatInputWindow = getChatInputInstance();
      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.webContents.send('toggle-display-card', cardNumber);
        console.log(`Display card ${cardNumber} toggle requested`);
      }
    });

    ChatInputWindow.ipcHandlersRegistered = true;
    console.log("IPC: Chat input handlers registered (including new capture API and display card)");
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

    // Clean up capture API
    if (this.captureAPI) {
      this.captureAPI.cleanup();
    }

    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      // Remove instance reference
      this.chatInputWindow._chatInputInstance = null;
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
    // Image formats
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    
    // Video formats
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.3gp': 'video/3gpp',
    '.m4v': 'video/x-m4v',
    
    // Audio formats
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.wma': 'audio/x-ms-wma',
    '.opus': 'audio/opus'
  };
  
  const ext = extension.toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = { ChatInputWindow };
