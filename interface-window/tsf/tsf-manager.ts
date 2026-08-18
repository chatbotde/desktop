/**
 * TSF Manager for Interface Window
 * 
 * This module provides Windows TSF (Text Services Framework) integration
 * for inserting text into any application that accepts text input.
 * 
 * Independent implementation - does not depend on chat-input.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import { ElectronClipboardService } from '../electron-api/clipboard';
import { ElectronGlobalShortcutService } from '../electron-api/global-shortcut';
import { pinManager } from './pin-manager';

// Import the native TSF module
// Try multiple paths to ensure it works in both dev and production
let tsf: any;
const possiblePaths = [
    // From dist/tsf/ go up 2 levels to interface-window root
    path.join(__dirname, '..', '..', 'os-system', 'tsf-framwork'),
    // From tsf/ go up 1 level (source location)
    path.join(__dirname, '..', 'os-system', 'tsf-framwork'),
    // Absolute path fallback
    path.resolve(__dirname, '../../os-system/tsf-framwork'),
];

for (const tsfPath of possiblePaths) {
    try {
        tsf = require(tsfPath);
        if (tsf && typeof tsf.isAvailable === 'function') {
            console.log('TSF Manager: Loaded native module from:', tsfPath);
            break;
        }
    } catch (err: any) {
        console.log(`TSF Manager: Path ${tsfPath} failed:`, err.message);
    }
}

if (!tsf) {
    console.error('TSF Manager: Failed to load native TSF module from any path');
}

export interface FocusInfo {
    windowTitle: string;
    processName: string;
    processId: number;
    isEditable: boolean;
    /** Native HWND as decimal string (may be empty on older native builds) */
    hwnd?: string;
}

export interface InsertOptions {
    useFallback?: boolean;
    force?: boolean;
}

export interface RichContentData {
    text?: string;           // Plain text fallback
    html?: string;           // HTML content (for rich text editors)
    image?: string;          // Image as data URL (e.g., "data:image/png;base64,...")
    rtf?: string;           // RTF format (for Word, etc.)
}

export class TsfManager extends EventEmitter {
    private initialized: boolean = false;
    private enabled: boolean = true;
    private lastFocusInfo: FocusInfo | null = null;
    private lastExternalFocusInfo: FocusInfo | null = null;
    private focusCheckInterval: NodeJS.Timeout | null = null;
    private ownProcessName: string = 'electron.exe';
    private clipboardService: ElectronClipboardService;
    private globalShortcutService: ElectronGlobalShortcutService;

    constructor() {
        super();
        this.clipboardService = new ElectronClipboardService();
        this.globalShortcutService = new ElectronGlobalShortcutService();
    }

    /**
     * Check if the native module is available
     */
    isAvailable(): boolean {
        return tsf?.isAvailable?.() ?? false;
    }

