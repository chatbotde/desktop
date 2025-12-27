/**
 * Capture API IPC handlers for Interface Window
 */

import { ipcMain } from 'electron';
import CaptureAPI from '../index';

class CaptureApiHandlers {
  private captureAPI: CaptureAPI;
  private clickThroughManager: any;

  constructor(clickThroughManager?: any) {
    this.captureAPI = new CaptureAPI();
    this.clickThroughManager = clickThroughManager;
  }

  /**
   * Helper to temporarily enable content protection during screenshot
   */
  private async withContentProtection<T>(fn: () => Promise<T>): Promise<T> {
    let originalState = false;

    if (this.clickThroughManager) {
      originalState = this.clickThroughManager.getContentProtection();
      // Always enable content protection during screenshot to exclude window
      this.clickThroughManager.setContentProtection(true);
    }

    try {
      return await fn();
    } finally {
      // Restore original state after screenshot
      if (this.clickThroughManager) {
        this.clickThroughManager.setContentProtection(originalState);
      }
    }
  }

  static registerHandlers(clickThroughManager?: any) {
    const instance = new CaptureApiHandlers(clickThroughManager);

    // ==================== SCREENSHOT HANDLERS ====================

    ipcMain.handle("interface-capture-screenshot", async (_event, options = {}) => {
      try {
        return await instance.withContentProtection(async () => {
          return await instance.captureAPI.takeScreenshot(options);
        });
      } catch (error: any) {
        console.error('Screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-capture-window-screenshot", async (_event, windowId, options = {}) => {
      try {
        return await instance.withContentProtection(async () => {
          return await instance.captureAPI.takeWindowScreenshot(windowId, options);
        });
      } catch (error: any) {
        console.error('Window screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-capture-area-screenshot", async (_event, area, options = {}) => {
      try {
        return await instance.withContentProtection(async () => {
          return await instance.captureAPI.takeAreaScreenshot(area, options);
        });
      } catch (error: any) {
        console.error('Area screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-get-screenshot-sources", async (_event, includeWindows = true) => {
      try {
        return await instance.captureAPI.getScreenshotSources(includeWindows);
      } catch (error: any) {
        console.error('Get screenshot sources error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-quick-screenshot", async (_event) => {
      console.log('[CaptureAPI] interface-quick-screenshot handler called');
      try {
        const result = await instance.withContentProtection(async () => {
          return await instance.captureAPI.quickScreenshot();
        });
        console.log('[CaptureAPI] quickScreenshot result:', result.success ? 'Success' : 'Failed', result.error || '');
        return result;
      } catch (error: any) {
        console.error('[CaptureAPI] Quick screenshot error:', error);
        return { success: false, error: error.message };
      }
    });

    // ==================== VIDEO RECORDING HANDLERS ====================

    ipcMain.handle("interface-start-video-recording", async (_event, options = {}) => {
      console.log('[CaptureAPI] interface-start-video-recording handler called with options:', options);
      try {
        const result = await instance.withContentProtection(async () => {
          return await instance.captureAPI.startVideoRecording(options);
        });
        console.log('[CaptureAPI] startVideoRecording result:', result.success ? 'Success' : 'Failed', result.error || '');
        return result;
      } catch (error: any) {
        console.error('[CaptureAPI] Start video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-stop-video-recording", async (_event) => {
      console.log('[CaptureAPI] interface-stop-video-recording handler called');
      try {
        const result = await instance.captureAPI.stopVideoRecording();
        console.log('[CaptureAPI] stopVideoRecording result:', result.success ? 'Success' : 'Failed', result.error || '');
        return result;
      } catch (error: any) {
        console.error('[CaptureAPI] Stop video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-pause-video-recording", async (_event) => {
      try {
        return instance.captureAPI.pauseVideoRecording();
      } catch (error: any) {
        console.error('[CaptureAPI] Pause video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-resume-video-recording", async (_event) => {
      try {
        return instance.captureAPI.resumeVideoRecording();
      } catch (error: any) {
        console.error('[CaptureAPI] Resume video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-get-video-recording-state", async (_event) => {
      try {
        return {
          success: true,
          state: instance.captureAPI.getVideoRecordingState()
        };
      } catch (error: any) {
        console.error('[CaptureAPI] Get video recording state error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-get-video-recording-duration", async (_event) => {
      try {
        return {
          success: true,
          duration: instance.captureAPI.getVideoRecordingDuration()
        };
      } catch (error: any) {
        console.error('[CaptureAPI] Get video recording duration error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-start-area-video-recording", async (_event, area, options = {}) => {
      console.log('[CaptureAPI] interface-start-area-video-recording handler called');
      try {
        const result = await instance.withContentProtection(async () => {
          return await instance.captureAPI.startAreaVideoRecording(area, options);
        });
        return result;
      } catch (error: any) {
        console.error('[CaptureAPI] Start area video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-get-video-sources", async (_event, includeWindows = true) => {
      try {
        return await instance.captureAPI.getVideoSources(includeWindows);
      } catch (error: any) {
        console.error('[CaptureAPI] Get video sources error:', error);
        return { success: false, error: error.message };
      }
    });

    // ==================== SUPPORT CHECK HANDLER ====================

    ipcMain.handle("interface-check-capture-support", async (_event) => {
      try {
        return CaptureAPI.checkSupport();
      } catch (error: any) {
        console.error('Check capture support error:', error);
        return { screenshot: false, videoRecording: false, audioRecording: false, desktopCapturer: false };
      }
    });
  }
}

export { CaptureApiHandlers };
module.exports = { CaptureApiHandlers };


