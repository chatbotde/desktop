/**
 * Capture system type definitions
 */

/**
 * Capture type
 */
export enum CaptureType {
  SCREENSHOT = 'screenshot',
  AREA_SCREENSHOT = 'area-screenshot',
  VIDEO = 'video',
  AUDIO = 'audio',
}

/**
 * Media format
 */
export enum MediaFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  MP4 = 'mp4',
  WEBM = 'webm',
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  format?: MediaFormat.PNG | MediaFormat.JPEG | MediaFormat.WEBP;
  quality?: number; // 0-100
  display?: number; // Display index
}

/**
 * Area screenshot options
 */
export interface AreaScreenshotOptions extends ScreenshotOptions {
  area: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Video recording options
 */
export interface VideoRecordingOptions {
  format?: MediaFormat.MP4 | MediaFormat.WEBM;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  audio?: boolean;
  audioSource?: string;
  display?: number;
  cursor?: boolean;
}

/**
 * Audio recording options
 */
export interface AudioRecordingOptions {
  format?: MediaFormat.MP3 | MediaFormat.WAV | MediaFormat.OGG;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  device?: string;
}

/**
 * Capture result
 */
export interface CaptureResult {
  type: CaptureType;
  format: MediaFormat;
  data: Buffer | string; // Buffer for binary, base64 string for data URL
  metadata?: CaptureMetadata;
  timestamp: number;
}

/**
 * Capture metadata
 */
export interface CaptureMetadata {
  width?: number;
  height?: number;
  duration?: number;
  size?: number; // File size in bytes
  fps?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  [key: string]: any;
}

/**
 * Recording state
 */
export enum RecordingState {
  IDLE = 'idle',
  STARTING = 'starting',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Recording session
 */
export interface RecordingSession {
  id: string;
  type: CaptureType.VIDEO | CaptureType.AUDIO;
  state: RecordingState;
  startTime?: number;
  endTime?: number;
  duration?: number;
  options: VideoRecordingOptions | AudioRecordingOptions;
}

/**
 * Capture handler interface
 */
export interface ICaptureHandler {
  capture(options?: any): Promise<CaptureResult>;
  isAvailable(): boolean;
  getDefaultOptions(): any;
}

/**
 * Recording handler interface
 */
export interface IRecordingHandler extends ICaptureHandler {
  start(options?: any): Promise<void>;
  stop(): Promise<CaptureResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getState(): RecordingState;
  getSession(): RecordingSession | null;
}
