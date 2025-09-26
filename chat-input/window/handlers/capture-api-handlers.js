const { BrowserWindow, ipcMain } = require("electron");

/**
 * Advanced Capture API IPC handlers
 */
class CaptureApiHandlers {
  static registerHandlers() {
    // Screenshot handlers
    ipcMain.handle("capture-screenshot", async (event, options = {}) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.takeScreenshot(options);
      } catch (error) {
        console.error('Screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("capture-window-screenshot", async (event, windowId, options = {}) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.takeWindowScreenshot(windowId, options);
      } catch (error) {
        console.error('Window screenshot capture error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("get-screenshot-sources", async (event, includeWindows = true) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.getScreenshotSources(includeWindows);
      } catch (error) {
        console.error('Get screenshot sources error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("quick-screenshot", async (event) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.quickScreenshot();
      } catch (error) {
        console.error('Quick screenshot error:', error);
        return { success: false, error: error.message };
      }
    });

    // Video recording handlers
    ipcMain.handle("start-video-recording", async (event, options = {}) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        // Set up progress callback
        if (options.onProgress) {
          options.onProgress = (data) => {
            event.sender.send('recording-progress', { type: 'video', ...data });
          };
        }
        
        return await instance.captureAPI.startVideoRecording(options);
      } catch (error) {
        console.error('Start video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("stop-video-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopVideoRecording(recordingId);
      } catch (error) {
        console.error('Stop video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("pause-video-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.pauseVideoRecording(recordingId);
      } catch (error) {
        console.error('Pause video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("resume-video-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.resumeVideoRecording(recordingId);
      } catch (error) {
        console.error('Resume video recording error:', error);
        return { success: false, error: error.message };
      }
    });

    // Audio recording handlers
    ipcMain.handle("start-audio-recording", async (event, options = {}) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        // Set up callbacks
        if (options.onProgress) {
          options.onProgress = (data) => {
            event.sender.send('recording-progress', { type: 'audio', ...data });
          };
        }
        if (options.onVolumeChange) {
          options.onVolumeChange = (volume) => {
            event.sender.send('recording-volume', { volume });
          };
        }
        
        return await instance.captureAPI.startAudioRecording(options);
      } catch (error) {
        console.error('Start audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("stop-audio-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopAudioRecording(recordingId);
      } catch (error) {
        console.error('Stop audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("pause-audio-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.pauseAudioRecording(recordingId);
      } catch (error) {
        console.error('Pause audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("resume-audio-recording", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.resumeAudioRecording(recordingId);
      } catch (error) {
        console.error('Resume audio recording error:', error);
        return { success: false, error: error.message };
      }
    });

    // General recording handlers
    ipcMain.handle("get-recording-status", async (event, recordingId) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return instance.captureAPI.getRecordingStatus(recordingId);
      } catch (error) {
        console.error('Get recording status error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("get-active-recordings", async (event) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return [];
        
        return instance.captureAPI.getActiveRecordings();
      } catch (error) {
        console.error('Get active recordings error:', error);
        return [];
      }
    });

    ipcMain.handle("stop-all-recordings", async (event) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.stopAllRecordings();
      } catch (error) {
        console.error('Stop all recordings error:', error);
        return { success: false, error: error.message };
      }
    });

    // Convenience handlers
    ipcMain.handle("record-screen", async (event, durationSeconds = null) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.recordScreen(durationSeconds);
      } catch (error) {
        console.error('Record screen error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("record-audio", async (event, durationSeconds = null) => {
      try {
        const instance = this.getChatInputInstance();
        if (!instance) return { success: false, error: 'Capture API not available' };
        
        return await instance.captureAPI.recordAudio(durationSeconds);
      } catch (error) {
        console.error('Record audio error:', error);
        return { success: false, error: error.message };
      }
    });

    // Support and format handlers
    ipcMain.handle("check-capture-support", async (event) => {
      try {
        const CaptureAPI = require("../../capture");
        return CaptureAPI.checkSupport();
      } catch (error) {
        console.error('Check capture support error:', error);
        return { screenshot: false, videoRecording: false, audioRecording: false };
      }
    });

    ipcMain.handle("get-supported-formats", async (event) => {
      try {
        const CaptureAPI = require("../../capture");
        return CaptureAPI.getSupportedFormats();
      } catch (error) {
        console.error('Get supported formats error:', error);
        return { video: [], audio: [], image: [] };
      }
    });
  }

  /**
   * Helper function to get chat input instance
   */
  static getChatInputInstance() {
    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      if (win.isDestroyed()) continue;
      try {
        // Look for the chat input window by checking its reference
        if (win._chatInputInstance) {
          return win._chatInputInstance;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
}

module.exports = { CaptureApiHandlers };