const { app, ipcMain, globalShortcut } = require("electron");
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const path = require("path");
const { spawn } = require("child_process");
// Remove LaunchWindowManager import
const { ChatInputWindow } = require("./chat-input/chat-input-window");
const { AutoStartupManager } = require("./startup");
const { clipboardMonitor } = require("./clipboard-monitor");
const { textSelectionMonitor } = require("./chat-input/electron-api/text-selection");
const { environmentConfig } = require("./utils/environment");

// Set app icon
if (process.platform === 'win32') {
  app.setAppUserModelId("com.sonicthinking.buddy");
}

// Global instances
// Remove launchWindowManager
let autoStartupManager = null;
let chatInputWindow = null;
let ipcHandlersRegistered = false;
let chatInputIpcHandlersRegistered = false;

// MCP Server Management
const mcpProcesses = new Map();
const mcpListeners = new Map();

// Remove createLaunchWindow function and replace with direct chat input window creation
function createChatInputWindow() {
  if (!chatInputWindow) {
    console.log('Main: Creating new chat input window');
    chatInputWindow = new ChatInputWindow();
    chatInputWindow.createChatInputWindow();
    // Show the window immediately
    chatInputWindow.show();
  }
  return chatInputWindow.getChatInputWindow();
}

app.whenReady().then(async () => {
  try {
    // Initialize ad blocker for all sessions (windows and WebContentsView)
    try {
      const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      const { session } = require('electron');
      blocker.enableBlockingInSession(session.defaultSession);
      app.on('session-created', (ses) => blocker.enableBlockingInSession(ses));
      console.log('Main: Ad blocker enabled for sessions');
    } catch (adblockError) {
      console.warn('Main: Ad blocker initialization failed:', adblockError?.message || adblockError);
    }

    // Initialize auto-startup functionality
    autoStartupManager = new AutoStartupManager();
    
    // Setup auto-startup on first run or after installation
    await autoStartupManager.setupAutoStartup();
    
    // Create and show chat input window directly instead of launch window
    createChatInputWindow();
    
    // Register global shortcuts
    registerGlobalShortcuts();

    // Start clipboard monitoring for auto-paste
    setupClipboardMonitoring();
    
    // Start text selection monitoring
    setupTextSelectionMonitoring();
  } catch (error) {
    console.error('Main: Error during app initialization:', error);
    // Continue with basic functionality even if auto-startup fails
    createChatInputWindow();
    registerGlobalShortcuts();
    setupClipboardMonitoring();
    setupTextSelectionMonitoring();
  }
});

