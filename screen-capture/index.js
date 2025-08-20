/**
 * Screen Capture Module - Main Entry Point
 * 
 * This module provides secure screen capture functionality with maximum content protection.
 * The window created by this module cannot be captured or recorded by other applications.
 */

const { ScreenCaptureWindowManager } = require('./screen-capture-window-manager');
const { screenCaptureIpcHandlers } = require('./screen-capture-ipc-handlers');
const audioUtils = require('./audio-utils');

class ScreenCaptureModule {
    constructor() {
        this.windowManager = null;
        this.ipcHandlers = screenCaptureIpcHandlers;
        this.initialized = false;
    }

    /**
     * Initialize the screen capture module
     * This should be called once during application startup
     */
    initialize() {
        if (this.initialized) {
            console.log('Screen Capture: Module already initialized');
            return;
        }

        try {
            // Create window manager
            this.windowManager = new ScreenCaptureWindowManager();
            
            // Set audio utilities
            this.windowManager.setAudioUtils(audioUtils);
            
            // Set window manager in IPC handlers
            this.ipcHandlers.setWindowManager(this.windowManager);
            
            // Register IPC handlers
            this.ipcHandlers.registerHandlers();
            
            this.initialized = true;
            console.log('Screen Capture: Module initialized successfully');
        } catch (error) {
            console.error('Screen Capture: Failed to initialize module:', error);
            throw error;
        }
    }

    /**
     * Create and show the screen capture window
     * @returns {BrowserWindow|null} The created window or null if failed
     */
    createWindow() {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            return this.windowManager.createScreenCaptureWindow();
        } catch (error) {
            console.error('Screen Capture: Failed to create window:', error);
            return null;
        }
    }

    /**
     * Get the current screen capture window
     * @returns {BrowserWindow|null} The current window or null if not created
     */
    getCurrentWindow() {
        return this.windowManager ? this.windowManager.getCurrentWindow() : null;
    }

    /**
     * Check if screen capture window is open
     * @returns {boolean} True if window is open
     */
    isWindowOpen() {
        return this.windowManager ? this.windowManager.isWindowOpen() : false;
    }

    /**
     * Show the screen capture window
     */
    showWindow() {
        if (this.windowManager) {
            this.windowManager.showWindow();
        }
    }

    /**
     * Hide the screen capture window
     */
    hideWindow() {
        if (this.windowManager) {
            this.windowManager.hideWindow();
        }
    }

    /**
     * Close the screen capture window
     */
    closeWindow() {
        if (this.windowManager) {
            this.windowManager.closeWindow();
        }
    }

    /**
     * Get recording status
     * @returns {Object} Recording status information
     */
    getRecordingStatus() {
        if (!this.windowManager) {
            return { isRecording: false, type: null };
        }

        return {
            isRecording: this.windowManager.isRecording,
            type: this.windowManager.recordingType
        };
    }

    /**
     * Cleanup resources
     * This should be called during application shutdown
     */
    cleanup() {
        try {
            if (this.ipcHandlers) {
                this.ipcHandlers.cleanup();
            }
            
            this.windowManager = null;
            this.initialized = false;
            
            console.log('Screen Capture: Module cleanup completed');
        } catch (error) {
            console.error('Screen Capture: Error during cleanup:', error);
        }
    }
}

// Create singleton instance
const screenCaptureModule = new ScreenCaptureModule();

// Export the module and its components
module.exports = {
    screenCaptureModule,
    ScreenCaptureModule,
    ScreenCaptureWindowManager,
    audioUtils
};

