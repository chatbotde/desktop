/**
 * Screenshot Capture Handler
 * Handles desktop and window screenshot capture using Electron's desktopCapturer
 */

import { desktopCapturer, screen } from 'electron';
import CaptureBase from '../utils/capture-base';
import {
  ScreenshotOptions,
  ScreenshotResult,
  SourcesResult,
  SelectionArea,
  MediaDimensions
} from '../types/capture.types';

class ScreenshotCapture extends CaptureBase {
  private captureOptions: {
    format: string;
    quality: number;
    thumbnailSize: MediaDimensions;
  };

  constructor() {
    super();
    this.captureOptions = {
      format: 'png',
      quality: 1.0,
      thumbnailSize: { width: 1920, height: 1080 }
    };
  }

  /**
   * Capture screenshot of primary display
   */
  async captureScreen(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    const { 
      sourceId = null,
      format = 'png',
      quality = 1.0,
      name = null
    } = options;

    try {
      let source;
      
      if (sourceId) {
        // Use specific source
        const sources = await this.getDesktopSources({
          types: ['screen', 'window'],
          thumbnailSize: this.captureOptions.thumbnailSize
        });
        source = sources.find(s => s.id === sourceId);
        if (!source) {
          throw new Error('Specified source not found');
        }
      } else {
        // Use primary screen
        source = await this.getPrimaryScreenSource();
      }

      // Get high-resolution thumbnail for screenshot
      const highResSources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 2560, height: 1440 }
      });

      const highResSource = highResSources.find(s => s.id === source.id) || source;
      
      if (!highResSource.thumbnail) {
        throw new Error('Failed to capture screenshot: no thumbnail available');
      }

      // Convert thumbnail to PNG buffer (Electron's NativeImage)
      const screenshotBuffer = highResSource.thumbnail.toPNG();
      
      // Create screenshot file object
      const fileName = name || `screenshot-${Date.now()}.png`;
      const base64Data = screenshotBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Data}`;

      return {
        success: true,
        screenshot: {
          name: fileName,
          type: 'image/png',
          size: screenshotBuffer.length,
          data: dataUrl,
          source: 'screenshot',
          dimensions: {
            width: highResSource.thumbnail.getSize().width,
            height: highResSource.thumbnail.getSize().height
          },
          timestamp: Date.now(),
          sourceInfo: {
            id: source.id,
            name: source.name,
            displayId: source.display_id
          }
        }
      };

    } catch (error: any) {
      console.error('Screenshot capture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to capture screenshot'
      };
    }
  }

  /**
   * Capture screenshot of specific window
   */
  async captureWindow(windowId: string, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    return this.captureScreen({ 
      sourceId: windowId, 
      ...options 
    });
  }

  /**
   * Capture screenshot of all screens
   */
  async captureAllScreens(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    try {
      const sources = await this.getDesktopSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const screenshots: any[] = [];
      
      for (const source of sources) {
        const result = await this.captureScreen({ 
          sourceId: source.id, 
          ...options 
        });
        
        if (result.success && result.screenshot) {
          screenshots.push(result.screenshot);
        }
      }

      return {
        success: true,
        screenshots,
        count: screenshots.length
      };

    } catch (error: any) {
      console.error('Multi-screen capture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to capture all screens'
      };
    }
  }

  /**
   * Get available sources for screenshot capture
   */
  async getAvailableSources(includeWindows: boolean = true): Promise<SourcesResult> {
    try {
      const types: Array<'screen' | 'window'> = includeWindows ? ['screen', 'window'] : ['screen'];
      const sources = await this.getDesktopSources({
        types,
        thumbnailSize: { width: 150, height: 150 },
        fetchWindowIcons: includeWindows
      });

      return {
        success: true,
        sources: sources.map(source => ({
          id: source.id,
          name: source.name,
          type: source.id.startsWith('screen:') ? 'screen' : 'window',
          displayId: source.display_id,
          thumbnail: source.thumbnail,
          icon: source.appIcon
        }))
      };

    } catch (error: any) {
      console.error('Get sources error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get available sources'
      };
    }
  }

  /**
   * Capture screenshot with selection area
   */
  async captureArea(area: SelectionArea, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    try {
      // Get high-resolution screenshot of primary screen
      const sources = await this.getDesktopSources({
        types: ['screen'],
        thumbnailSize: { width: 3840, height: 2160 } // High resolution for quality
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const source = sources[0]; // Primary screen
      if (!source.thumbnail) {
        throw new Error('Failed to capture screenshot: no thumbnail available');
      }

      // Get the full screenshot as NativeImage
      const fullImage = source.thumbnail;
      const fullSize = fullImage.getSize();
      
      // Calculate scale factor between captured size and actual screen size
      const display = screen.getPrimaryDisplay();
      const screenSize = display.size;
      const scaleX = fullSize.width / screenSize.width;
      const scaleY = fullSize.height / screenSize.height;
      
      // Scale the area coordinates to match the captured image size
      const scaledArea = {
        x: Math.round(area.x * scaleX),
        y: Math.round(area.y * scaleY),
        width: Math.round(area.width * scaleX),
        height: Math.round(area.height * scaleY)
      };
      
      // Crop the image to the selected area
      const croppedImage = fullImage.crop({
        x: scaledArea.x,
        y: scaledArea.y,
        width: scaledArea.width,
        height: scaledArea.height
      });
      
      // Convert cropped image to PNG buffer
      const screenshotBuffer = croppedImage.toPNG();
      const fileName = options.name || `area-screenshot-${Date.now()}.png`;
      const base64Data = screenshotBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Data}`;

      return {
        success: true,
        screenshot: {
          name: fileName,
          type: 'image/png',
          size: screenshotBuffer.length,
          data: dataUrl,
          source: 'area-screenshot',
          dimensions: {
            width: scaledArea.width,
            height: scaledArea.height
          },
          selectionArea: area,
          timestamp: Date.now(),
          sourceInfo: {
            id: source.id,
            name: source.name,
            displayId: source.display_id
          }
        }
      };

    } catch (error: any) {
      console.error('Area screenshot capture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to capture area screenshot'
      };
    }
  }

  /**
   * Quick screenshot capture (convenience method) - optimized for speed
   */
  async quickCapture(): Promise<ScreenshotResult> {
    try {
      // Get primary screen source with reasonable thumbnail size for quick capture
      const sources = await this.getDesktopSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const source = sources[0]; // Primary screen
      if (!source.thumbnail) {
        throw new Error('Failed to capture screenshot: no thumbnail available');
      }

      // Convert thumbnail to PNG buffer (Electron's NativeImage)
      const screenshotBuffer = source.thumbnail.toPNG();

      // Create screenshot file object
      const fileName = `quick-screenshot-${Date.now()}.png`;
      const base64Data = screenshotBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Data}`;

      return {
        success: true,
        screenshot: {
          name: fileName,
          type: 'image/png',
          size: screenshotBuffer.length,
          data: dataUrl,
          source: 'screenshot',
          dimensions: {
            width: source.thumbnail.getSize().width,
            height: source.thumbnail.getSize().height
          },
          timestamp: Date.now(),
          sourceInfo: {
            id: source.id,
            name: source.name,
            displayId: source.display_id
          }
        }
      };

    } catch (error: any) {
      console.error('Quick screenshot capture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to capture screenshot'
      };
    }
  }

  /**
   * Validate screenshot options
   */
  validateOptions(options: ScreenshotOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (options.quality && (options.quality < 0 || options.quality > 1)) {
      errors.push('Quality must be between 0 and 1');
    }
    
    if (options.format && !['png', 'jpg', 'jpeg'].includes(options.format.toLowerCase())) {
      errors.push('Format must be png, jpg, or jpeg');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get screenshot metadata
   */
  getMetadata(screenshot: any): any {
    return {
      name: screenshot.name,
      size: screenshot.size,
      dimensions: screenshot.dimensions,
      format: screenshot.type,
      timestamp: screenshot.timestamp,
      source: screenshot.sourceInfo
    };
  }

  /**
   * Check if screenshot capture is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof require !== 'undefined' &&
      desktopCapturer
    );
  }
}

export default ScreenshotCapture;
module.exports = ScreenshotCapture;
