const { BrowserWindow } = require('electron');
const path = require('path');

// Import all browser window modules
const windowManager = require('./window-manager');
const windowCreator = require('./window-creator');
const windowUtils = require('./window-utils');
const windowPresets = require('./window-presets');
const windowEvents = require('./window-events');

/**
 * BrowserWindow API Manager
 * Provides organized access to all BrowserWindow operations
 */
class BrowserWindowManager {
  constructor() {
    this.windows = new Map();
    this.windowConfigs = new Map();
    this.eventHandlers = new Map();
  }

  // Window Creation Methods
  createWindow(options = {}) {
    return windowCreator.createWindow(options, this.windows, this.windowConfigs);
  }

  createWebAppWindow(url, options = {}) {
    return windowCreator.createWebAppWindow(url, options, this.windows, this.windowConfigs);
  }

  createMinimalWindow(url, options = {}) {
    return windowCreator.createMinimalWindow(url, options, this.windows, this.windowConfigs);
  }

  createOverlayWindow(url, options = {}) {
    return windowCreator.createOverlayWindow(url, options, this.windows, this.windowConfigs);
  }

  // Preset Window Types
  createChatWindow(url = 'https://chat.openai.com', options = {}) {
    return windowPresets.createChatWindow(url, options, this.windows, this.windowConfigs);
  }

  createDevelopmentWindow(url = 'http://localhost:3000', options = {}) {
    return windowPresets.createDevelopmentWindow(url, options, this.windows, this.windowConfigs);
  }

  createProductivityWindow(url, options = {}) {
    return windowPresets.createProductivityWindow(url, options, this.windows, this.windowConfigs);
  }

  createSocialWindow(url, options = {}) {
    return windowPresets.createSocialWindow(url, options, this.windows, this.windowConfigs);
  }

  createMediaWindow(url, options = {}) {
    return windowPresets.createMediaWindow(url, options, this.windows, this.windowConfigs);
  }

  // Window Management Methods
  getWindow(windowId) {
    return windowManager.getWindow(windowId, this.windows);
  }

  getAllWindows() {
    return windowManager.getAllWindows(this.windows);
  }

  closeWindow(windowId) {
    return windowManager.closeWindow(windowId, this.windows, this.windowConfigs);
  }

  closeAllWindows() {
    return windowManager.closeAllWindows(this.windows, this.windowConfigs);
  }

  showWindow(windowId) {
    return windowManager.showWindow(windowId, this.windows);
  }

  hideWindow(windowId) {
    return windowManager.hideWindow(windowId, this.windows);
  }

  focusWindow(windowId) {
    return windowManager.focusWindow(windowId, this.windows);
  }

  minimizeWindow(windowId) {
    return windowManager.minimizeWindow(windowId, this.windows);
  }

  maximizeWindow(windowId) {
    return windowManager.maximizeWindow(windowId, this.windows);
  }

  restoreWindow(windowId) {
    return windowManager.restoreWindow(windowId, this.windows);
  }

  // Window Utility Methods
  setWindowBounds(windowId, bounds) {
    return windowUtils.setWindowBounds(windowId, bounds, this.windows);
  }

  getWindowBounds(windowId) {
    return windowUtils.getWindowBounds(windowId, this.windows);
  }

  setWindowAlwaysOnTop(windowId, flag) {
    return windowUtils.setWindowAlwaysOnTop(windowId, flag, this.windows);
  }

  setWindowOpacity(windowId, opacity) {
    return windowUtils.setWindowOpacity(windowId, opacity, this.windows);
  }

  setWindowIgnoreMouseEvents(windowId, ignore) {
    return windowUtils.setWindowIgnoreMouseEvents(windowId, ignore, this.windows);
  }

  // Window Information Methods
  getWindowInfo(windowId) {
    return windowUtils.getWindowInfo(windowId, this.windows, this.windowConfigs);
  }

  getAllWindowsInfo() {
    return windowUtils.getAllWindowsInfo(this.windows, this.windowConfigs);
  }

  // Event Management
  addWindowEventListener(windowId, event, handler) {
    return windowEvents.addEventListener(windowId, event, handler, this.windows, this.eventHandlers);
  }

  removeWindowEventListener(windowId, event, handler) {
    return windowEvents.removeEventListener(windowId, event, handler, this.windows, this.eventHandlers);
  }

