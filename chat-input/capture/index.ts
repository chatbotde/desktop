/**
 * Screen Capture API - Main Entry Point (TypeScript)
 * Provides a unified interface for screenshot, video, and audio capture
 */

import ScreenshotCapture from './handlers/screenshot';
// Note: video-recorder and audio-recorder will be migrated next
const VideoRecorder = require('./handlers/video-recorder');
const AudioRecorder = require('./handlers/audio-recorder');
import MediaUtils from './utils/media-utils';
import CaptureBase from './utils/capture-base';

import {
  ActiveRecording,
  ScreenshotOptions,
  ScreenshotResult,
  VideoRecordingOptions,
  VideoRecordingResult,
  AudioRecordingOptions,
  AudioRecordingResult,
  RecordingStatus,
  SupportStatus,
  QualityPresets,
  SupportedFormats
} from './types/capture.types';

class CaptureAPI {
  private screenshotCapture: ScreenshotCapture;
  private activeRecorders: Map<string, ActiveRecording>;
  private recordingCounter: number;

  constructor() {
    this.screenshotCapture = new ScreenshotCapture();
    this.activeRecorders = new Map();
    this.recordingCounter = 0;
  }

  // ==================== SCREENSHOT METHODS ====================

  async takeScreenshot(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureScreen(options);
  }

  async takeWindowScreenshot(windowId: string, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.screenshotCapture.captureWindow(windowId, options);
  }

  async takeAreaScreenshot(area: any, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
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
    const recordingId = `video_${++this.recordingCounter}`;
    const recorder = new VideoRecorder(options);
    
    if (options.onProgress) {
      recorder.setProgressCallback(options.onProgress);
    }
    
    const result = await recorder.start(options);
    
    if (result.success) {
      this.activeRecorders.set(recordingId, {
        type: 'video',
        recorder,
        startTime: Date.now()
      });
      
      result.recordingId = recordingId;
    }
    
    return result;
  }

  async stopVideoRecording(recordingId: string): Promise<VideoRecordingResult> {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'video') {
      return {
        success: false,
        error: 'No active video recording found with that ID'
      };
    }
    
    const result = await recording.recorder.stop();
    this.activeRecorders.delete(recordingId);
    