// Setup IPC handlers (only once)
if (!ipcHandlersRegistered) {
  console.log('Main: Setting up IPC handlers');
  
  // Handle chat input window toggle - modified to work without launch window
  ipcMain.on('toggle-chat-input', () => {
    console.log('Main: Toggle chat input requested');
    if (!chatInputWindow) {
      console.log('Main: Creating new chat input window');
      chatInputWindow = new ChatInputWindow();
      chatInputWindow.createChatInputWindow();
      chatInputWindow.show();
    } else {
      console.log('Main: Toggling existing chat input window');
      chatInputWindow.toggle();
    }
  });

  // Handle chat input hide request
  ipcMain.on('hide-chat-input', () => {
    console.log('Main: Hide chat input requested');
    if (chatInputWindow) {
      chatInputWindow.hide();
    }
  });

  // MCP IPC Handlers
  ipcMain.handle('mcp:connect', async (event, config) => {
    const { serverId, command, args = [], env = {} } = config;
    
    try {
      console.log(`Main: Connecting to MCP server ${serverId} with command: ${command} ${args.join(' ')}`);
      
      // Spawn the MCP server process
      const childProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...env }
      });

      // Store the process
      mcpProcesses.set(serverId, childProcess);

      // Set up output listeners
      childProcess.stdout.on('data', (data) => {
        const sender = mcpListeners.get(serverId);
        if (sender && !sender.isDestroyed()) {
          sender.send('mcp:message', serverId, data.toString());
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`MCP ${serverId} stderr:`, data.toString());
      });

      childProcess.on('close', (code) => {
        console.log(`MCP ${serverId} exited with code ${code}`);
        mcpProcesses.delete(serverId);
        mcpListeners.delete(serverId);
      });

      childProcess.on('error', (error) => {
        console.error(`MCP ${serverId} error:`, error);
      });

      // Store the sender for this server
      mcpListeners.set(serverId, event.sender);

      return { success: true };
    } catch (error) {
      console.error(`Failed to start MCP ${serverId}:`, error);
      throw error;
    }
  });

  ipcMain.handle('mcp:send', async (event, serverId, message) => {
    const process = mcpProcesses.get(serverId);
    
    if (!process) {
      throw new Error(`MCP server ${serverId} not found`);
    }

    try {
      const jsonMessage = JSON.stringify(message) + '\n';
      process.stdin.write(jsonMessage);
    } catch (error) {
      console.error(`Failed to send to MCP ${serverId}:`, error);
      throw error;
    }
  });

  ipcMain.handle('mcp:disconnect', async (event, serverId) => {
    const process = mcpProcesses.get(serverId);
    
    if (process) {
      console.log(`Main: Disconnecting MCP server ${serverId}`);
      process.kill();
      mcpProcesses.delete(serverId);
      mcpListeners.delete(serverId);
    }
  });

  // AI Model IPC Handlers
  ipcMain.handle('get-all-ai-models', async () => {
    try {
      // Use CommonJS export of models (single source of truth)
      const modelConfig = require('./frontend/src/lib/ai/model-config-export.cjs');
      const models = modelConfig.getAllModels();
      console.log('Main: Retrieved', models.length, 'AI models from model-config');
      return models;
    } catch (error) {
      console.error('Main: Error getting AI models:', error);
      return [];
    }
  });

  ipcMain.on('ai-model-changed', (event, { modelId, modelDetails }) => {
    console.log('Main: AI model changed to', modelId, modelDetails);
    // You can add additional logic here if needed
    // For example, notifying other windows or saving preferences
  });

  // Environment Config IPC Handlers
  ipcMain.handle('get-frontend-url', () => {
    const frontendURL = environmentConfig.getFrontendURL();
    console.log('Main: Frontend URL requested:', frontendURL);
    return frontendURL;
  });

  ipcMain.handle('get-frontend-base-url', () => {
    const baseURL = environmentConfig.getFrontendBaseURL();
    console.log('Main: Frontend base URL requested:', baseURL);
    return baseURL;
  });

  ipcMain.handle('is-development', () => {
    return environmentConfig.isDev();
  });

  // Media chunk streaming IPC handlers
  ipcMain.handle('media:open', (event, suggestedPath) => {
    try {
      const os = require('os');
      const filePath = suggestedPath || path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
      const fs = require('fs');
      const ws = fs.createWriteStream(filePath, { flags: 'w' });
      if (!global.writeStreams) global.writeStreams = new Map();
      global.writeStreams.set(filePath, ws);
      return { success: true, filePath };
    } catch (error) {
      console.error('Main: media:open failed', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:write', async (event, { filePath, base64 }) => {
    if (!global.writeStreams) global.writeStreams = new Map();
    const ws = global.writeStreams.get(filePath);
    if (!ws) return { success: false, error: 'Write stream not found' };
    try {
      const buf = Buffer.from(base64, 'base64');
      await new Promise((resolve, reject) => ws.write(buf, err => err ? reject(err) : resolve()));
      return { success: true };
    } catch (error) {
      console.error('Main: media:write failed', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:close', (event, filePath) => {
    if (!global.writeStreams) return { success: true };
    const ws = global.writeStreams.get(filePath);
    if (ws) {
      ws.end();
      global.writeStreams.delete(filePath);
    }
    return { success: true };
  });

  ipcHandlersRegistered = true;
  console.log('Main: IPC handlers registered');
}

function registerGlobalShortcuts() {
  // Register Ctrl+H to hide/show chat input window
  const ret = globalShortcut.register('CommandOrControl+H', () => {
    console.log('Main: Global shortcut Ctrl+H pressed');
    if (chatInputWindow) {
      if (chatInputWindow.getChatInputWindow() && chatInputWindow.getChatInputWindow().isVisible()) {
        console.log('Main: Hiding chat input via global shortcut');
        chatInputWindow.hide();
      } else {
        console.log('Main: Showing chat input via global shortcut');
        chatInputWindow.show();
      }
    } else {
      console.log('Main: Chat input window not available, creating new one');
      // Create chat input window if it doesn't exist
      chatInputWindow = new ChatInputWindow();
      chatInputWindow.createChatInputWindow();
      chatInputWindow.show();
    }
  });

  if (!ret) {
    console.log('Main: Failed to register global shortcut Ctrl+H');
  } else {
    console.log('Main: Global shortcut Ctrl+H registered successfully');
  }
}

function setupClipboardMonitoring() {
  console.log('Main: Setting up clipboard monitoring for auto-paste');

  // Start clipboard monitoring
  clipboardMonitor.startMonitoring();

  // Handle clipboard changes
  clipboardMonitor.onChange((clipboardContent) => {
    console.log('Main: Clipboard content changed, type:', clipboardContent?.type);

    // Only auto-paste if we have a chat input window and it's visible
    if (chatInputWindow && chatInputWindow.getChatInputWindow() &&
        !chatInputWindow.getChatInputWindow().isDestroyed() &&
        chatInputWindow.getChatInputWindow().isVisible()) {

      console.log('Main: Auto-pasting clipboard content to chat input');

      // Send clipboard content to chat input window
      chatInputWindow.getChatInputWindow().webContents.send('clipboard-changed', clipboardContent);
    }
  });

  // IPC handlers for clipboard monitoring control
  ipcMain.handle('start-clipboard-monitoring', () => {
    clipboardMonitor.startMonitoring();
    console.log('Main: Clipboard monitoring started');
    return true;
  });

  ipcMain.handle('stop-clipboard-monitoring', () => {
    clipboardMonitor.stopMonitoring();
    console.log('Main: Clipboard monitoring stopped');
    return true;
  });

  ipcMain.handle('get-clipboard-monitoring-status', () => {
    return clipboardMonitor.isActive();
  });

  ipcMain.handle('set-clipboard-check-interval', (event, intervalMs) => {
    clipboardMonitor.setCheckInterval(intervalMs);
    console.log('Main: Clipboard check interval set to', intervalMs, 'ms');
    return true;
  });
}

function setupTextSelectionMonitoring() {
  console.log('Main: Setting up text selection monitoring');

  // Start text selection monitoring
  textSelectionMonitor.startMonitoring();

  // Handle text selection changes
  textSelectionMonitor.onSelection((selectionData) => {
    console.log('Main: Text selection changed', selectionData?.text?.substring(0, 50) + '...');

    // Validate selection data
    if (!selectionData || typeof selectionData !== 'object') {
      console.log('Main: Invalid selection data received, skipping');
      return;
    }

    // Validate text content
    const text = selectionData.text || selectionData.content || '';
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('Main: Empty or invalid text selection, skipping');
      return;
    }

    // Debug: Log chat input window status
    console.log('Main: Chat input window status:', {
      exists: !!chatInputWindow,
      windowExists: chatInputWindow && chatInputWindow.getChatInputWindow(),
      notDestroyed: chatInputWindow && chatInputWindow.getChatInputWindow() && !chatInputWindow.getChatInputWindow().isDestroyed(),
      isVisible: chatInputWindow && chatInputWindow.getChatInputWindow() && chatInputWindow.getChatInputWindow().isVisible()
    });

    // Only process selection data if we have a chat input window
    if (chatInputWindow && chatInputWindow.getChatInputWindow() &&
        !chatInputWindow.getChatInputWindow().isDestroyed()) {

      console.log('Main: Processing text selection');
      
      // Send text selection directly to the chat input window
      try {
        const result = chatInputWindow.getChatInputWindow().webContents.send('text-selection-changed', selectionData);
        console.log('Main: Successfully sent text selection to chat input window');
      } catch (error) {
        console.error('Main: Error sending text selection to chat input window:', error);
      }
    } else {
      console.log('Main: Skipping text selection processing - chat input window not available');
    }
  });

  // IPC handlers for text selection monitoring control
  ipcMain.handle('start-text-selection-monitoring', () => {
    textSelectionMonitor.startMonitoring();
    console.log('Main: Text selection monitoring started');
    return true;
  });

  ipcMain.handle('stop-text-selection-monitoring', () => {
    textSelectionMonitor.stopMonitoring();
    console.log('Main: Text selection monitoring stopped');
    return true;
  });

  ipcMain.handle('get-text-selection-monitoring-status', () => {
    return textSelectionMonitor.isActive();
  });
  
  // Handle add to chat from UI
  ipcMain.on('add-to-chat', (event, text) => {
    console.log('Main: Adding text to chat from UI:', typeof text === 'string' ? text.substring(0, 50) + '...' : text);
    
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('Main: Invalid text input for add-to-chat');
      return;
    }
    
    // Send text to chat input window
    if (chatInputWindow && chatInputWindow.getChatInputWindow() &&
        !chatInputWindow.getChatInputWindow().isDestroyed()) {
      chatInputWindow.getChatInputWindow().webContents.send('add-text-to-input', text);
    }
  });
}

app.on("window-all-closed", () => {
  // Don't quit the app when all windows are closed
  // The chat input window should persist
  // Only quit when explicitly closed via Ctrl+Alt+Y
});

app.on("will-quit", () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  // Clean up MCP processes
  mcpProcesses.forEach((process, serverId) => {
    console.log(`Main: Killing MCP process ${serverId}`);
    process.kill();
  });
  mcpProcesses.clear();
  mcpListeners.clear();
  
  // Clean up when quitting
  if (chatInputWindow) {
    chatInputWindow.destroy();
  }
});