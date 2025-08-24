/**
 * Capture API Preload Script
 * Exposes capture functionality to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose capture API to renderer
contextBridge.exposeInMainWorld('CaptureAPI', {
    // ==================== SCREENSHOT METHODS ====================
    
    /**
     * Take a screenshot
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    takeScreenshot: (options = {}) => {
        return ipcRenderer.invoke('capture-screenshot', options);
    },

    /**
     * Take a screenshot of a specific window
     * @param {string} windowId - Window ID
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    takeWindowScreenshot: (windowId, options = {}) => {
        return ipcRenderer.invoke('capture-window-screenshot', windowId, options);
    },

    /**
     * Get available screenshot sources
     * @param {boolean} includeWindows - Include window sources
     * @returns {Promise<Object>} Available sources
     */
    getScreenshotSources: (includeWindows = true) => {
        return ipcRenderer.invoke('get-screenshot-sources', includeWindows);
    },

    // ==================== VIDEO RECORDING METHODS ====================
    
    /**
     * Start video recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Recording start result
     */
    startVideoRecording: (options = {}) => {
        return ipcRenderer.invoke('start-video-recording', options);
    },

    /**
     * Stop video recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Recording stop result
     */
    stopVideoRecording: (recordingId) => {
        return ipcRenderer.invoke('stop-video-recording', recordingId);
    },

    /**
     * Pause video recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Pause result
     */
    pauseVideoRecording: (recordingId) => {
        return ipcRenderer.invoke('pause-video-recording', recordingId);
    },

    /**
     * Resume video recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Resume result
     */
    resumeVideoRecording: (recordingId) => {
        return ipcRenderer.invoke('resume-video-recording', recordingId);
    },

    // ==================== AUDIO RECORDING METHODS ====================
    
    /**
     * Start audio recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Recording start result
     */
    startAudioRecording: (options = {}) => {
        return ipcRenderer.invoke('start-audio-recording', options);
    },

    /**
     * Stop audio recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Recording stop result
     */
    stopAudioRecording: (recordingId) => {
        return ipcRenderer.invoke('stop-audio-recording', recordingId);
    },

    /**
     * Pause audio recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Pause result
     */
    pauseAudioRecording: (recordingId) => {
        return ipcRenderer.invoke('pause-audio-recording', recordingId);
    },

    /**
     * Resume audio recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Resume result
     */
    resumeAudioRecording: (recordingId) => {
        return ipcRenderer.invoke('resume-audio-recording', recordingId);
    },

    // ==================== GENERAL METHODS ====================
    
    /**
     * Get recording status
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Recording status
     */
    getRecordingStatus: (recordingId) => {
        return ipcRenderer.invoke('get-recording-status', recordingId);
    },

    /**
     * Get all active recordings
     * @returns {Promise<Array>} Active recordings
     */
    getActiveRecordings: () => {
        return ipcRenderer.invoke('get-active-recordings');
    },

    /**
     * Stop all recordings
     * @returns {Promise<Array>} Stop results
     */
    stopAllRecordings: () => {
        return ipcRenderer.invoke('stop-all-recordings');
    },

    /**
     * Check capture support
     * @returns {Promise<Object>} Support status
     */
    checkSupport: () => {
        return ipcRenderer.invoke('check-capture-support');
    },

    /**
     * Get supported formats
     * @returns {Promise<Object>} Supported formats
     */
    getSupportedFormats: () => {
        return ipcRenderer.invoke('get-supported-formats');
    },

    // ==================== CONVENIENCE METHODS ====================
    
    /**
     * Quick screenshot
     * @returns {Promise<Object>} Screenshot result
     */
    quickScreenshot: () => {
        return ipcRenderer.invoke('quick-screenshot');
    },

    /**
     * Record screen for specified duration
     * @param {number} durationSeconds - Duration in seconds
     * @returns {Promise<Object>} Recording result
     */
    recordScreen: (durationSeconds = null) => {
        return ipcRenderer.invoke('record-screen', durationSeconds);
    },

    /**
     * Record audio for specified duration
     * @param {number} durationSeconds - Duration in seconds
     * @returns {Promise<Object>} Recording result
     */
    recordAudio: (durationSeconds = null) => {
        return ipcRenderer.invoke('record-audio', durationSeconds);
    },

    // ==================== EVENT LISTENERS ====================
    
    /**
     * Listen for recording progress updates
     * @param {Function} callback - Progress callback
     */
    onRecordingProgress: (callback) => {
        ipcRenderer.on('recording-progress', (event, data) => {
            callback(data);
        });
    },

    /**
     * Listen for recording volume changes
     * @param {Function} callback - Volume callback
     */
    onVolumeChange: (callback) => {
        ipcRenderer.on('recording-volume', (event, data) => {
            callback(data);
        });
    },

    /**
     * Listen for recording errors
     * @param {Function} callback - Error callback
     */
    onRecordingError: (callback) => {
        ipcRenderer.on('recording-error', (event, data) => {
            callback(data);
        });
    },

    /**
     * Remove all listeners for a specific channel
     * @param {string} channel - Channel name
     */
    removeListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Also expose MediaUtils for frontend use
contextBridge.exposeInMainWorld('MediaUtils', {
    MediaType: {
        IMAGE: 'image',
        VIDEO: 'video',
        AUDIO: 'audio'
    },

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validate file for capture
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile: (file) => {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return { 
                isValid: false, 
                error: `File too large. Maximum size is ${window.MediaUtils.formatFileSize(maxSize)}` 
            };
        }

        // Determine media type
        const mediaType = file.type.startsWith('image/') ? 'image' :
                         file.type.startsWith('video/') ? 'video' :
                         file.type.startsWith('audio/') ? 'audio' : null;
                         
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
    },

    /**
     * Create media file from File/Blob
     * @param {File|Blob} file - Source file
     * @param {string} source - Source identifier
     * @returns {Promise<Object>} Media file object
     */
    createMediaFile: async (file, source = 'upload') => {
        // This would typically use the main process MediaUtils
        // For now, return a basic structure
        const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        return {
            name: file.name || `capture-${Date.now()}`,
            type: file.type,
            size: file.size,
            data: dataUrl,
            mediaType: file.type.split('/')[0],
            source,
            timestamp: Date.now()
        };
    }
});
