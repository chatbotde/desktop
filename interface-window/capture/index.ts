/**
 * Screen Capture API - Main Entry Point (TypeScript)
 * Provides a unified interface for screenshot capture
 */

import ScreenshotCapture from './handlers/screenshot';
import CaptureBase from './utils/capture-base';

import {
  ScreenshotOptions,
  ScreenshotResult,
  SupportStatus,
  SelectionArea
} from './types/capture.types';

// Re-export SupportStatus
export type { SupportStatus } from './types/capture.types';

class CaptureAPI {
  private screenshotCapture: ScreenshotCapture;

  constructor() {
    this.screenshotCapture = new ScreenshotCapture();
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

  // ==================== CONVENIENCE METHODS ====================

  async quickScreenshot(): Promise<ScreenshotResult> {
    return this.screenshotCapture.quickCapture();
  }

  // ==================== UTILITY METHODS ====================

  static checkSupport(): SupportStatus {
    return {
      screenshot: ScreenshotCapture.isSupported(),
      videoRecording: false,
      audioRecording: false,
      desktopCapturer: CaptureBase.isSupported()
    };
  }

  cleanup(): void {
    this.screenshotCapture.cleanup();
  }
}

// ==================== EXPORTS ====================

// Attach sub-classes to main API
(CaptureAPI as any).ScreenshotCapture = ScreenshotCapture;
(CaptureAPI as any).CaptureBase = CaptureBase;

export default CaptureAPI;
module.exports = CaptureAPI;

