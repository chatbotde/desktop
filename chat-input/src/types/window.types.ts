/**
 * Window management type definitions
 */
import type { BrowserWindow } from 'electron';

/**
 * Window preset types
 */
export type WindowPreset = 'default' | 'compact' | 'expanded' | 'minimal' | 'fullscreen';

/**
 * Window behavior configuration
 */
export interface WindowBehaviorConfig {
  alwaysOnTop?: boolean;
  alwaysOnTopInterval?: number;
  skipTaskbar?: boolean;
  forceAboveTaskbar?: boolean;
  clickThrough?: boolean;
  resizable?: boolean;
  movable?: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  contentProtection?: boolean;
  enhancedScreenRecordingProtection?: boolean;
}

/**
 * Window manager interface
 */
export interface IWindowManager {
  getWindow(): BrowserWindow | null;
  show(): void;
  hide(): void;
  toggle(): void;
  focus(): void;
  minimize(): void;
  close(): void;
  destroy(): void;
  isVisible(): boolean;
  isFocused(): boolean;
  setBounds(bounds: Partial<WindowBounds>): void;
  getBounds(): WindowBounds;
}

/**
 * Window bounds
 */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Window creation options
 */
export interface WindowCreationOptions {
  preset?: WindowPreset;
  bounds?: Partial<WindowBounds>;
  behavior?: WindowBehaviorConfig;
  security?: SecurityConfig;
  showOnCreate?: boolean;
}

/**
 * Window event types
 */
export enum WindowEvent {
  READY = 'ready',
  SHOW = 'show',
  HIDE = 'hide',
  FOCUS = 'focus',
  BLUR = 'blur',
  RESIZE = 'resize',
  MOVE = 'move',
  CLOSE = 'close',
  CLOSED = 'closed',
  MINIMIZE = 'minimize',
  MAXIMIZE = 'maximize',
  RESTORE = 'restore',
}

/**
 * Window event handler
 */
export type WindowEventHandler<T = any> = (data?: T) => void;

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
  preset?: WindowPreset;
}
