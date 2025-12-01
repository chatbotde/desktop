/**
 * IPC channel definitions and message types
 */

/**
 * IPC Channel names - centralized definition
 */
export enum IpcChannel {
  // Window management
  WINDOW_SHOW = 'window:show',
  WINDOW_HIDE = 'window:hide',
  WINDOW_TOGGLE = 'window:toggle',
  WINDOW_MINIMIZE = 'window:minimize',
  WINDOW_CLOSE = 'window:close',
  WINDOW_SET_BOUNDS = 'window:set-bounds',
  WINDOW_GET_BOUNDS = 'window:get-bounds',
  WINDOW_SET_POSITION = 'window:set-position',
  WINDOW_GET_POSITION = 'window:get-position',
  
  // Click-through
  CLICKTHROUGH_ENABLE = 'clickthrough:enable',
  CLICKTHROUGH_DISABLE = 'clickthrough:disable',
  
  // Content protection
  CONTENT_PROTECTION_SET = 'content-protection:set',
  CONTENT_PROTECTION_GET = 'content-protection:get',
  
  // Capture
  CAPTURE_SCREENSHOT = 'capture:screenshot',
  CAPTURE_AREA_SCREENSHOT = 'capture:area-screenshot',
  CAPTURE_VIDEO_START = 'capture:video-start',
  CAPTURE_VIDEO_STOP = 'capture:video-stop',
  CAPTURE_AUDIO_START = 'capture:audio-start',
  CAPTURE_AUDIO_STOP = 'capture:audio-stop',
  
  // File picker
  FILE_PICKER_OPEN = 'file-picker:open',
  
  // Text selection
  TEXT_SELECTION_GET = 'text-selection:get',
  TEXT_SELECTION_MONITOR_START = 'text-selection:monitor-start',
  TEXT_SELECTION_MONITOR_STOP = 'text-selection:monitor-stop',
  
  // TSF (Text Services Framework)
  TSF_INSERT_TEXT = 'tsf:insert-text',
  TSF_GET_STATUS = 'tsf:get-status',
  TSF_FOCUS_CHANGED = 'tsf:focus-changed',
}

/**
 * Base IPC message structure
 */
export interface IpcMessage<T = any> {
  channel: IpcChannel | string;
  payload?: T;
  timestamp?: number;
  requestId?: string;
}

/**
 * IPC response structure
 */
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
  requestId?: string;
}

/**
 * Window bounds message
 */
export interface WindowBoundsMessage {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Screenshot capture options
 */
export interface ScreenshotCaptureOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Video capture options
 */
export interface VideoCaptureOptions {
  fps?: number;
  quality?: 'low' | 'medium' | 'high';
  audio?: boolean;
}

/**
 * Audio capture options
 */
export interface AudioCaptureOptions {
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

/**
 * File picker options
 */
export interface FilePickerOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

/**
 * Text selection data
 */
export interface TextSelectionData {
  text: string;
  html?: string;
  timestamp: number;
  source?: {
    app?: string;
    title?: string;
  };
}

/**
 * TSF insert text options
 */
export interface TsfInsertTextOptions {
  text: string;
  position?: 'cursor' | 'start' | 'end';
  replace?: boolean;
}

/**
 * Type guards for IPC messages
 */
export function isIpcMessage<T>(obj: any): obj is IpcMessage<T> {
  return obj && typeof obj === 'object' && 'channel' in obj;
}

export function isIpcResponse<T>(obj: any): obj is IpcResponse<T> {
  return obj && typeof obj === 'object' && 'success' in obj;
}
