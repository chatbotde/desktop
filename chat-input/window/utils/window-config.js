const { screen } = require("electron");
const path = require("path");

/**
 * Window configuration utilities for chat input window
 */
class WindowConfig {
  /**
   * Get the appropriate icon path based on platform
   * @returns {string} Icon file path
   */
  static getIconPath() {
    if (process.platform === "win32") {
      return path.join(__dirname, "..", "..", "..", "icons", "icon.ico");
    } else if (process.platform === "darwin") {
      return path.join(__dirname, "..", "..", "..", "icons", "icon.icns");
    } else {
      return path.join(__dirname, "..", "..", "..", "icons", "icon.png");
    }
  }

  /**
   * Get window dimensions and position for fullscreen
   * @returns {Object} Window configuration object
   */
  static getWindowDimensions() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    return {
      width: screenWidth,
      height: screenHeight,
      x: 0,
      y: 0
    };
  }

  /**
   * Get BrowserWindow options for chat input window
   * @returns {Object} BrowserWindow options
   */
  static getBrowserWindowOptions() {
    const dimensions = this.getWindowDimensions();
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      x: dimensions.x,
      y: dimensions.y,
      icon: this.getIconPath(),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      fullscreen: true,
      title: "",
      resizable: false,
      minimizable: false,
      maximizable: false,
      minWidth: dimensions.width,
      maxWidth: dimensions.width,
      minHeight: dimensions.height,
      maxHeight: dimensions.height,
      closable: true,
      focusable: true,
      show: true, // Changed from false to true to make window visible by default
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, "..", "..", "chat-input-preload.js"),
      },
    };
  }
}

module.exports = { WindowConfig };