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

export type VideoQuality = 'low' | 'medium' | 'high';

export interface ProcessingOptions {
  brightness?: number;
  contrast?: number;
  saturate?: number;
  blurPx?: number;
  hueRotateDeg?: number;
  // Audio processing
  highpassHz?: number;
  lowpassHz?: number;
  compressor?: {
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    knee?: number;
  };
  gain?: number;
}

export interface VideoRecordingOptions {
  quality?: VideoQuality;
  includeAudio?: boolean;
  frameRate?: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  processingEnabled?: boolean;
  processingOptions?: ProcessingOptions;
  timesliceMs?: number;
  onProgress?: (progress: RecordingProgress) => void;
  onChunk?: (chunk: Blob) => void;
}

export interface RecordingProgress {
  duration: number;
  chunksCount: number;
  dataSize: number;
}

export interface RecordingMetadata {
  duration: number;
  size: number;
  quality: string;
}

export interface RecordingInfo {
  startTime: number;
  endTime: number;
  quality: VideoQuality;
  includeAudio: boolean;
  source?: string;
  sampleRate?: number;
  channelCount?: number;
}

export interface MediaFile {
  name: string;
  type: string;
  size: number;
  data: string;
  mediaType: string;
  source: string;
  dimensions?: MediaDimensions | null;
  duration?: number | null;
  timestamp: number;
  recordingInfo?: RecordingInfo;
}

export interface VideoRecordingResult {
  success: boolean;
  video?: MediaFile;
  metadata?: RecordingMetadata;
  error?: string;
  recordingId?: string;
  message?: string;
  sourceInfo?: SourceInfo;
  settings?: RecordingSettings;
}

export interface RecordingSettings {
  quality: VideoQuality;
  includeAudio: boolean;
  mimeType: string;
  processingEnabled: boolean;
  processingOptions?: ProcessingOptions;
  timesliceMs: number;
  source?: string;
  sampleRate?: number;
  channelCount?: number;
}

// ==================== AUDIO RECORDING TYPES ====================

export type AudioSource = 'microphone' | 'system' | 'both';
export type AudioQuality = 'low' | 'medium' | 'high';

export interface AudioRecordingOptions {
  source?: AudioSource;
  quality?: AudioQuality;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  processingEnabled?: boolean;
  processingOptions?: ProcessingOptions;
  timesliceMs?: number;
  onProgress?: (progress: RecordingProgress) => void;
  onVolumeChange?: (volume: number) => void;
  onChunk?: (chunk: Blob) => void;
}

export interface AudioRecordingResult {
  success: boolean;
  audio?: MediaFile;
  metadata?: RecordingMetadata;
  error?: string;
  recordingId?: string;
  message?: string;
  settings?: RecordingSettings;
}

// ==================== RECORDER STATUS ====================

export interface RecorderStatus {
  isRecording: boolean;
  state: 'inactive' | 'recording' | 'paused';
  duration: number;
  chunksCount: number;
  dataSize: number;
  source?: AudioSource;
}

export interface RecordingStatus {
  exists: boolean;
  type?: 'video' | 'audio';
  startTime?: number;
  error?: string;
  isRecording?: boolean;
  state?: 'inactive' | 'recording' | 'paused';
  duration?: number;
  chunksCount?: number;
  dataSize?: number;
  source?: AudioSource;
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

// ==================== MEDIA CONSTRAINTS ====================

export interface AudioConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  channelCount?: number;
}

export interface MediaStreamConstraints {
  audio?: boolean | any;
  video?: boolean | any;
}

// ==================== QUALITY PRESETS ====================

export interface QualityPreset {
  video: {
    mandatory: {
      maxWidth?: number;
      maxHeight?: number;
      maxFrameRate?: number;
    };
  };
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
}

// ==================== MEDIA UTILS TYPES ====================

export type MediaType = 'image' | 'video' | 'audio';

export interface FileValidation {
  isValid: boolean;
  error?: string;
  mediaType?: MediaType;
  size?: number;
  type?: string;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

// ==================== CAPTURE API TYPES ====================

export interface ActiveRecording {
  type: 'video' | 'audio';
  recorder: any;
  startTime: number;
  autoStopTimeout?: ReturnType<typeof setTimeout>;
}

export interface SupportStatus {
  screenshot: boolean;
  videoRecording: boolean;
  audioRecording: boolean;
  desktopCapturer: boolean;
}

export interface QualityPresets {
  video: string[];
  audio: string[];
}

export interface SupportedFormats {
  video: string[];
  audio: string[];
  image: string[];
}

export interface StopAllResult {
  recordingId: string;
  type: 'video' | 'audio';
  result: VideoRecordingResult | AudioRecordingResult;
}
