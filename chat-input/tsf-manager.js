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
     * @param {boolean} startMonitoring - Whether to start focus monitoring immediately (default: true)
     */
    async initialize(startMonitoring = true) {
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
                
                if (startMonitoring) {
                    console.log('🔍 Starting focus monitoring...');
                    this.startFocusMonitoring();
                } else {
                    console.log('⏸️  Focus monitoring not started (will start on first use)');
                }
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
                    
                    console.log(`🔄 Focus changed to: ${focusInfo.processName} (PID: ${focusInfo.processId})`);
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
                            console.log(`📍 Tracking external app: ${focusInfo.processName} (${focusInfo.windowTitle})`);
                            
                            // Capture this window as the target for insertion
                            try {
                                await tsf.setLastFocusedWindow();
                                console.log(`✅ Captured window handle for: ${focusInfo.processName}`);
                            } catch (e) {
                                console.error('❌ Failed to set last focused window:', e);
                            }

                            this.emit('external-focus-changed', focusInfo);
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
            console.log('🔍 Getting last tracked application...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();
            
            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️  No external application tracked yet!');
                console.log('💡 Please click on a text editor (Notepad, Word, etc.) before using Insert');
                this.emit('warning', {
                    message: 'No application to insert text into. Please click on an application first.'
                });
                return false;
            }

            console.log(`📍 Target app: ${lastFocus.processName} (${lastFocus.windowTitle || 'No title'})`);
            console.log(`📝 Text to insert (${text.length} chars): ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            this.emit('before-insert', { text, focusInfo: lastFocus });

            // Focus and insert in one operation
            console.log('🚀 Calling native focusAndInsertText...');
            const success = await tsf.focusAndInsertText(text);

            if (success) {
                console.log(`✅ Successfully inserted text into ${lastFocus.processName}`);
                this.emit('text-inserted', { text, focusInfo: lastFocus, method: 'focus-and-insert' });
                return true;
            } else {
                console.warn(`⚠️  TSF insertion failed, trying clipboard fallback...`);
                
                // Try clipboard fallback
                const fallbackSuccess = await this.pasteAtCaretPosition(text);
                
                if (!fallbackSuccess) {
                    console.error(`❌ All insertion methods failed for ${lastFocus.processName}`);
                    this.emit('insert-failed', { text, focusInfo: lastFocus });
                }
                
                return fallbackSuccess;
            }
        } catch (err) {
            console.error('Error in focusAndInsertText:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Fallback: Copy text to clipboard and simulate paste at caret position
     * Used when TSF insertion fails
     * @param {string} text - The text to paste
     * @returns {Promise<boolean>} Success status
     */
    async pasteAtCaretPosition(text) {
        if (!text || typeof text !== 'string') {
            console.error('Invalid text provided for clipboard paste');
            return false;
        }

        try {
            console.log('📋 Using clipboard fallback method');
            
            // Get the focused window info
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();
            
            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️  No application focused');
                return false;
            }

            console.log(`📍 Target: ${lastFocus.processName}`);
            console.log(`📝 Copying to clipboard: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

            // Copy to clipboard using electron clipboard
            const { clipboard } = require('electron');
            clipboard.writeText(text);
            console.log('✅ Text copied to clipboard');

            // Small delay to ensure clipboard is updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Focus the last window
            console.log('🎯 Focusing target window...');
            const focused = await tsf.focusLastWindow();
            
            if (!focused) {
                console.warn('⚠️  Could not focus target window');
            }

            // Another small delay for window to receive focus
            await new Promise(resolve => setTimeout(resolve, 150));

            // Simulate Ctrl+V paste using Windows SendInput API
            console.log('⌨️  Simulating Ctrl+V...');
            const success = await tsf.simulateCtrlV();
            
            if (success) {
                console.log('✅ Clipboard paste completed');
                this.emit('text-inserted', { text, focusInfo: lastFocus, method: 'clipboard-fallback' });
                return true;
            } else {
                console.warn('⚠️  Failed to simulate Ctrl+V');
                return false;
            }

        } catch (err) {
            console.error('❌ Clipboard fallback failed:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Get selected text from the focused application using TSF
     * @returns {Promise<string>} Selected text (empty string if none)
     */
    async getSelectedText() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const text = await tsf.getSelectedText();
            console.log(`📄 Got selected text (${text?.length || 0} chars)`);
            return text || '';
        } catch (err) {
            console.error('Error getting selected text:', err);
            return '';
        }
    }

    /**
     * Replace selected text in the focused application
     * @param {string} text - The replacement text
     * @returns {Promise<boolean>} Success status
     */
    async replaceSelectedText(text) {
        if (!this.enabled) {
            console.log('TSF is disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (text === undefined || text === null) {
            console.error('Invalid text provided');
            return false;
        }

        try {
            console.log(`🔄 Replacing selected text with: ${String(text).substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            const success = await tsf.replaceSelectedText(String(text));
            
            if (success) {
                console.log('✅ Successfully replaced selected text');
                this.emit('text-replaced', { text });
                return true;
            } else {
                console.warn('⚠️  Failed to replace selected text');
                this.emit('replace-failed', { text });
                return false;
            }
        } catch (err) {
            console.error('Error replacing selected text:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Focus last window and replace selected text there
     * Perfect for a "Change" button that replaces user's selected text with AI response
     * @param {string} text - The replacement text
     * @returns {Promise<boolean>} Success status
     */
    async focusAndReplaceText(text) {
        if (!this.enabled) {
            console.log('TSF is disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (text === undefined || text === null) {
            console.error('Invalid text provided');
            return false;
        }

        try {
            console.log('🔍 Getting last tracked application for text replacement...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();
            
            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️  No external application tracked yet!');
                console.log('💡 Please select text in an application first');
                this.emit('warning', {
                    message: 'No application to replace text in. Please select text in an application first.'
                });
                return false;
            }

            console.log(`📍 Target app: ${lastFocus.processName} (${lastFocus.windowTitle || 'No title'})`);
            console.log(`🔄 Text to replace with (${String(text).length} chars): ${String(text).substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            this.emit('before-replace', { text, focusInfo: lastFocus });

            // Focus and replace in one operation
            console.log('🚀 Calling native focusAndReplaceText...');
            const success = await tsf.focusAndReplaceText(String(text));

            if (success) {
                console.log(`✅ Successfully replaced text in ${lastFocus.processName}`);
                this.emit('text-replaced', { text, focusInfo: lastFocus, method: 'focus-and-replace' });
                return true;
            } else {
                console.warn(`⚠️  TSF replacement failed`);
                this.emit('replace-failed', { text, focusInfo: lastFocus });
                return false;
            }
        } catch (err) {
            console.error('Error in focusAndReplaceText:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Delete selected text in the focused application
     * @returns {Promise<boolean>} Success status
     */
    async deleteSelection() {
        if (!this.enabled) {
            console.log('TSF is disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log('🗑️  Deleting selected text...');
            const success = await tsf.deleteSelection();
            
            if (success) {
                console.log('✅ Successfully deleted selected text');
                this.emit('selection-deleted', {});
                return true;
            } else {
                console.warn('⚠️  Failed to delete selected text');
                return false;
            }
        } catch (err) {
            console.error('Error deleting selection:', err);
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
