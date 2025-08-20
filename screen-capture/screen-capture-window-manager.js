const { BrowserWindow, screen, desktopCapturer } = require('electron');
const path = require('path');

class ScreenCaptureWindowManager {
  constructor() {
    this.captureWindow = null;
    this.contentProtectionEnabled = true; // Always enabled for maximum security
    this.isRecording = false;
    this.recordingType = null; // 'screen', 'audio', 'video'
    this.audioUtils = null; // Will be set when audio utilities are needed
  }

  createScreenCaptureWindow() {
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.focus();
      return this.captureWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Create a reasonably sized window for screen capture controls
    const windowWidth = 800;
    const windowHeight = 600;
    
    // Center the window
    const x = Math.floor((screenWidth - windowWidth) / 2);
    const y = Math.floor((screenHeight - windowHeight) / 2);

    // Get the appropriate icon path based on platform
    const getIconPath = () => {
      if (process.platform === 'win32') {
        return path.join(__dirname, "..", "icons", "icon.ico");
      } else if (process.platform === 'darwin') {
        return path.join(__dirname, "..", "icons", "icon.icns");
      } else {
        return path.join(__dirname, "..", "icons", "icon.png");
      }
    };

    this.captureWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      icon: getIconPath(),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      minimizable: true,
      maximizable: false,
      closable: true,
      focusable: true,
      fullscreenable: false,
      kiosk: false,
      autoHideMenuBar: true,
      modal: false,
      acceptFirstMouse: true,
      disableAutoHideCursor: false,
      roundedCorners: true,
      hasShadow: false,
      hiddenInMissionControl: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        enableRemoteModule: false,
        spellcheck: false,
        preload: path.join(__dirname, 'screen-capture-preload.js')
      },
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
      ...(process.platform === "win32" && {
        type: "toolbar",
        thickFrame: false,
      }),
      ...(process.platform === "linux" && {
        frame: false,
        type: "dock",
      }),
    });

    // Apply maximum content protection immediately
    this.applyMaximumContentProtection();

    // Setup window behavior
    this.setupScreenCaptureWindowBehavior();

    // Load the screen capture HTML
    this.captureWindow.loadFile(path.join(__dirname, 'screen-capture.html'));

    return this.captureWindow;
  }

  applyMaximumContentProtection() {
    if (!this.captureWindow || this.captureWindow.isDestroyed()) {
      return;
    }

    try {
      // Primary protection: Prevent screen capture of window contents
      this.captureWindow.setContentProtection(true);
      
      // Enhanced protection: Make window visible on all workspaces/desktops
      // This helps prevent desktop capture by making the window omnipresent
      this.captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      // Set highest possible window level to prevent other apps from capturing
      this.captureWindow.setAlwaysOnTop(true, "screen-saver", 10);
      
      // Disable developer tools completely
      this.captureWindow.webContents.closeDevTools();
      this.captureWindow.webContents.on('devtools-opened', () => {
        this.captureWindow.webContents.closeDevTools();
      });

      // Prevent right-click context menu
      this.captureWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
      });

      // Prevent all developer shortcuts and inspection tools
      this.captureWindow.webContents.on('before-input-event', (event, input) => {
        const blockedKeys = [
          'F12', // Dev tools
          ...(input.control && input.shift ? ['I', 'J', 'C'] : []), // Dev tools shortcuts
          ...(input.control ? ['U', 'S'] : []), // View source, save
          ...(input.alt ? ['F4'] : []), // Alt+F4 (Windows close)
        ];
        
        if (blockedKeys.includes(input.key)) {
          event.preventDefault();
        }
      });

      // Block new window creation attempts
      this.captureWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });

      // Prevent navigation to external URLs
      this.captureWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const allowedProtocols = ['file:', 'data:'];
        const url = new URL(navigationUrl);
        if (!allowedProtocols.includes(url.protocol)) {
          event.preventDefault();
        }
      });

      // Monitor content protection status
      console.log('Screen Capture Window: MAXIMUM screen capture protection enabled with enhanced omnipresence - window is NOT capturable');
      
    } catch (error) {
      console.error('Screen Capture Window: Failed to apply maximum content protection:', error);
    }
  }

  setupScreenCaptureWindowBehavior() {
    if (!this.captureWindow || this.captureWindow.isDestroyed()) {
      return;
    }

    // Force window to stay above everything
    this.captureWindow.on('focus', () => {
      this.captureWindow.setAlwaysOnTop(true, "screen-saver", 10);
    });

    this.captureWindow.on('blur', () => {
      // Keep on top even when not focused
      setTimeout(() => {
        if (this.captureWindow && !this.captureWindow.isDestroyed()) {
          this.captureWindow.setAlwaysOnTop(true, "screen-saver", 10);
        }
      }, 100);
    });

    // Handle window close
    this.captureWindow.on('close', (event) => {
      if (this.isRecording) {
        // Stop any ongoing recording before closing
        this.stopRecording();
      }
    });

    this.captureWindow.on('closed', () => {
      this.captureWindow = null;
    });

    // Periodic maintenance to ensure protection
    setInterval(() => {
      if (this.captureWindow && !this.captureWindow.isDestroyed()) {
        this.captureWindow.setContentProtection(true);
        this.captureWindow.setAlwaysOnTop(true, "screen-saver", 10);
      }
    }, 5000);
  }

  // Screen capture methods
  async getAvailableScreenSources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 320, height: 240 }
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('Failed to get screen sources:', error);
      return [];
    }
  }

  // Recording control methods
  startRecording(type, sourceId = null) {
    if (this.isRecording) {
      console.log('Recording already in progress');
      return false;
    }

    this.isRecording = true;
    this.recordingType = type;
    
    console.log(`Started ${type} recording${sourceId ? ` from source: ${sourceId}` : ''}`);
    
    // Emit recording started event to renderer
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.webContents.send('recording-started', { type, sourceId });
    }
    
    return true;
  }

  stopRecording() {
    if (!this.isRecording) {
      console.log('No recording in progress');
      return false;
    }

    const wasRecording = this.recordingType;
    this.isRecording = false;
    this.recordingType = null;
    
    console.log(`Stopped ${wasRecording} recording`);
    
    // Emit recording stopped event to renderer
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.webContents.send('recording-stopped', { type: wasRecording });
    }
    
    return true;
  }

  // Audio utility integration
  setAudioUtils(audioUtils) {
    this.audioUtils = audioUtils;
  }

  // Window control methods
  showWindow() {
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.show();
      this.captureWindow.focus();
      this.applyMaximumContentProtection();
    }
  }

  hideWindow() {
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.hide();
    }
  }

  closeWindow() {
    if (this.captureWindow && !this.captureWindow.isDestroyed()) {
      this.captureWindow.close();
    }
  }

  isWindowOpen() {
    return this.captureWindow && !this.captureWindow.isDestroyed();
  }

  getCurrentWindow() {
    return this.captureWindow;
  }
}

module.exports = { ScreenCaptureWindowManager };

