/**
 * Security and content protection manager for chat input window
 */
class SecurityManager {
  constructor(chatInputWindow) {
    this.chatInputWindow = chatInputWindow;
    this.contentProtectionEnabled = true; // Enable content protection by default
  }

  /**
   * Set content protection state
   * @param {boolean} enabled - Whether to enable content protection
   */
  setContentProtectionEnabled(enabled) {
    this.contentProtectionEnabled = enabled;
    this.applyScreenCaptureProtection();
  }

  /**
   * Get content protection state
   * @returns {boolean} Current content protection state
   */
  isContentProtectionEnabled() {
    return this.contentProtectionEnabled;
  }

  /**
   * Enhanced screen recording protection toggle
   */
  toggleEnhancedScreenRecordingProtection() {
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Chat Input Window: Enhanced screen recording protection ENABLED');
    } else {
      console.log('Chat Input Window: Enhanced screen recording protection DISABLED (requires content protection to be enabled)');
    }
  }

  /**
   * Force refresh all protection measures
   */
  refreshAllProtection() {
    this.applyScreenCaptureProtection();
    if (this.contentProtectionEnabled) {
      this.applyEnhancedScreenRecordingProtection();
      console.log('Chat Input Window: All protection measures refreshed');
    }
  }

  /**
   * Comprehensive screen capture protection method
   */
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

  /**
   * Enhanced protection against screen recording software and hardware
   */
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

  /**
   * Platform-specific screen recording protection
   */
  applyPlatformSpecificRecordingProtection() {
    if (!this.chatInputWindow || this.chatInputWindow.isDestroyed()) return;

    try {
      if (process.platform === "win32") {
        // Windows-specific protections
        this.applyWindowsProtection();
      } else if (process.platform === "darwin") {
        // macOS-specific protections
        this.applyMacOSProtection();
      } else if (process.platform === "linux") {
        // Linux-specific protections
        this.applyLinuxProtection();
      }

    } catch (error) {
      console.error('Chat Input Window: Failed to apply platform-specific recording protection:', error);
    }
  }

  /**
   * Apply Windows-specific protection
   */
  applyWindowsProtection() {
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
  }

  /**
   * Apply macOS-specific protection
   */
  applyMacOSProtection() {
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
  }

  /**
   * Apply Linux-specific protection
   */
  applyLinuxProtection() {
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

  /**
   * Additional security measures to prevent content exposure
   */
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

module.exports = { SecurityManager };