/**
 * Main Entry Point
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Bootstraps the application only
 * - Dependency Inversion: Uses Application coordinator
 * - All logic delegated to focused components
 */

import { app } from 'electron';
import { ProtocolHandler } from './interface-window/dist/protocol-handler';

// Declare __dirname for TypeScript (available in CommonJS)
declare const __dirname: string;

// Register custom protocol schemes BEFORE app is ready
// This must be done synchronously at startup
ProtocolHandler.registerPrivileges();

// Handle deep link URLs from command line arguments FIRST
let pendingDeepLinkUrl: string | null = null;
const deepLinkArg = process.argv.find(arg => arg.startsWith('buddy://') || arg.startsWith('buddy:'));
if (deepLinkArg) {
  console.log('Main: Deep link detected in args:', deepLinkArg);
  pendingDeepLinkUrl = deepLinkArg;
  const deepLinkIndex = process.argv.indexOf(deepLinkArg);
  if (deepLinkIndex > -1) {
    process.argv.splice(deepLinkIndex, 1);
  }
}

// Handle deep link after auth initialization
if (pendingDeepLinkUrl) {
  const { initializeAuth } = require('./auth');
  const { deepLinkHandler } = require('./auth');
  
  initializeAuth().then(() => {
    deepLinkHandler.handleUrl(pendingDeepLinkUrl!);
  }).catch((error: Error) => {
    console.error('Main: Failed to initialize auth for deep link:', error);
  });
}

// Initialize and run application
const { Application } = require('./application');
const application = new Application();

application.initialize().catch((error: Error) => {
  console.error('Main: Fatal error during application initialization:', error);
  app.quit();
});
