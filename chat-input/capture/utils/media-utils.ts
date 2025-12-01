/**
 * Media Utilities for Screen Capture API
 * Handles file validation, conversion, and optimization
 */

import { MediaType, FileValidation, MediaFile, ImageOptimizationOptions } from '../types/capture.types';

// Type declarations for Node.js module system
declare const module: any;

class MediaUtils {
  // Media type constants
  static readonly MediaType = {
    IMAGE: 'image' as const,
    VIDEO: 'video' as const,
    AUDIO: 'audio' as const
  };

  // Supported file formats
  static readonly SupportedFormats = {
    image: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    video: ['webm', 'mp4', 'mov'],
    audio: ['webm', 'mp3', 'wav', 'ogg']
  };

  // MIME type mappings
  static readonly MimeTypes: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    
    // Videos
    'webm': 'video/webm',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    
    // Audio
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg'
  };

  /**
   * Validate a file for media capture
   */
  static validateFile(file: File | Blob): FileValidation {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size is ${this.formatFileSize(maxSize)}` 
      };
    }

    // Determine media type
    const mediaType = this.getMediaType(file.type);
    if (!mediaType) {
      return { 
        isValid: false, 
        error: 'Unsupported file type' 
      };
    }

    return { 
      isValid: true, 
      mediaType,
      size: file.size,
      type: file.type
    };
  }

  /**
   * Get media type from MIME type
   */
  static getMediaType(mimeType: string): MediaType | null {
    if (mimeType.startsWith('image/')) return this.MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return this.MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return this.MediaType.AUDIO;
    return null;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create a media file object from File or Blob
   */
  static async createMediaFile(file: File | Blob, source: string = 'upload'): Promise<MediaFile> {
    const validation = this.validateFile(file);
    if (!validation.isValid || !validation.mediaType) {
      throw new Error(validation.error || 'Invalid file');
    }

    // Convert to base64 data URL
    const dataUrl = await this.fileToDataURL(file);
    
    // Get file dimensions for images/videos
    let dimensions: { width: number; height: number } | null = null;
    if (validation.mediaType === this.MediaType.IMAGE) {
      dimensions = await this.getImageDimensions(dataUrl);
    } else if (validation.mediaType === this.MediaType.VIDEO) {
      dimensions = await this.getVideoDimensions(dataUrl);
    }

    // Get duration for audio/video
    let duration: number | null = null;
    if (validation.mediaType === this.MediaType.VIDEO || validation.mediaType === this.MediaType.AUDIO) {
      duration = await this.getMediaDuration(dataUrl, validation.mediaType);
    }

    const fileName = (file as File).name || `captured-${Date.now()}.${this.getExtensionFromMime(file.type)}`;

    return {
      name: fileName,
      type: file.type,
      size: file.size,
      data: dataUrl,
      mediaType: validation.mediaType,
      source,
      dimensions,
      duration,
      timestamp: Date.now()
    };
  }

  /**
   * Convert File/Blob to data URL
   */
  static fileToDataURL(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get image dimensions
   */
  static getImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  /**
   * Get video dimensions
   */
  static getVideoDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
        video.remove();
      };
      video.onerror = () => {
        resolve(null);
        video.remove();
      };
      video.src = dataUrl;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
    });
  }

  /**
   * Get media duration
   */
  static getMediaDuration(dataUrl: string, mediaType: MediaType): Promise<number | null> {
    return new Promise((resolve) => {
      const element = mediaType === this.MediaType.VIDEO 
        ? document.createElement('video')
        : document.createElement('audio');
        
      element.onloadedmetadata = () => {
        resolve(element.duration);
        element.remove();
      };
      element.onerror = () => {
        resolve(null);
        element.remove();
      };
      element.src = dataUrl;
      (element as any).muted = true;
      element.style.display = 'none';
      document.body.appendChild(element);
    });
  }

  /**
   * Get file extension from MIME type
   */
  static getExtensionFromMime(mimeType: string): string {
    const mimeToExt = Object.entries(this.MimeTypes)
      .find(([ext, mime]) => mime === mimeType);
    return mimeToExt ? mimeToExt[0] : 'bin';
  }

  /**
   * Create a screenshot file object
   */
  static createScreenshotFile(buffer: Uint8Array | ArrayBuffer, name: string | null = null): MediaFile {
    const fileName = name || `screenshot-${Date.now()}.png`;
    // Convert buffer to base64
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    const base64Data = btoa(String.fromCharCode(...Array.from(bytes)));
    const dataUrl = `data:image/png;base64,${base64Data}`;

    return {
      name: fileName,
      type: 'image/png',
      size: bytes.length,
      data: dataUrl,
      mediaType: this.MediaType.IMAGE,
      source: 'screenshot',
      timestamp: Date.now()
    };
  }

  /**
   * Optimize image for web
   */
  static async optimizeImage(dataUrl: string, options: ImageOptimizationOptions = {}): Promise<string> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        if (ratio < 1) {
          width *= ratio;
          height *= ratio;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL(format, quality);
        
        resolve(optimizedDataUrl);
      };

      img.onerror = () => resolve(dataUrl); // Return original on error
      img.src = dataUrl;
    });
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = MediaUtils;
}

export default MediaUtils;
