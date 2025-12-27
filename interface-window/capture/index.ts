/**
 * Screen Capture API - Main Entry Point (TypeScript)
 * Provides a unified interface for screenshot and video capture
 */

import ScreenshotCapture from './handlers/screenshot';
import VideoRecorder from './handlers/video-recorder';
import CaptureBase from './utils/capture-base';

import {
  ScreenshotOptions,
  ScreenshotResult,
  SupportStatus,
  SelectionArea,
  VideoRecordingOptions,
  VideoRecordingResult,
  RecordingState
} from './types/capture.types';

// Re-export types
export type { SupportStatus, RecordingState } from './types/capture.types';

class CaptureAPI {
  private screenshotCapture: ScreenshotCapture;
  private videoRecorder: VideoRecorder;

  constructor() {
    this.screenshotCapture = new ScreenshotCapture();
    this.videoRecorder = new VideoRecorder();
  }

  // ==================== SCREENSHOT METHODS ====================

  async takeScreenshot(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureScreen(options);
  }

  async takeWindowScreenshot(windowId: string, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureWindow(windowId, options);
  }

  async takeAreaScreenshot(area: SelectionArea, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureArea(area, options);
  }

  async takeAllScreenshots(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureAllScreens(options);
  }

  async getScreenshotSources(includeWindows: boolean = true) {
    return this.screenshotCapture.getAvailableSources(includeWindows);
  }

  // ==================== VIDEO RECORDING METHODS ====================

  async startVideoRecording(options: VideoRecordingOptions = {}): Promise<VideoRecordingResult> {
    return this.videoRecorder.startRecording(options);
  }

  async stopVideoRecording(): Promise<VideoRecordingResult> {
    return this.videoRecorder.stopRecording();
  }

  pauseVideoRecording(): VideoRecordingResult {
    return this.videoRecorder.pauseRecording();
  }

  resumeVideoRecording(): VideoRecordingResult {
    return this.videoRecorder.resumeRecording();
  }

  getVideoRecordingState(): RecordingState {
    return this.videoRecorder.getRecordingState();
  }

  getVideoRecordingDuration(): number {
    return this.videoRecorder.getRecordingDuration();
  }

  async startAreaVideoRecording(area: SelectionArea, options: VideoRecordingOptions = {}): Promise<VideoRecordingResult> {
    return this.videoRecorder.startAreaRecording(area, options);
  }

  async getVideoSources(includeWindows: boolean = true) {
    return this.videoRecorder.getAvailableSources(includeWindows);
  }

  // ==================== CONVENIENCE METHODS ====================

  async quickScreenshot(): Promise<ScreenshotResult> {
    return this.screenshotCapture.quickCapture();
  }

  // ==================== UTILITY METHODS ====================

  static checkSupport(): SupportStatus {
    return {
      screenshot: ScreenshotCapture.isSupported(),
      videoRecording: VideoRecorder.isSupported(),
      audioRecording: false,
      desktopCapturer: CaptureBase.isSupported()
    };
  }

  cleanup(): void {
    this.screenshotCapture.cleanup();
    this.videoRecorder.cleanup();
  }
}

// ==================== EXPORTS ====================

// Attach sub-classes to main API
(CaptureAPI as any).ScreenshotCapture = ScreenshotCapture;
(CaptureAPI as any).VideoRecorder = VideoRecorder;
(CaptureAPI as any).CaptureBase = CaptureBase;

export default CaptureAPI;
module.exports = CaptureAPI;


