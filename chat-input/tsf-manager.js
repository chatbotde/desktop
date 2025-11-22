/**
 * TSF Integration Module for Chat Input Window
 * 
 * This module integrates the Text Services Framework (TSF) with your chat input window,
 * enabling text insertion into any Windows application.
 */

const tsf = require('./tsf-framwork');
const { EventEmitter } = require('events');

class ChatInputTsfManager extends EventEmitter {
    constructor() {
        super();
        this.initialized = false;
        this.enabled = true;
        this.lastFocusInfo = null;
        this.lastExternalFocusInfo = null; // Track last non-Electron app
        this.focusCheckInterval = null;
        this.ownProcessName = 'electron.exe'; // Will be updated
    }

    /**
     * Initialize the TSF system
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            if (!tsf.isAvailable()) {
                console.error('TSF native module not available');
                this.emit('error', new Error('TSF module not loaded'));
                return false;
            }

            const success = await tsf.initialize();
            this.initialized = success;

            if (success) {
                console.log('✅ TSF initialized successfully');
                this.emit('initialized');
                this.startFocusMonitoring();
            } else {
                console.error('❌ Failed to initialize TSF');
                this.emit('error', new Error('TSF initialization failed'));
            }

            return success;
        } catch (err) {
            console.error('TSF initialization error:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Insert text into the currently focused application
     * @param {string} text - The text to insert
     * @param {Object} options - Insertion options
     * @returns {Promise<boolean>} Success status
     */
    async insertText(text, options = {}) {
        if (!this.enabled) {
            console.log('TSF is disabled');
            return false;
        }

        if (!this.initialized) {
            console.log('TSF not initialized, initializing now...');
            await this.initialize();
        }

        if (!text || typeof text !== 'string') {
            console.error('Invalid text provided');
            return false;
        }

        try {
            // Get focus info before inserting
            const focusInfo = await tsf.getFocusInfo();
            this.emit('before-insert', { text, focusInfo });

            // Check if window is editable
            const isEditable = await tsf.isEditableWindow();
            if (!isEditable && !options.force) {
                console.warn('Target window may not be editable');
                this.emit('warning', {
                    message: 'Target window may not accept text input',
                    focusInfo
                });
            }

            // Insert text
            const success = options.useFallback 
                ? await tsf.insertTextFallback(text)
                : await tsf.insertText(text);

            if (success) {
                console.log(`✅ Text inserted into ${focusInfo.processName}`);
                this.emit('text-inserted', { text, focusInfo, method: options.useFallback ? 'fallback' : 'auto' });
            } else {
                console.error('❌ Failed to insert text');
                this.emit('insert-failed', { text, focusInfo });
            }

            return success;
        } catch (err) {
            console.error('Error inserting text:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Insert text using only the fallback method (clipboard + paste)
     * @param {string} text - The text to insert
     * @returns {Promise<boolean>} Success status
     */
    async insertTextFallback(text) {
        return this.insertText(text, { useFallback: true });
    }

    /**
     * Start monitoring focus changes
     * @param {number} interval - Check interval in milliseconds (default: 1000)
     * @param {string} ownProcessName - Your app's process name to exclude (optional)
     */
    startFocusMonitoring(interval = 1000, ownProcessName = null) {
        if (ownProcessName) {
            this.ownProcessName = ownProcessName.toLowerCase();
        }

        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
        }

        this.focusCheckInterval = setInterval(async () => {
            try {
                const focusInfo = await tsf.getFocusInfo();
                
                // Check if focus changed
                if (!this.lastFocusInfo || 
                    focusInfo.processId !== this.lastFocusInfo.processId ||
                    focusInfo.windowTitle !== this.lastFocusInfo.windowTitle) {
                    
                    this.emit('focus-changed', focusInfo);
                    this.lastFocusInfo = focusInfo;
                    
                    // Track external applications (not our own app)
                    const processLower = focusInfo.processName.toLowerCase();
                    if (processLower && 
                        !processLower.includes('electron') && 
                        !processLower.includes(this.ownProcessName) &&
                        focusInfo.processId !== process.pid) {
                        
                        // This is an external app - remember it
                        if (!this.lastExternalFocusInfo || 
                            this.lastExternalFocusInfo.processId !== focusInfo.processId) {
                            
                            this.lastExternalFocusInfo = focusInfo;
                            await tsf.setLastFocusedWindow();
                            this.emit('external-focus-changed', focusInfo);
                            console.log(`📍 Tracked external app: ${focusInfo.processName}`);
                        }
                    }
                }
            } catch (err) {
                // Silently ignore errors during monitoring
            }
        }, interval);
    }

    /**
     * Stop monitoring focus changes
     */
    stopFocusMonitoring() {
        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
            this.focusCheckInterval = null;
        }
    }

    /**
     * Get current focus information
     * @returns {Promise<Object>} Focus info
     */
    async getFocusInfo() {
        try {
            return await tsf.getFocusInfo();
        } catch (err) {
            console.error('Error getting focus info:', err);
            return {
                windowTitle: '',
                processName: '',
                processId: 0,
                isEditable: false
            };
        }
    }

    /**
     * Check if TSF is available for current window
     * @returns {Promise<boolean>} Availability status
     */
    async isTsfAvailable() {
        if (!this.initialized) {
            return false;
        }

        try {
            return await tsf.isTsfAvailable();
        } catch (err) {
            console.error('Error checking TSF availability:', err);
            return false;
        }
    }

    /**
     * Check if current window is editable
     * @returns {Promise<boolean>} Editable status
     */
    async isEditableWindow() {
        try {
            return await tsf.isEditableWindow();
        } catch (err) {
            console.error('Error checking editable status:', err);
            return false;
        }
    }

    /**
     * Enable or disable text insertion
     * @param {boolean} enabled - Enable status
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.emit('enabled-changed', enabled);
    }

    /**
     * Check if TSF is enabled
     * @returns {boolean} Enabled status
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get the last external (non-Electron) focused application
     * @returns {Object|null} Last external focus info
     */
    getLastExternalFocus() {
        return this.lastExternalFocusInfo;
    }

    /**
     * Get last focused window info from native tracker
     * @returns {Promise<Object>} Last focused window info
     */
    async getLastFocusedWindow() {
        try {
            return await tsf.getLastFocusedWindow();
        } catch (err) {
            console.error('Error getting last focused window:', err);
            return null;
        }
    }

    /**
     * Focus the last tracked external application
     * @returns {Promise<boolean>} Success status
     */
    async focusLastWindow() {
        try {
            const success = await tsf.focusLastWindow();
            if (success) {
                console.log('✅ Focused last window');
            }
            return success;
        } catch (err) {
            console.error('Error focusing last window:', err);
            return false;
        }
    }

    /**
     * Focus last window and insert text there
     * Perfect for a button that sends text back to where user was typing
     * @param {string} text - The text to insert
     * @returns {Promise<boolean>} Success status
     */
    async focusAndInsertText(text) {
        if (!this.enabled) {
            console.log('TSF is disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (!text || typeof text !== 'string') {
            console.error('Invalid text provided');
            return false;
        }

        try {
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();
            
            if (!lastFocus || !lastFocus.processName) {
                console.warn('No external application tracked');
                this.emit('warning', {
                    message: 'No application to insert text into. Please click on an application first.'
                });
                return false;
            }

            console.log(`📍 Focusing ${lastFocus.processName} and inserting text...`);
            this.emit('before-insert', { text, focusInfo: lastFocus });

            // Focus and insert in one operation
            const success = await tsf.focusAndInsertText(text);

            if (success) {
                console.log(`✅ Text inserted into ${lastFocus.processName}`);
                this.emit('text-inserted', { text, focusInfo: lastFocus, method: 'focus-and-insert' });
            } else {
                console.error('❌ Failed to insert text');
                this.emit('insert-failed', { text, focusInfo: lastFocus });
            }

            return success;
        } catch (err) {
            console.error('Error in focusAndInsertText:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Cleanup and release resources
     */
    async cleanup() {
        this.stopFocusMonitoring();

        if (this.initialized) {
            try {
                await tsf.cleanup();
                this.initialized = false;
                this.emit('cleanup');
                console.log('TSF cleaned up');
            } catch (err) {
                console.error('Error during TSF cleanup:', err);
            }
        }
    }
}

// Create singleton instance
const tsfManager = new ChatInputTsfManager();

module.exports = tsfManager;