    /**
     * Initialize the TSF system
     */
    async initialize(startMonitoring: boolean = true): Promise<boolean> {
        if (this.initialized) {
            return true;
        }

        try {
            if (!this.isAvailable()) {
                console.error('TSF Manager: Native module not available');
                this.emit('error', new Error('TSF module not loaded'));
                return false;
            }

            const success = await tsf.initialize();
            this.initialized = success;

            if (success) {
                console.log('✅ TSF Manager: Initialized successfully');
                this.emit('initialized');

                if (startMonitoring) {
                    console.log('🔍 TSF Manager: Starting focus monitoring...');
                    this.startFocusMonitoring();
                }
            } else {
                console.error('❌ TSF Manager: Initialization failed');
                this.emit('error', new Error('TSF initialization failed'));
            }

            return success;
        } catch (err) {
            console.error('TSF Manager: Initialization error:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Insert text into the currently focused application
     */
    async insertText(text: string, options: InsertOptions = {}): Promise<boolean> {
        if (!this.enabled) {
            console.log('TSF Manager: Disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (!text || typeof text !== 'string') {
            console.error('TSF Manager: Invalid text provided');
            return false;
        }

        try {
            const focusInfo = await this.getFocusInfo();
            this.emit('before-insert', { text, focusInfo });

            const isEditable = await tsf.isEditableWindow();
            if (!isEditable && !options.force) {
                console.warn('TSF Manager: Target window may not be editable');
                this.emit('warning', {
                    message: 'Target window may not accept text input',
                    focusInfo
                });
            }

            const success = options.useFallback
                ? await tsf.insertTextFallback(text)
                : await tsf.insertText(text);

            if (success) {
                console.log(`✅ TSF Manager: Text inserted into ${focusInfo.processName}`);
                this.emit('text-inserted', { text, focusInfo, method: options.useFallback ? 'fallback' : 'auto' });
            } else {
                console.error('❌ TSF Manager: Failed to insert text');
                this.emit('insert-failed', { text, focusInfo });
            }

            return success;
        } catch (err) {
            console.error('TSF Manager: Error inserting text:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Insert text using clipboard+paste fallback
     */
    async insertTextFallback(text: string): Promise<boolean> {
        return this.insertText(text, { useFallback: true });
    }

    /**
     * Start monitoring focus changes
     */
    startFocusMonitoring(interval: number = 1000): void {
        if (!this.isAvailable()) {
            console.warn('TSF Manager: Skipping focus monitoring — native module unavailable');
            return;
        }

        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
        }

        this.focusCheckInterval = setInterval(async () => {
            try {
                const focusInfo = await this.getFocusInfo();

                // Check if focus changed
                if (!this.lastFocusInfo ||
                    focusInfo.processId !== this.lastFocusInfo.processId ||
                    focusInfo.windowTitle !== this.lastFocusInfo.windowTitle) {

                    console.log(`🔄 TSF Manager: Focus changed to: ${focusInfo.processName} (PID: ${focusInfo.processId})`);
                    this.emit('focus-changed', focusInfo);
                    this.lastFocusInfo = focusInfo;

                    // Track external applications (not Electron)
                    const processLower = focusInfo.processName.toLowerCase();
                    if (processLower &&
                        !processLower.includes('electron') &&
                        !processLower.includes(this.ownProcessName) &&
                        focusInfo.processId !== process.pid) {

                        if (!this.lastExternalFocusInfo ||
                            this.lastExternalFocusInfo.processId !== focusInfo.processId) {

                            this.lastExternalFocusInfo = focusInfo;
                            console.log(`📍 TSF Manager: Tracking external app: ${focusInfo.processName} (${focusInfo.windowTitle})`);

                            // Capture this window as the target for insertion
                            try {
                                if (focusInfo.hwnd) {
                                    await tsf.setLastFocusedWindow(focusInfo.hwnd);
                                } else {
                                    await tsf.setLastFocusedWindow();
                                }
                                console.log(`✅ TSF Manager: Captured window handle for: ${focusInfo.processName}`);
                            } catch (e) {
                                console.error('❌ TSF Manager: Failed to set last focused window:', e);
                            }

                            // Soft-revive insert pins when matching app comes back into focus
                            try {
                                pinManager.onFocusSeen(focusInfo);
                            } catch (e) {
                                console.warn('TSF Manager: pin revive on focus failed:', e);
                            }

                            this.emit('external-focus-changed', focusInfo);
                        } else {
                            // Same process still focused — keep last focus + pin HWND fresh
                            this.lastExternalFocusInfo = focusInfo;
                            try {
                                if (focusInfo.hwnd) {
                                    await tsf.setLastFocusedWindow(focusInfo.hwnd);
                                }
                                pinManager.onFocusSeen(focusInfo);
                            } catch {
                                // ignore
                            }
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
    stopFocusMonitoring(): void {
        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
            this.focusCheckInterval = null;
        }
    }

    /**
     * Get current focus information
     */
    async getFocusInfo(): Promise<FocusInfo> {
        const empty: FocusInfo = {
            windowTitle: '',
            processName: '',
            processId: 0,
            isEditable: false,
            hwnd: '',
        };

        if (!this.isAvailable() || typeof tsf?.getFocusInfo !== 'function') {
            return empty;
        }

        try {
            return await tsf.getFocusInfo();
        } catch (err) {
            console.error('TSF Manager: Error getting focus info:', err);
            return empty;
        }
    }

    /**
     * Check if TSF is available for current window
     */
    async isTsfAvailable(): Promise<boolean> {
        if (!this.initialized) {
            return false;
        }

        try {
            return await tsf.isTsfAvailable();
        } catch (err) {
            return false;
        }
    }

    /**
     * Check if current window is editable
     */
    async isEditableWindow(): Promise<boolean> {
        try {
            return await tsf.isEditableWindow();
        } catch (err) {
            return false;
        }
    }

    /**
     * Enable or disable text insertion
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.emit('enabled-changed', enabled);
    }

    /**
     * Check if TSF is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get the last external (non-Electron) focused application
     */
    getLastExternalFocus(): FocusInfo | null {
        return this.lastExternalFocusInfo;
    }

    /**
     * Get last focused window info from native tracker
     */
    async getLastFocusedWindow(): Promise<FocusInfo | null> {
        try {
            return await tsf.getLastFocusedWindow();
        } catch (err) {
            console.error('TSF Manager: Error getting last focused window:', err);
            return null;
        }
    }

    /**
     * Screen-space bounds for a window hwnd string
     */
    async getWindowRect(
        hwnd: string
    ): Promise<{ x: number; y: number; width: number; height: number } | null> {
        if (!hwnd || typeof tsf?.getWindowRect !== 'function') return null;
        try {
            return await tsf.getWindowRect(hwnd);
        } catch (err) {
            console.error('TSF Manager: Error getting window rect:', err);
            return null;
        }
    }

    /**
     * Caret position in foreground app (physical screen px), or cursor fallback.
     */
    async getInputAnchor(): Promise<{ x: number; y: number } | null> {
        if (typeof tsf?.getInputAnchor !== 'function') return null;
        try {
            return await tsf.getInputAnchor();
        } catch (err) {
            console.error('TSF Manager: Error getting input anchor:', err);
            return null;
        }
    }

    /**
     * Capture UI Automation target at screen point for background pin insert.
     */
    async captureUiaTargetAt(x: number, y: number): Promise<any | null> {
        if (typeof tsf?.captureUiaTargetAt !== 'function') return null;
        try {
            return await tsf.captureUiaTargetAt(x, y);
        } catch (err) {
            console.warn('TSF Manager: UIA capture failed:', err);
            return null;
        }
    }

    /**
     * Focus the last tracked external application
     */
    async focusLastWindow(): Promise<boolean> {
        try {
            const success = await tsf.focusLastWindow();
            if (success) {
                console.log('✅ TSF Manager: Focused last window');
            }
            return success;
        } catch (err) {
            console.error('TSF Manager: Error focusing last window:', err);
            return false;
        }
    }

    /**
     * Focus last window and insert text there
     * This is the main method for the Insert button
     */
    async focusAndInsertText(text: string): Promise<boolean> {
        if (!this.enabled) {
            console.log('TSF Manager: Disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (!text || typeof text !== 'string') {
            console.error('TSF Manager: Invalid text provided');
            return false;
        }

        try {
            console.log('🔍 TSF Manager: Getting last tracked application...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();

            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️ TSF Manager: No external application tracked yet!');
                this.emit('warning', {
                    message: 'No application to insert text into. Please click on an application first.'
                });
                return false;
            }

            console.log(`📍 TSF Manager: Target app: ${lastFocus.processName} (${lastFocus.windowTitle || 'No title'})`);
            console.log(`📝 TSF Manager: Text to insert (${text.length} chars): ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            this.emit('before-insert', { text, focusInfo: lastFocus });

            // Focus and insert in one operation
            console.log('🚀 TSF Manager: Calling native focusAndInsertText...');
            const success = await tsf.focusAndInsertText(text);

            if (success) {
                console.log(`✅ TSF Manager: Successfully inserted text into ${lastFocus.processName}`);
                this.emit('text-inserted', { text, focusInfo: lastFocus, method: 'focus-and-insert' });
                return true;
            } else {
                console.warn('⚠️ TSF Manager: TSF insertion failed');
                this.emit('insert-failed', { text, focusInfo: lastFocus });
                return false;
            }
        } catch (err) {
            console.error('TSF Manager: Error in focusAndInsertText:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Focus last window, move to end of selection, and insert text
     */
    async focusAndInsertAtEnd(text: string): Promise<boolean> {
        if (!this.enabled) {
            console.log('TSF Manager: Disabled');
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        if (!text || typeof text !== 'string') {
            console.error('TSF Manager: Invalid text provided');
            return false;
        }

        try {
            console.log('🔍 TSF Manager: Getting last tracked application for insert at end...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();

            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️ TSF Manager: No external application tracked yet!');
                return false;
            }

            console.log(`📍 TSF Manager: Target app: ${lastFocus.processName}`);
            
            // Focus the window first
            await this.focusLastWindow();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Simulate Right Arrow to move caret to the end of the selection
            console.log('➡️ TSF Manager: Simulating Right Arrow...');
            await new Promise<void>((resolve) => {
                const { spawn } = require('child_process');
                const ps = spawn('powershell', [
                    '-NoProfile',
                    '-NonInteractive',
                    '-Command',
                    "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('{RIGHT}')"
                ]);
                ps.on('close', () => resolve());
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            // Now insert the text normally
            const success = await tsf.insertText(text);
            
            if (success) {
                this.emit('text-inserted', { text, focusInfo: lastFocus, method: 'focus-and-insert-at-end' });
            }
            return success;
        } catch (err) {
            console.error('TSF Manager: Error in focusAndInsertAtEnd:', err);
            return false;
        }
    }

    /**
     * Get selected text from focused application
     */
    async getSelectedText(): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const text = await tsf.getSelectedText();
            console.log(`📄 TSF Manager: Got selected text (${text?.length || 0} chars)`);
            return text || '';
        } catch (err) {
            console.error('TSF Manager: Error getting selected text:', err);
            return '';
        }
    }

    /**
     * Replace selected text in focused application
     */
    async replaceSelectedText(text: string): Promise<boolean> {
        if (!this.enabled) {
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`🔄 TSF Manager: Replacing selected text with: ${String(text).substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            const success = await tsf.replaceSelectedText(String(text));

            if (success) {
                console.log('✅ TSF Manager: Successfully replaced selected text');
                this.emit('text-replaced', { text });
            } else {
                console.warn('⚠️ TSF Manager: Failed to replace selected text');
                this.emit('replace-failed', { text });
            }

            return success;
        } catch (err) {
            console.error('TSF Manager: Error replacing selected text:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Focus last window and replace selected text
     */
    async focusAndReplaceText(text: string): Promise<boolean> {
        if (!this.enabled) {
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log('🔍 TSF Manager: Getting last tracked application for text replacement...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();

            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️ TSF Manager: No external application tracked yet!');
                this.emit('warning', {
                    message: 'No application to replace text in. Please select text in an application first.'
                });
                return false;
            }

            console.log(`📍 TSF Manager: Target app: ${lastFocus.processName}`);
            this.emit('before-replace', { text, focusInfo: lastFocus });

            console.log('🚀 TSF Manager: Calling native focusAndReplaceText...');
            const success = await tsf.focusAndReplaceText(String(text));

            if (success) {
                console.log(`✅ TSF Manager: Successfully replaced text in ${lastFocus.processName}`);
                this.emit('text-replaced', { text, focusInfo: lastFocus, method: 'focus-and-replace' });
            } else {
                console.warn('⚠️ TSF Manager: TSF replacement failed');
                this.emit('replace-failed', { text, focusInfo: lastFocus });
            }

            return success;
        } catch (err) {
            console.error('TSF Manager: Error in focusAndReplaceText:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Delete selected text
     */
    async deleteSelection(): Promise<boolean> {
        if (!this.enabled) {
            return false;
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log('🗑️ TSF Manager: Deleting selected text...');
            const success = await tsf.deleteSelection();

            if (success) {
                console.log('✅ TSF Manager: Successfully deleted selected text');
                this.emit('selection-deleted', {});
            }

            return success;
        } catch (err) {
            console.error('TSF Manager: Error deleting selection:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Focus last window and insert rich content (HTML, images, RTF, etc.)
     * This method ALWAYS uses clipboard + paste (bypasses TSF, as TSF only supports plain text)
     * 
     * @param content - Rich content data (text, HTML, image, RTF, or combination)
     * @returns Success status
     */
    async focusAndInsertRichContent(content: RichContentData): Promise<boolean> {
        if (!this.enabled) {
            console.log('TSF Manager: Disabled');
            return false;
        }

        // Validate that at least one content type is provided
        if (!content.text && !content.html && !content.image && !content.rtf) {
            console.error('TSF Manager: No content provided in RichContentData');
            this.emit('error', new Error('No content provided'));
            return false;
        }

        try {
            console.log('🔍 TSF Manager: Getting last tracked application for rich content insertion...');
            const lastFocus = this.lastExternalFocusInfo || await this.getLastFocusedWindow();

            if (!lastFocus || !lastFocus.processName) {
                console.warn('⚠️ TSF Manager: No external application tracked yet!');
                this.emit('warning', {
                    message: 'No application to insert content into. Please click on an application first.'
                });
                return false;
            }

            console.log(`📍 TSF Manager: Target app: ${lastFocus.processName} (${lastFocus.windowTitle || 'No title'})`);
            console.log(`📋 TSF Manager: Rich content types: ${[
                content.text ? 'text' : '',
                content.html ? 'html' : '',
                content.image ? 'image' : '',
                content.rtf ? 'rtf' : ''
            ].filter(Boolean).join(', ')}`);
            
            this.emit('before-insert', { content, focusInfo: lastFocus });

            // Save current clipboard content (optional - for restoration)
            let savedClipboard: { text?: string; html?: string; image?: string } | null = null;
            try {
                const formats = this.clipboardService.availableFormats();
                if (formats.includes('text/plain')) {
                    savedClipboard = { text: this.clipboardService.readText() };
                }
                if (formats.includes('text/html')) {
                    savedClipboard = { ...savedClipboard, html: this.clipboardService.readHTML() };
                }
                if (formats.includes('image/png') || formats.includes('image/jpeg')) {
                    const img = this.clipboardService.readImage();
                    if (img) {
                        savedClipboard = { ...savedClipboard, image: img };
                    }
                }
            } catch (err) {
                console.warn('TSF Manager: Could not save clipboard content:', err);
            }

            // Write rich content to clipboard
            try {
                if (content.image) {
                    // Write image (data URL string is accepted by writeImage)
                    this.clipboardService.writeImage(content.image);
                    if (content.text) {
                        // Also write text as fallback - need to use write() to combine formats
                        // But write() expects NativeImage, so we'll write text separately
                        // Most apps will prefer image over text when both are present
                        this.clipboardService.writeText(content.text);
                    }
                } else if (content.html || content.rtf) {
                    // Write HTML/RTF with text fallback using write() method
                    // Note: write() can handle multiple formats at once
                    const clipboardData: any = {};
                    if (content.text) clipboardData.text = content.text;
                    if (content.html) clipboardData.html = content.html;
                    if (content.rtf) clipboardData.rtf = content.rtf;
                    this.clipboardService.write(clipboardData);
                } else if (content.text) {
                    // Plain text only
                    this.clipboardService.writeText(content.text);
                }

                console.log('✅ TSF Manager: Rich content written to clipboard');
            } catch (err) {
                console.error('❌ TSF Manager: Failed to write content to clipboard:', err);
                this.emit('error', err);
                return false;
            }

            // Focus the last tracked window
            console.log('🎯 TSF Manager: Focusing last tracked window...');
            const focusSuccess = await this.focusLastWindow();
            if (!focusSuccess) {
                console.warn('⚠️ TSF Manager: Failed to focus last window');
                this.emit('warning', {
                    message: 'Failed to focus target application',
                    focusInfo: lastFocus
                });
                // Continue anyway - the window might already be focused
            }

            // Wait a bit for focus to settle
            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate paste (Ctrl+V)
            console.log('⌨️ TSF Manager: Simulating paste (Ctrl+V)...');
            try {
                await this.globalShortcutService.simulatePaste();
                console.log('✅ TSF Manager: Paste simulated successfully');
            } catch (err) {
                console.error('❌ TSF Manager: Failed to simulate paste:', err);
                this.emit('error', err);
                return false;
            }

            // Wait for paste to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Optionally restore clipboard (after a delay to ensure paste completed)
            if (savedClipboard) {
                setTimeout(() => {
                    try {
                        if (savedClipboard!.text) {
                            this.clipboardService.writeText(savedClipboard!.text);
                        } else if (savedClipboard!.html) {
                            this.clipboardService.writeHTML(savedClipboard!.html);
                        } else if (savedClipboard!.image) {
                            this.clipboardService.writeImage(savedClipboard!.image);
                        }
                        console.log('✅ TSF Manager: Clipboard restored');
                    } catch (err) {
                        console.warn('TSF Manager: Failed to restore clipboard:', err);
                    }
                }, 500);
            }

            console.log(`✅ TSF Manager: Successfully inserted rich content into ${lastFocus.processName}`);
            this.emit('text-inserted', { 
                content, 
                focusInfo: lastFocus, 
                method: 'clipboard-paste' 
            });
            return true;
        } catch (err) {
            console.error('TSF Manager: Error in focusAndInsertRichContent:', err);
            this.emit('error', err);
            return false;
        }
    }

    /**
     * Cleanup and release resources
     */
    async cleanup(): Promise<void> {
        this.stopFocusMonitoring();

        if (this.initialized) {
            try {
                await tsf.cleanup();
                this.initialized = false;
                this.emit('cleanup');
                console.log('TSF Manager: Cleaned up');
            } catch (err) {
                console.error('TSF Manager: Error during cleanup:', err);
            }
        }
    }
}

// Singleton instance
export const tsfManager = new TsfManager();