  // Navigation Methods
  loadURL(windowId, url) {
    return windowUtils.loadURL(windowId, url, this.windows);
  }

  reload(windowId) {
    return windowUtils.reload(windowId, this.windows);
  }

  goBack(windowId) {
    return windowUtils.goBack(windowId, this.windows);
  }

  goForward(windowId) {
    return windowUtils.goForward(windowId, this.windows);
  }

  // Developer Tools
  openDevTools(windowId) {
    return windowUtils.openDevTools(windowId, this.windows);
  }

  closeDevTools(windowId) {
    return windowUtils.closeDevTools(windowId, this.windows);
  }

  toggleDevTools(windowId) {
    return windowUtils.toggleDevTools(windowId, this.windows);
  }
}

// Create singleton instance
const browserWindowManager = new BrowserWindowManager();

// Export both the class and the instance
module.exports = {
  BrowserWindowManager,
  browserWindowManager,

  // Direct exports for convenience
  createWindow: browserWindowManager.createWindow.bind(browserWindowManager),
  createWebAppWindow: browserWindowManager.createWebAppWindow.bind(browserWindowManager),
  createMinimalWindow: browserWindowManager.createMinimalWindow.bind(browserWindowManager),
  createOverlayWindow: browserWindowManager.createOverlayWindow.bind(browserWindowManager),
  
  // Preset window creators
  createChatWindow: browserWindowManager.createChatWindow.bind(browserWindowManager),
  createDevelopmentWindow: browserWindowManager.createDevelopmentWindow.bind(browserWindowManager),
  createProductivityWindow: browserWindowManager.createProductivityWindow.bind(browserWindowManager),
  createSocialWindow: browserWindowManager.createSocialWindow.bind(browserWindowManager),
  createMediaWindow: browserWindowManager.createMediaWindow.bind(browserWindowManager),
  
  // Window management
  getWindow: browserWindowManager.getWindow.bind(browserWindowManager),
  getAllWindows: browserWindowManager.getAllWindows.bind(browserWindowManager),
  closeWindow: browserWindowManager.closeWindow.bind(browserWindowManager),
  closeAllWindows: browserWindowManager.closeAllWindows.bind(browserWindowManager),
  showWindow: browserWindowManager.showWindow.bind(browserWindowManager),
  hideWindow: browserWindowManager.hideWindow.bind(browserWindowManager),
  focusWindow: browserWindowManager.focusWindow.bind(browserWindowManager),
  minimizeWindow: browserWindowManager.minimizeWindow.bind(browserWindowManager),
  maximizeWindow: browserWindowManager.maximizeWindow.bind(browserWindowManager),
  restoreWindow: browserWindowManager.restoreWindow.bind(browserWindowManager),
  
  // Utilities
  setWindowBounds: browserWindowManager.setWindowBounds.bind(browserWindowManager),
  getWindowBounds: browserWindowManager.getWindowBounds.bind(browserWindowManager),
  setWindowAlwaysOnTop: browserWindowManager.setWindowAlwaysOnTop.bind(browserWindowManager),
  setWindowOpacity: browserWindowManager.setWindowOpacity.bind(browserWindowManager),
  setWindowIgnoreMouseEvents: browserWindowManager.setWindowIgnoreMouseEvents.bind(browserWindowManager),
  getWindowInfo: browserWindowManager.getWindowInfo.bind(browserWindowManager),
  getAllWindowsInfo: browserWindowManager.getAllWindowsInfo.bind(browserWindowManager),
  
  // Events
  addWindowEventListener: browserWindowManager.addWindowEventListener.bind(browserWindowManager),
  removeWindowEventListener: browserWindowManager.removeWindowEventListener.bind(browserWindowManager),
  
  // Navigation
  loadURL: browserWindowManager.loadURL.bind(browserWindowManager),
  reload: browserWindowManager.reload.bind(browserWindowManager),
  goBack: browserWindowManager.goBack.bind(browserWindowManager),
  goForward: browserWindowManager.goForward.bind(browserWindowManager),
  
  // Developer tools
  openDevTools: browserWindowManager.openDevTools.bind(browserWindowManager),
  closeDevTools: browserWindowManager.closeDevTools.bind(browserWindowManager),
  toggleDevTools: browserWindowManager.toggleDevTools.bind(browserWindowManager)
};