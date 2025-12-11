/**
 * Base Capture Utilities
 * Common functionality for all capture types
 */

import { desktopCapturer } from 'electron';
import { DesktopSource, DesktopSourceOptions } from '../types/capture.types';

// DOM types for MediaStream and MediaRecorder
declare global {
  interface MediaStream {}
  interface MediaRecorder {}
}

class CaptureBase {
  protected isCapturing: boolean = false;
  protected currentStream: any = null; // MediaStream type
  protected mediaRecorder: any = null; // MediaRecorder type
  protected recordedChunks: Blob[] = [];

  /**
   * Get available desktop sources
   */
  async getDesktopSources(options: DesktopSourceOptions = {}): Promise<DesktopSource[]> {
    const {
      types = ['screen', 'window'],
      thumbnailSize = { width: 150, height: 150 },
      fetchWindowIcons = false
    } = options;

    const sources = await desktopCapturer.getSources({
      types,
      thumbnailSize,
      fetchWindowIcons
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      display_id: source.display_id,
      thumbnail: source.thumbnail,
      appIcon: source.appIcon
    }));
  }

  /**
   * Get primary screen source
   */
  async getPrimaryScreenSource(): Promise<DesktopSource> {
    const sources = await this.getDesktopSources({ 
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // Return the primary screen (usually the first one)
    return sources[0];
  }

  /**
   * Stop current media stream
   */
  stopMediaStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track: any) => track.stop());
      this.currentStream = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMediaStream();
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isCapturing = false;
  }

  /**
   * Check if screen capture is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof require !== 'undefined' &&
      desktopCapturer
    );
  }
}

export default CaptureBase;
module.exports = CaptureBase;

