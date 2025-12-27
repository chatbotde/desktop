/**
 * Type definitions for Capture API
 */

// ==================== COMMON TYPES ====================

export interface CaptureResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface SourceInfo {
  id: string;
  name: string;
  displayId?: string;
}

// ==================== SCREENSHOT TYPES ====================

export interface ScreenshotOptions {
  sourceId?: string | null;
  format?: 'png' | 'jpg' | 'jpeg';
  quality?: number;
  name?: string | null;
}

export interface ScreenshotData {
  name: string;
  type: string;
  size: number;
  data: string;
  source: string;
  dimensions: MediaDimensions;
  timestamp: number;
  sourceInfo: SourceInfo;
  selectionArea?: SelectionArea;
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  path?: Array<{ x: number; y: number }>;
}

export interface ScreenshotResult {
  success: boolean;
  screenshot?: ScreenshotData;
  screenshots?: ScreenshotData[];
  count?: number;
  error?: string;
}

export interface AvailableSource {
  id: string;
  name: string;
  type: 'screen' | 'window';
  displayId?: string;
  thumbnail?: any;
  icon?: any;
}

export interface SourcesResult {
  success: boolean;
  sources?: AvailableSource[];
  error?: string;
}

// ==================== VIDEO RECORDING TYPES ====================

export type RecordingState = 'idle' | 'recording' | 'paused';

export interface VideoRecordingOptions {
  sourceId?: string | null;
  fps?: number;
  videoBitsPerSecond?: number;
  width?: number;
  height?: number;
  audioEnabled?: boolean;
  name?: string | null;
}

export interface VideoData {
  name: string;
  type: string;
  size: number;
  data: string;
  blob?: Blob;
  dimensions: MediaDimensions;
  duration: number;
  fps: number;
  timestamp: number;
  selectionArea?: SelectionArea;
}

export interface VideoRecordingResult {
  success: boolean;
  error?: string;
  video?: VideoData;
  state?: RecordingState;
  sourceId?: string;
  fps?: number;
  videoBitsPerSecond?: number;
  mimeType?: string;
  area?: SelectionArea;
}

// ==================== DESKTOP SOURCE TYPES ====================

export interface DesktopSourceOptions {
  types?: Array<'screen' | 'window'>;
  thumbnailSize?: MediaDimensions;
  fetchWindowIcons?: boolean;
}

export interface DesktopSource {
  id: string;
  name: string;
  display_id?: string;
  thumbnail?: any;
  appIcon?: any;
}

// ==================== SUPPORT STATUS ====================

export interface SupportStatus {
  screenshot: boolean;
  videoRecording: boolean;
  audioRecording: boolean;
  desktopCapturer: boolean;
}

