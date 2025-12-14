/**
 * Block IPC Handlers
 * Exposes BlockManager functionality to renderer process via IPC
 */

import { ipcMain } from 'electron';
import { BlockManager } from './BlockManager';

let blockManagerInstance: BlockManager | null = null;

/**
 * Initialize IPC handlers with BlockManager instance
 */
export function setupBlockIpcHandlers(blockManager: BlockManager): void {
  blockManagerInstance = blockManager;

  // Add blocked app (always allowed, even when locked)
  ipcMain.handle('block:add-app', async (_event, processName: string) => {
    try {
      if (!blockManagerInstance) {
        return { success: false, error: 'BlockManager not initialized' };
      }
      const success = blockManagerInstance.addBlockedApp(processName);
      return { success, message: success ? 'App added to block list' : 'App already in block list' };
    } catch (error: any) {
      console.error('block:add-app error:', error);
      return { success: false, error: error.message };
    }
  });

  // Remove blocked app
  ipcMain.handle('block:remove-app', async (_event, processName: string) => {
    try {
      if (!blockManagerInstance) {
        return { success: false, error: 'BlockManager not initialized' };
      }
      const success = blockManagerInstance.removeBlockedApp(processName);
      return { success, message: success ? 'App removed from block list' : 'App not in block list' };
    } catch (error: any) {
      console.error('block:remove-app error:', error);
      return { success: false, error: error.message };
    }
  });

  // Get blocked apps
  ipcMain.handle('block:get-apps', async () => {
    try {
      if (!blockManagerInstance) {
        return { success: false, apps: [], error: 'BlockManager not initialized' };
      }
      const apps = blockManagerInstance.getBlockedApps();
      return { success: true, apps };
    } catch (error: any) {
      console.error('block:get-apps error:', error);
      return { success: false, apps: [], error: error.message };
    }
  });

  // Get lock status
  ipcMain.handle('block:get-status', async () => {
    try {
      if (!blockManagerInstance) {
        return { success: false, status: null, error: 'BlockManager not initialized' };
      }
      const status = blockManagerInstance.getLockStatus();
      const lockEnabled = blockManagerInstance.isLockEnabled();
      return { success: true, status, lockEnabled };
    } catch (error: any) {
      console.error('block:get-status error:', error);
      return { success: false, status: null, error: error.message };
    }
  });

  // Set lock enabled (always allowed - needed to unlock)
  ipcMain.handle('block:set-enabled', async (_event, enabled: boolean) => {
    try {
      if (!blockManagerInstance) {
        return { success: false, error: 'BlockManager not initialized' };
      }
      blockManagerInstance.setLockEnabled(enabled);
      return { success: true };
    } catch (error: any) {
      console.error('block:set-enabled error:', error);
      return { success: false, error: error.message };
    }
  });

  // Send lock status changes to renderer
  if (blockManagerInstance) {
    blockManagerInstance.on('lock-status-changed', (status) => {
      // Send to all renderer processes
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach((window: any) => {
        if (!window.isDestroyed()) {
          window.webContents.send('block:lock-changed', status);
        }
      });
    });
  }

  console.log('Block IPC handlers registered');
}


