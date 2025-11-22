/**
 * Example: Integration with Electron IPC
 * Place this in your main process
 */

const { app, ipcMain } = require('electron');
const tsf = require('./tsf-framework');

class TsfIntegration {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;
        
        this.initialized = await tsf.initialize();
        return this.initialized;
    }

    setupIpcHandlers() {
        // Initialize TSF
        ipcMain.handle('tsf:initialize', async () => {
            return await this.initialize();
        });

        // Insert text
        ipcMain.handle('tsf:insert-text', async (event, text) => {
            if (!this.initialized) {
                await this.initialize();
            }
            return await tsf.insertText(text);
        });

        // Insert text with fallback
        ipcMain.handle('tsf:insert-text-fallback', async (event, text) => {
            if (!this.initialized) {
                await this.initialize();
            }
            return await tsf.insertTextFallback(text);
        });

        // Get focus info
        ipcMain.handle('tsf:get-focus-info', async () => {
            return await tsf.getFocusInfo();
        });

        // Check TSF availability
        ipcMain.handle('tsf:is-available', async () => {
            if (!this.initialized) {
                await this.initialize();
            }
            return await tsf.isTsfAvailable();
        });

        // Check if window is editable
        ipcMain.handle('tsf:is-editable', async () => {
            return await tsf.isEditableWindow();
        });

        // Cleanup
        ipcMain.handle('tsf:cleanup', async () => {
            await tsf.cleanup();
            this.initialized = false;
        });
    }

    async cleanup() {
        if (this.initialized) {
            await tsf.cleanup();
            this.initialized = false;
        }
    }
}

// Usage in your main.js
const tsfIntegration = new TsfIntegration();

app.whenReady().then(async () => {
    // Setup IPC handlers
    tsfIntegration.setupIpcHandlers();
    
    // Initialize TSF
    await tsfIntegration.initialize();
    
    // Your other app initialization code...
});

app.on('will-quit', async () => {
    await tsfIntegration.cleanup();
});

module.exports = TsfIntegration;