    return result;
  }

  pauseVideoRecording(recordingId: string): any {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'video') {
      return {
        success: false,
        error: 'No active video recording found with that ID'
      };
    }
    
    return recording.recorder.pause();
  }

  resumeVideoRecording(recordingId: string): any {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'video') {
      return {
        success: false,
        error: 'No active video recording found with that ID'
      };
    }
    
    return recording.recorder.resume();
  }

  // ==================== AUDIO RECORDING METHODS ====================

  async startAudioRecording(options: AudioRecordingOptions = {}): Promise<AudioRecordingResult> {
    const recordingId = `audio_${++this.recordingCounter}`;
    const recorder = new AudioRecorder(options);
    
    if (options.onProgress) {
      recorder.setProgressCallback(options.onProgress);
    }
    if (options.onVolumeChange) {
      recorder.setVolumeCallback(options.onVolumeChange);
    }
    
    const result = await recorder.start(options);
    
    if (result.success) {
      this.activeRecorders.set(recordingId, {
        type: 'audio',
        recorder,
        startTime: Date.now()
      });
      
      result.recordingId = recordingId;
    }
    
    return result;
  }

  async stopAudioRecording(recordingId: string): Promise<AudioRecordingResult> {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'audio') {
      return {
        success: false,
        error: 'No active audio recording found with that ID'
      };
    }
    
    const result = await recording.recorder.stop();
    this.activeRecorders.delete(recordingId);
    
    return result;
  }

  pauseAudioRecording(recordingId: string): any {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'audio') {
      return {
        success: false,
        error: 'No active audio recording found with that ID'
      };
    }
    
    return recording.recorder.pause();
  }

  resumeAudioRecording(recordingId: string): any {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording || recording.type !== 'audio') {
      return {
        success: false,
        error: 'No active audio recording found with that ID'
      };
    }
    
    return recording.recorder.resume();
  }

  // ==================== GENERAL RECORDING METHODS ====================

  getRecordingStatus(recordingId: string): RecordingStatus {
    const recording = this.activeRecorders.get(recordingId);
    
    if (!recording) {
      return {
        exists: false,
        error: 'Recording not found'
      };
    }
    
    const status = recording.recorder.getStatus();
    return {
      exists: true,
      type: recording.type,
      startTime: recording.startTime,
      ...status
    };
  }

  getRecorder(recordingId: string): any | null {
    const recording = this.activeRecorders.get(recordingId);
    return recording ? recording.recorder : null;
  }

  getActiveRecordings(): any[] {
    const recordings: any[] = [];
    
    for (const [recordingId, recording] of this.activeRecorders.entries()) {
      recordings.push({
        id: recordingId,
        type: recording.type,
        startTime: recording.startTime,
        status: recording.recorder.getStatus()
      });
    }
    
    return recordings;
  }

  async stopAllRecordings(): Promise<any[]> {
    const results: any[] = [];
    const recordingIds = Array.from(this.activeRecorders.keys());
    
    for (const recordingId of recordingIds) {
      const recording = this.activeRecorders.get(recordingId);
      
      if (!recording) continue;
      
      try {
        let result;
        if (recording.type === 'video') {
          result = await this.stopVideoRecording(recordingId);
        } else if (recording.type === 'audio') {
          result = await this.stopAudioRecording(recordingId);
        }
        
        results.push({
          recordingId,
          type: recording.type,
          result
        });
      } catch (error: any) {
        results.push({
          recordingId,
          type: recording.type,
          result: {
            success: false,
            error: error.message
          }
        });
      }
    }
    
    return results;
  }

  // ==================== CONVENIENCE METHODS ====================

  async quickScreenshot(): Promise<ScreenshotResult> {
    return this.screenshotCapture.quickCapture();
  }

  async recordScreen(durationSeconds: number | null = null): Promise<VideoRecordingResult> {
    const startResult = await this.startVideoRecording({
      quality: 'medium',
      includeAudio: true
    });
    
    if (!startResult.success || !startResult.recordingId) {
      return startResult;
    }
    
    if (durationSeconds) {
      const recording = this.activeRecorders.get(startResult.recordingId);
      if (recording) {
        recording.autoStopTimeout = setTimeout(() => {
          this.stopVideoRecording(startResult.recordingId!)
            .catch(error => console.error('Auto-stop recording failed:', error));
        }, durationSeconds * 1000);
      }
    }
    
    return startResult;
  }

  async recordAudio(durationSeconds: number | null = null): Promise<AudioRecordingResult> {
    const startResult = await this.startAudioRecording({
      source: 'microphone',
      quality: 'medium'
    });
    
    if (!startResult.success || !startResult.recordingId) {
      return startResult;
    }
    
    if (durationSeconds) {
      const recording = this.activeRecorders.get(startResult.recordingId);
      if (recording) {
        recording.autoStopTimeout = setTimeout(() => {
          this.stopAudioRecording(startResult.recordingId!)
            .catch(error => console.error('Auto-stop recording failed:', error));
        }, durationSeconds * 1000);
      }
    }
    
    return startResult;
  }

  // ==================== UTILITY METHODS ====================

  static checkSupport(): SupportStatus {
    return {
      screenshot: ScreenshotCapture.isSupported(),
      videoRecording: VideoRecorder.isSupported(),
      audioRecording: AudioRecorder.isSupported(),
      desktopCapturer: CaptureBase.isSupported()
    };
  }

  static getQualityPresets(): QualityPresets {
    return {
      video: VideoRecorder.getAvailableQualities(),
      audio: ['low', 'medium', 'high']
    };
  }

  static getSupportedFormats(): SupportedFormats {
    return {
      video: VideoRecorder.getSupportedFormats(),
      audio: AudioRecorder.getSupportedFormats(),
      image: ['image/png', 'image/jpeg', 'image/webp']
    };
  }

  cleanup(): void {
    for (const [recordingId, recording] of this.activeRecorders.entries()) {
      try {
        if (recording.autoStopTimeout) {
          clearTimeout(recording.autoStopTimeout);
        }
        recording.recorder.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup recording ${recordingId}:`, error);
      }
    }
    
    this.activeRecorders.clear();
    this.recordingCounter = 0;
  }
}

// ==================== EXPORTS ====================

// Attach sub-classes to main API
(CaptureAPI as any).ScreenshotCapture = ScreenshotCapture;
(CaptureAPI as any).VideoRecorder = VideoRecorder;
(CaptureAPI as any).AudioRecorder = AudioRecorder;
(CaptureAPI as any).MediaUtils = MediaUtils;
(CaptureAPI as any).CaptureBase = CaptureBase;

export default CaptureAPI;
module.exports = CaptureAPI;
