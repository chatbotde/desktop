/**
 * Block Manager Module
 * Exports all block management components
 */

export { BlockManager } from './BlockManager';
export type { BlockStatus } from './BlockManager';
export { ActiveWindowMonitor } from './ActiveWindowMonitor';
export type { FocusInfo } from './ActiveWindowMonitor';
export { LockManager } from './LockManager';
export { SecurityManager } from './SecurityManager';
export { BlockStorage } from './block-storage';
export { setupBlockIpcHandlers } from './block-ipc-handlers';
export { setupIpcSecurityMiddleware } from './ipc-security-middleware';
export {
  initializeBlockManager,
  stopBlockManager,
  getBlockManager,
  getLockManager,
  type InterfaceWindowInstance
} from './init-block-manager';


