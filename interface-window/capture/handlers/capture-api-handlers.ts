/**
 * Capture API IPC handlers for Interface Window
 */

import { ipcMain } from 'electron';
import CaptureAPI from '../index';

class CaptureApiHandlers {
  private captureAPI: CaptureAPI;

  constructor() {
    this.captureAPI = new CaptureAPI();
  }

  static registerHandlers() {
    const instance = new CaptureApiHandlers();

    // Screenshot handlers
    ipcMain.handle("interface-capture-screenshot", async (_event, options = {}) => {
      try {
        return await instance.captureAPI.takeScreenshot(options);
      } catch (error: any) {
        console.error('Screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-capture-window-screenshot", async (_event, windowId, options = {}) => {
      try {
        return await instance.captureAPI.takeWindowScreenshot(windowId, options);
      } catch (error: any) {
        console.error('Window screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("interface-capture-area-screenshot", async (_event, area, options = {}) => {
      try {
        return await instance.captureAPI.takeAreaScreenshot(area, options);
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
        const result = await instance.captureAPI.quickScreenshot();
        console.log('[CaptureAPI] quickScreenshot result:', result.success ? 'Success' : 'Failed', result.error || '');
        return result;
      } catch (error: any) {
        console.error('[CaptureAPI] Quick screenshot error:', error);
        return { success: false, error: error.message };
      }
    });

    // Support check handler
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

