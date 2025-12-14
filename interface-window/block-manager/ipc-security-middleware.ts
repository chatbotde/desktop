/**
 * IPC Security Middleware
 * Blocks IPC requests when the application is locked
 */

import { SecurityManager } from './SecurityManager';

let securityManagerInstance: SecurityManager | null = null;

/**
 * Initialize IPC security middleware
 */
export function setupIpcSecurityMiddleware(securityManager: SecurityManager): void {
  securityManagerInstance = securityManager;

  // Register security check function with register-apis
  try {
    const { setSecurityCheck } = require('../register-apis');
    setSecurityCheck((channel: string) => {
      if (securityManagerInstance) {
        return securityManagerInstance.shouldBlockIpcRequest(channel);
      }
      return false;
    });
  } catch (error) {
    console.warn('IPC Security: Could not register with register-apis:', error);
  }

  console.log('IPC Security Middleware: Enabled');
}

/**
 * Get security manager instance
 */
export function getSecurityManager(): SecurityManager | null {
  return securityManagerInstance;
}

/**
 * Check if a channel should be blocked (for use in other IPC handlers)
 */
export function shouldBlockChannel(channel: string): boolean {
  if (securityManagerInstance) {
    return securityManagerInstance.shouldBlockIpcRequest(channel);
  }
  return false;
}
