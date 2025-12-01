/**
 * Core Electron type definitions for chat-input window
 */
import type { BrowserWindow, BrowserWindowConstructorOptions, IpcMainEvent, IpcRendererEvent } from 'electron';

/**
 * Enhanced BrowserWindow with chat-input specific properties
 */
export interface ChatInputBrowserWindow extends BrowserWindow {
  _chatInputInstance?: any;
}

/**
 * Window position configuration
 */
export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Window size configuration
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Window bounds (position + size)
 */
export interface WindowBounds extends WindowPosition, WindowSize {}

/**
 * Window configuration options
 */
export interface WindowConfig extends BrowserWindowConstructorOptions {
  title?: string;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
  resizable?: boolean;
  frame?: boolean;
  transparent?: boolean;
}

/**
 * Window state
 */
export interface WindowState {
  isVisible: boolean;
  isFocused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFullScreen: boolean;
  bounds: WindowBounds;
}

/**
 * IPC event with typed payload
 */
export interface TypedIpcMainEvent<T = any> extends IpcMainEvent {
  reply(channel: string, ...args: any[]): void;
  returnValue: T;
}

/**
 * IPC event with typed payload for renderer
 */
export interface TypedIpcRendererEvent<T = any> extends IpcRendererEvent {
  senderId: number;
  payload?: T;
}

/**
 * Export all Electron types for convenience
 */
export type {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  IpcMainEvent,
  IpcRendererEvent,
};
