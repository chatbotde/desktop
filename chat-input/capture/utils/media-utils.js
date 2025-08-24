/**
 * Media Utilities for Screen Capture API
 * Handles file validation, conversion, and optimization
 */

class MediaUtils {
    // Media type constants
    static MediaType = {
        IMAGE: 'image',
        VIDEO: 'video',
        AUDIO: 'audio'
    };

    // Supported file formats
    static SupportedFormats = {
        image: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
        video: ['webm', 'mp4', 'mov'],
        audio: ['webm', 'mp3', 'wav', 'ogg']
    };

    // MIME type mappings
    static MimeTypes = {
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
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    static validateFile(file) {
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
     * @param {string} mimeType - MIME type
     * @returns {string|null} Media type
     */
    static getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) return this.MediaType.IMAGE;
        if (mimeType.startsWith('video/')) return this.MediaType.VIDEO;
        if (mimeType.startsWith('audio/')) return this.MediaType.AUDIO;
        return null;
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create a media file object from File or Blob
     * @param {File|Blob} file - Source file
     * @param {string} source - Source identifier
     * @returns {Promise<Object>} Media file object
     */
    static async createMediaFile(file, source = 'upload') {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Convert to base64 data URL
        const dataUrl = await this.fileToDataURL(file);
        
        // Get file dimensions for images/videos
        let dimensions = null;
        if (validation.mediaType === this.MediaType.IMAGE) {
            dimensions = await this.getImageDimensions(dataUrl);
        } else if (validation.mediaType === this.MediaType.VIDEO) {
            dimensions = await this.getVideoDimensions(dataUrl);
        }

        // Get duration for audio/video
        let duration = null;
        if (validation.mediaType === this.MediaType.VIDEO || validation.mediaType === this.MediaType.AUDIO) {
            duration = await this.getMediaDuration(dataUrl, validation.mediaType);
        }

        return {
            name: file.name || `captured-${Date.now()}.${this.getExtensionFromMime(file.type)}`,
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
     * @param {File|Blob} file - File to convert
     * @returns {Promise<string>} Data URL
     */
    static fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get image dimensions
     * @param {string} dataUrl - Image data URL
     * @returns {Promise<Object>} Dimensions {width, height}
     */
    static getImageDimensions(dataUrl) {
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
     * @param {string} dataUrl - Video data URL
     * @returns {Promise<Object>} Dimensions {width, height}
     */
    static getVideoDimensions(dataUrl) {
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
     * @param {string} dataUrl - Media data URL
     * @param {string} mediaType - Media type
     * @returns {Promise<number>} Duration in seconds
     */
    static getMediaDuration(dataUrl, mediaType) {
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
            element.muted = true;
            element.style.display = 'none';
            document.body.appendChild(element);
        });
    }

    /**
     * Get file extension from MIME type
     * @param {string} mimeType - MIME type
     * @returns {string} File extension
     */
    static getExtensionFromMime(mimeType) {
        const mimeToExt = Object.entries(this.MimeTypes)
            .find(([ext, mime]) => mime === mimeType);
        return mimeToExt ? mimeToExt[0] : 'bin';
    }

    /**
     * Create a screenshot file object
     * @param {Buffer} buffer - PNG buffer
     * @param {string} name - File name
     * @returns {Object} Screenshot file object
     */
    static createScreenshotFile(buffer, name = null) {
        const fileName = name || `screenshot-${Date.now()}.png`;
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Data}`;

        return {
            name: fileName,
            type: 'image/png',
            size: buffer.length,
            data: dataUrl,
            mediaType: this.MediaType.IMAGE,
            source: 'screenshot',
            timestamp: Date.now()
        };
    }

    /**
     * Optimize image for web
     * @param {string} dataUrl - Image data URL
     * @param {Object} options - Optimization options
     * @returns {Promise<string>} Optimized data URL
     */
    static async optimizeImage(dataUrl, options = {}) {
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
                ctx.drawImage(img, 0, 0, width, height);
                const optimizedDataUrl = canvas.toDataURL(format, quality);
                
                resolve(optimizedDataUrl);
            };

            img.onerror = () => resolve(dataUrl); // Return original on error
            img.src = dataUrl;
        });
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaUtils;
} else if (typeof window !== 'undefined') {
    window.MediaUtils = MediaUtils;
}
