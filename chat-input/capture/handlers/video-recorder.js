/**
 * Video Recording Handler
 * Handles screen video recording using Electron's desktopCapturer and MediaRecorder
 */

const CaptureBase = require('../utils/capture-base');

class VideoRecorder extends CaptureBase {
    constructor(options = {}) {
        super();
        
        this.options = {
            quality: 'medium',
            includeAudio: true,
            frameRate: 30,
            videoBitsPerSecond: 2000000,
            audioBitsPerSecond: 128000,
            ...options
        };
        
        this.startTime = null;
        this.recordingTimer = null;
        this.onProgress = null;
    }

    /**
     * Start video recording
     * @param {Object} recordingOptions - Recording options
     * @returns {Promise<Object>} Recording start result
     */
    async start(recordingOptions = {}) {
        if (this.isCapturing) {
            throw new Error('Recording already in progress');
        }

        const options = { ...this.options, ...recordingOptions };
        
        try {
            // Get desktop source
            const source = await this.getPrimaryScreenSource();
            
            // Create video stream with audio
            const stream = await this.createMediaStream(source.id, {
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: source.id,
                        ...this.getQualityPresets(options.quality).video.mandatory
                    }
                },
                audio: options.includeAudio ? {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                } : false
            });

            // Create media recorder
            const recorder = this.createMediaRecorder(stream, {
                mimeType: this.getSupportedMimeType('video/webm;codecs=vp9,opus'),
                videoBitsPerSecond: options.videoBitsPerSecond,
                audioBitsPerSecond: options.audioBitsPerSecond
            });

            // Set up event handlers
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                this.stopRecordingTimer();
                this.isCapturing = false;
            };

            recorder.onerror = (event) => {
                console.error('Recording error:', event.error);
                this.cleanup();
            };

            // Start recording
            recorder.start(1000); // Collect data every second
            this.isCapturing = true;
            this.startTime = Date.now();
            this.startRecordingTimer();

            return {
                success: true,
                message: 'Video recording started',
                sourceInfo: {
                    id: source.id,
                    name: source.name
                },
                settings: {
                    quality: options.quality,
                    includeAudio: options.includeAudio,
                    mimeType: recorder.mimeType
                }
            };

        } catch (error) {
            console.error('Failed to start video recording:', error);
            this.cleanup();
            return {
                success: false,
                error: error.message || 'Failed to start video recording'
            };
        }
    }

    /**
     * Stop video recording
     * @returns {Promise<Object>} Recording stop result with video file
     */
    async stop() {
        if (!this.isCapturing || !this.mediaRecorder) {
            throw new Error('No recording in progress');
        }

        return new Promise((resolve) => {
            // Set up stop handler
            this.mediaRecorder.onstop = async () => {
                try {
                    const duration = (Date.now() - this.startTime) / 1000;
                    const blob = this.createBlobFromChunks();
                    
                    // Convert blob to media file
                    const file = new File([blob], `recording-${Date.now()}.webm`, {
                        type: blob.type
                    });

                    // Create media file object using MediaUtils
                    const MediaUtils = require('../utils/media-utils');
                    const mediaFile = await MediaUtils.createMediaFile(file, 'screen-recording');
                    
                    // Add duration and additional metadata
                    mediaFile.duration = duration;
                    mediaFile.recordingInfo = {
                        startTime: this.startTime,
                        endTime: Date.now(),
                        quality: this.options.quality,
                        includeAudio: this.options.includeAudio
                    };

                    this.cleanup();

                    resolve({
                        success: true,
                        video: mediaFile,
                        metadata: {
                            duration,
                            size: mediaFile.size,
                            quality: this.options.quality
                        }
                    });

                } catch (error) {
                    console.error('Error processing recorded video:', error);
                    this.cleanup();
                    resolve({
                        success: false,
                        error: 'Failed to process recorded video: ' + error.message
                    });
                }
            };

            // Stop the recording
            this.mediaRecorder.stop();
            this.stopMediaStream();
        });
    }

    /**
     * Pause video recording
     * @returns {Object} Pause result
     */
    pause() {
        if (!this.isCapturing || !this.mediaRecorder) {
            return { success: false, error: 'No recording in progress' };
        }

        try {
            if (this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.pause();
                this.stopRecordingTimer();
                return { success: true, message: 'Recording paused' };
            }
            return { success: false, error: 'Recording not in recordable state' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Resume video recording
     * @returns {Object} Resume result
     */
    resume() {
        if (!this.isCapturing || !this.mediaRecorder) {
            return { success: false, error: 'No recording in progress' };
        }

        try {
            if (this.mediaRecorder.state === 'paused') {
                this.mediaRecorder.resume();
                this.startRecordingTimer();
                return { success: true, message: 'Recording resumed' };
            }
            return { success: false, error: 'Recording not paused' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current recording status
     * @returns {Object} Recording status
     */
    getStatus() {
        return {
            isRecording: this.isCapturing,
            state: this.mediaRecorder ? this.mediaRecorder.state : 'inactive',
            duration: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
            chunksCount: this.recordedChunks.length,
            dataSize: this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0)
        };
    }

    /**
     * Start recording timer for progress updates
     */
    startRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }

        this.recordingTimer = setInterval(() => {
            if (this.isCapturing && this.startTime && this.onProgress) {
                const duration = (Date.now() - this.startTime) / 1000;
                this.onProgress({
                    duration,
                    chunksCount: this.recordedChunks.length,
                    dataSize: this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0)
                });
            }
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    /**
     * Set progress callback
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        super.cleanup();
        this.stopRecordingTimer();
        this.startTime = null;
        this.onProgress = null;
    }

    /**
     * Check if video recording is supported
     * @returns {boolean} Support status
     */
    static isSupported() {
        return CaptureBase.isSupported() && typeof MediaRecorder !== 'undefined';
    }

    /**
     * Get available recording qualities
     * @returns {Array} Available quality options
     */
    static getAvailableQualities() {
        return ['low', 'medium', 'high'];
    }

    /**
     * Get supported video formats
     * @returns {Array} Supported MIME types
     */
    static getSupportedFormats() {
        const formats = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4'
        ];

        return formats.filter(format => 
            typeof MediaRecorder !== 'undefined' && 
            MediaRecorder.isTypeSupported(format)
        );
    }
}

module.exports = VideoRecorder;
