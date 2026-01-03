/**
 * TSF Module for Interface Window
 * 
 * Exports all TSF-related functionality for use in the interface-window.
 */

export { TsfManager, tsfManager } from './tsf-manager';
export type { FocusInfo, InsertOptions, RichContentData } from './tsf-manager';
export { setupTsfIpc, initializeTsf, cleanupTsf } from './tsf-ipc-handlers';
