/**
 * Screen Capture API - Main Entry Point
 * Provides a unified interface for screenshot, video, and audio capture
 */

const ScreenshotCapture = require('./handlers/screenshot');
const VideoRecorder = require('./handlers/video-recorder');
const AudioRecorder = require('./handlers/audio-recorder');
const MediaUtils = require('./utils/media-utils');
const CaptureBase = require('./utils/capture-base');

class CaptureAPI {
    constructor() {
        this.screenshotCapture = new ScreenshotCapture();
        this.activeRecorders = new Map(); // Track active recordings by ID
        this.recordingCounter = 0;
    }

    // ==================== SCREENSHOT METHODS ====================

    /**
     * Take a screenshot of the primary screen
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    async takeScreenshot(options = {}) {
        return this.screenshotCapture.captureScreen(options);
    }

    /**
     * Take a screenshot of a specific window
     * @param {string} windowId - Window source ID
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    async takeWindowScreenshot(windowId, options = {}) {
        return this.screenshotCapture.captureWindow(windowId, options);
    }

    /**
     * Take a screenshot of a specific area
     * @param {Object} area - Area coordinates {x, y, width, height}
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    async takeAreaScreenshot(area, options = {}) {
        return this.screenshotCapture.captureArea(area, options);
    }

    /**
     * Take screenshots of all screens
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Multiple screenshots result
     */
    async takeAllScreenshots(options = {}) {
        return this.screenshotCapture.captureAllScreens(options);
    }

    /**
     * Get available sources for screenshots
     * @param {boolean} includeWindows - Include window sources
     * @returns {Promise<Object>} Available sources
     */
    async getScreenshotSources(includeWindows = true) {
        return this.screenshotCapture.getAvailableSources(includeWindows);
    }

    // ==================== VIDEO RECORDING METHODS ====================

    /**
     * Start video recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Recording start result with recording ID
     */
    async startVideoRecording(options = {}) {
        const recordingId = `video_${++this.recordingCounter}`;
        const recorder = new VideoRecorder(options);
        
        // Set up progress callback if provided
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

    /**
     * Stop video recording
     * @param {string} recordingId - Recording ID from start method
     * @returns {Promise<Object>} Recording stop result with video file
     */
    async stopVideoRecording(recordingId) {
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

    /**
     * Pause video recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Pause result
     */
    pauseVideoRecording(recordingId) {
        const recording = this.activeRecorders.get(recordingId);
        
        if (!recording || recording.type !== 'video') {
            return {
                success: false,
                error: 'No active video recording found with that ID'
            };
        }
        
        return recording.recorder.pause();
    }

    /**
     * Resume video recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Resume result
     */
    resumeVideoRecording(recordingId) {
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

    /**
     * Start audio recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Recording start result with recording ID
     */
    async startAudioRecording(options = {}) {
        const recordingId = `audio_${++this.recordingCounter}`;
        const recorder = new AudioRecorder(options);
        
        // Set up callbacks if provided
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

    /**
     * Stop audio recording
     * @param {string} recordingId - Recording ID from start method
     * @returns {Promise<Object>} Recording stop result with audio file
     */
    async stopAudioRecording(recordingId) {
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

    /**
     * Pause audio recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Pause result
     */
    pauseAudioRecording(recordingId) {
        const recording = this.activeRecorders.get(recordingId);
        
        if (!recording || recording.type !== 'audio') {
            return {
                success: false,
                error: 'No active audio recording found with that ID'
            };
        }
        
        return recording.recorder.pause();
    }

    /**
     * Resume audio recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Resume result
     */
    resumeAudioRecording(recordingId) {
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

    /**
     * Get status of a recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Recording status
     */
    getRecordingStatus(recordingId) {
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

    /**
     * Get all active recordings
     * @returns {Array} List of active recordings
     */
    getActiveRecordings() {
        const recordings = [];
        
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

    /**
     * Stop all active recordings
     * @returns {Promise<Array>} Results of stopping all recordings
     */
    async stopAllRecordings() {
        const results = [];
        const recordingIds = Array.from(this.activeRecorders.keys());
        
        for (const recordingId of recordingIds) {
            const recording = this.activeRecorders.get(recordingId);
            
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
            } catch (error) {
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

    /**
     * Quick screenshot capture
     * @returns {Promise<Object>} Screenshot result
     */
    async quickScreenshot() {
        return this.screenshotCapture.quickCapture();
    }

    /**
     * Record screen with default settings
     * @param {number} durationSeconds - Recording duration in seconds (optional)
     * @returns {Promise<Object>} Recording result
     */
    async recordScreen(durationSeconds = null) {
        const startResult = await this.startVideoRecording({
            quality: 'medium',
            includeAudio: true
        });
        
        if (!startResult.success) {
            return startResult;
        }
        
        // If duration specified, auto-stop after duration
        if (durationSeconds) {
            const recording = this.activeRecorders.get(startResult.recordingId);
            if (recording) {
                recording.autoStopTimeout = setTimeout(() => {
                    this.stopVideoRecording(startResult.recordingId)
                        .catch(error => console.error('Auto-stop recording failed:', error));
                }, durationSeconds * 1000);
            }
        }
        
        return startResult;
    }

    /**
     * Record audio with default settings
     * @param {number} durationSeconds - Recording duration in seconds (optional)
     * @returns {Promise<Object>} Recording result
     */
    async recordAudio(durationSeconds = null) {
        const startResult = await this.startAudioRecording({
            source: 'microphone',
            quality: 'medium'
        });
        
        if (!startResult.success) {
            return startResult;
        }
        
        // If duration specified, auto-stop after duration
        if (durationSeconds) {
            const recording = this.activeRecorders.get(startResult.recordingId);
            if (recording) {
                recording.autoStopTimeout = setTimeout(() => {
                    this.stopAudioRecording(startResult.recordingId)
                        .catch(error => console.error('Auto-stop recording failed:', error));
                }, durationSeconds * 1000);
            }
        }
        
        return startResult;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Check if capture capabilities are supported
     * @returns {Object} Support status for different capture types
     */
    static checkSupport() {
        return {
            screenshot: ScreenshotCapture.isSupported(),
            videoRecording: VideoRecorder.isSupported(),
            audioRecording: AudioRecorder.isSupported(),
            desktopCapturer: CaptureBase.isSupported()
        };
    }

    /**
     * Get available quality presets
     * @returns {Object} Available quality options
     */
    static getQualityPresets() {
        return {
            video: VideoRecorder.getAvailableQualities(),
            audio: ['low', 'medium', 'high']
        };
    }

    /**
     * Get supported formats
     * @returns {Object} Supported formats for each media type
     */
    static getSupportedFormats() {
        return {
            video: VideoRecorder.getSupportedFormats(),
            audio: AudioRecorder.getSupportedFormats(),
            image: ['image/png', 'image/jpeg', 'image/webp']
        };
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        // Stop all active recordings and clear timeouts
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

// Main API class
CaptureAPI.ScreenshotCapture = ScreenshotCapture;
CaptureAPI.VideoRecorder = VideoRecorder;
CaptureAPI.AudioRecorder = AudioRecorder;
CaptureAPI.MediaUtils = MediaUtils;
CaptureAPI.CaptureBase = CaptureBase;

module.exports = CaptureAPI;
