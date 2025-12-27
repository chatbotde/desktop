/**
 * Block Manager Initialization
 * TypeScript wrapper for initializing the block manager system
 */

import { BrowserWindow } from 'electron';
import { BlockManager } from './BlockManager';
import { ActiveWindowMonitor } from './ActiveWindowMonitor';
import { LockManager } from './LockManager';
import { setupBlockIpcHandlers } from './block-ipc-handlers';

// Type for InterfaceWindow (to avoid circular dependency)
export interface InterfaceWindowInstance {
  isLocked(): boolean;
  hide(): void;
  show(): void;
}

let blockManager: BlockManager | null = null;
let activeWindowMonitor: ActiveWindowMonitor | null = null;
let lockManager: LockManager | null = null;

/**
 * Initialize block manager system
 * @param interfaceWindow - The InterfaceWindow instance
 * @param globalShortcutRegistry - Optional global shortcut registry
 */
export function initializeBlockManager(
  interfaceWindow: InterfaceWindowInstance,
  globalShortcutRegistry: any = null
): boolean {
  try {
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
    if (error instanceof Error) {
      console.error('BlockManager: Error details:', error.stack);
    }
    return false;
  }
}

/**
 * Stop block manager system
 */
export function stopBlockManager(): void {
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
export function getBlockManager(): BlockManager | null {
  return blockManager;
}

/**
 * Get lock manager instance
 */
export function getLockManager(): LockManager | null {
  return lockManager;
}

