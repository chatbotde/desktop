const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { MacOSInputMethod } = require('../index');

let mainWindow;
let inputMethod;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
    
    // Initialize input method
    inputMethod = new MacOSInputMethod();
}

// IPC Handlers
ipcMain.handle('input-method:insert-text', async (event, text) => {
    try {
        return inputMethod.insertText(text);
    } catch (error) {
        console.error('Insert text error:', error);
        return false;
    }
});

ipcMain.handle('input-method:insert-typing', async (event, { text, delay }) => {
    try {
        return await inputMethod.insertTextWithTyping(text, delay);
    } catch (error) {
        console.error('Insert typing error:', error);
        return false;
    }
});

ipcMain.handle('input-method:get-selected', async () => {
    try {
        return inputMethod.getSelectedText();
    } catch (error) {
        console.error('Get selected error:', error);
        return '';
    }
});

ipcMain.handle('input-method:replace-selected', async (event, text) => {
    try {
        return inputMethod.replaceSelectedText(text);
    } catch (error) {
        console.error('Replace selected error:', error);
        return false;
    }
});

ipcMain.handle('input-method:get-active-app', async () => {
    try {
        return inputMethod.getActiveApplication();
    } catch (error) {
        console.error('Get active app error:', error);
        return {};
    }
});

ipcMain.handle('input-method:check-text-input', async () => {
    try {
        return inputMethod.isTextInputActive();
    } catch (error) {
        console.error('Check text input error:', error);
        return false;
    }
});

ipcMain.handle('input-method:get-cursor-position', async () => {
    try {
        return inputMethod.getCursorPosition();
    } catch (error) {
        console.error('Get cursor position error:', error);
        return null;
    }
});

ipcMain.handle('input-method:send-shortcut', async (event, { key, modifiers }) => {
    try {
        return inputMethod.sendKeyboardShortcut(key, modifiers);
    } catch (error) {
        console.error('Send shortcut error:', error);
        return false;
    }
});

// Start monitoring
ipcMain.on('input-method:start-monitoring', (event) => {
    try {
        inputMethod.startMonitoring((eventData) => {
            mainWindow.webContents.send('input-method:event', eventData);
        });
    } catch (error) {
        console.error('Start monitoring error:', error);
    }
});

// Stop monitoring
ipcMain.on('input-method:stop-monitoring', () => {
    try {
        inputMethod.stopMonitoring();
    } catch (error) {
        console.error('Stop monitoring error:', error);
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
