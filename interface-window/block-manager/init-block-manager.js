/**
 * Block Manager Initialization
 * JavaScript wrapper for initializing the block manager system
 */

let blockManager = null;
let activeWindowMonitor = null;
let lockManager = null;

/**
 * Initialize block manager system
 * @param {BrowserWindow} interfaceWindow - The InterfaceWindow instance
 * @param {GlobalShortcutRegistry} globalShortcutRegistry - Optional global shortcut registry
 */
function initializeBlockManager(interfaceWindow, globalShortcutRegistry = null) {
  try {
    // Try to load from compiled TypeScript
    // The compiled files will be in dist/block-manager/
    const path = require('path');
    const blockManagerPath = path.join(__dirname, '..', 'dist', 'block-manager');
    
    // Try different import paths
    let BlockManager, ActiveWindowMonitor, LockManager, setupBlockIpcHandlers;
    
    try {
      // Try index file first
      const blockManagerModule = require(path.join(blockManagerPath, 'index'));
      BlockManager = blockManagerModule.BlockManager;
      ActiveWindowMonitor = blockManagerModule.ActiveWindowMonitor;
      LockManager = blockManagerModule.LockManager;
      setupBlockIpcHandlers = blockManagerModule.setupBlockIpcHandlers;
    } catch (e1) {
      try {
        // Try individual files
        BlockManager = require(path.join(blockManagerPath, 'BlockManager')).BlockManager;
        ActiveWindowMonitor = require(path.join(blockManagerPath, 'ActiveWindowMonitor')).ActiveWindowMonitor;
        LockManager = require(path.join(blockManagerPath, 'LockManager')).LockManager;
        setupBlockIpcHandlers = require(path.join(blockManagerPath, 'block-ipc-handlers')).setupBlockIpcHandlers;
      } catch (e2) {
        console.error('BlockManager: Failed to load modules:', e1.message, e2.message);
        throw e2;
      }
    }
    
    // Create BlockManager
    blockManager = new BlockManager();

    // Create monitors
    activeWindowMonitor = new ActiveWindowMonitor(blockManager);

    // Create LockManager with security
    lockManager = new LockManager(
      blockManager,
      activeWindowMonitor,
      interfaceWindow,
      globalShortcutRegistry
    );

    // Setup IPC handlers
    setupBlockIpcHandlers(blockManager);

    // Start monitoring
    lockManager.start();

    console.log('BlockManager: Initialized successfully');
    return true;
  } catch (error) {
    console.error('BlockManager: Failed to initialize:', error);
    console.error('BlockManager: Error details:', error.stack);
    return false;
  }
}

/**
 * Stop block manager system
 */
function stopBlockManager() {
  try {
    if (lockManager) {
      lockManager.stop();
    }
    console.log('BlockManager: Stopped');
  } catch (error) {
    console.error('BlockManager: Error stopping:', error);
  }
}

/**
 * Get block manager instance
 */
function getBlockManager() {
  return blockManager;
}

/**
 * Get lock manager instance
 */
function getLockManager() {
  return lockManager;
}

module.exports = {
  initializeBlockManager,
  stopBlockManager,
  getBlockManager,
  getLockManager,
};


