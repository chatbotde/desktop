/**
 * Test Runner for Screen Capture API
 * Run this file with Electron to test the capture functionality in a dedicated window
 * 
 * Usage: npx electron test-capture-runner.js
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ChatInputWindow } = require('./chat-input-window');

let testWindow = null;
let chatInputWindowInstance = null;

function createTestWindow() {
    // First create a ChatInputWindow instance to register IPC handlers
    chatInputWindowInstance = new ChatInputWindow();
    
    // Manually register the IPC handlers since we're not calling createChatInputWindow
    if (!ChatInputWindow.ipcHandlersRegistered) {
        ChatInputWindow.registerIpcHandlers();
    }
    
    // Create the test window
    testWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'chat-input-preload.js') // Use the same preload script
        },
        title: 'Screen Capture API Test',
        show: false
    });

    // Store instance reference for IPC access
    testWindow._chatInputInstance = chatInputWindowInstance;

    // Load the test HTML file
    testWindow.loadFile(path.join(__dirname, 'capture', 'test-capture.html'));

    // Show window when ready
    testWindow.once('ready-to-show', () => {
        testWindow.show();
        console.log('🧪 Screen Capture API Test Window opened');
        console.log('📝 Instructions:');
        console.log('  1. Click "Check Capture Support" to verify functionality');
        console.log('  2. Test screenshots with the screenshot buttons');
        console.log('  3. Try video recording (start/pause/resume/stop)');
        console.log('  4. Test audio recording with volume monitoring');
        console.log('  5. Use management functions to control recordings');
    });

    // Handle window closed
    testWindow.on('closed', () => {
        testWindow = null;
        if (chatInputWindowInstance) {
            chatInputWindowInstance.destroy();
            chatInputWindowInstance = null;
        }
    });

    // Open DevTools for debugging
    testWindow.webContents.openDevTools();
}

// App event handlers
app.whenReady().then(() => {
    createTestWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (testWindow === null) {
        createTestWindow();
    }
});

// Handle app shutdown
app.on('before-quit', () => {
    if (chatInputWindowInstance) {
        chatInputWindowInstance.destroy();
    }
});
