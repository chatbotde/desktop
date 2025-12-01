/**
 * Central export for all type definitions
 */

// Electron types
export * from './electron.types';

// IPC types
export * from './ipc.types';

// Window types (re-export specific types to avoid conflicts)
export type {
  WindowPreset,
  WindowBehaviorConfig,
  SecurityConfig,
  IWindowManager,
  WindowCreationOptions,
  WindowEvent,
  WindowEventHandler,
} from './window.types';

// Capture types
export * from './capture.types';
