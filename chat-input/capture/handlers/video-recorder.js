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
            processingEnabled: false,
            processingOptions: {
                brightness: 1.0,
                contrast: 1.0,
                saturate: 1.0,
                blurPx: 0,
                hueRotateDeg: 0
            },
            timesliceMs: 1000,
            ...options
        };
        
        this.startTime = null;
        this.recordingTimer = null;
        this.onProgress = null;

        // Processing state
        this.videoEl = null;
        this.canvasEl = null;
        this.canvasCtx = null;
        this._rafId = null;

        // Chunk callback
        this.onChunk = null;
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
            const source = await this.getPrimaryScreenSource();
            
            const baseStream = await this.createMediaStream(source.id, {
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

            // Optional real-time video processing
            let streamForRecord = baseStream;
            if (options.processingEnabled) {
                streamForRecord = await this.buildProcessedVideoStream(baseStream, options);
            }

            const recorder = this.createMediaRecorder(streamForRecord, {
                mimeType: this.getSupportedMimeType('video/webm;codecs=vp9,opus'),
                videoBitsPerSecond: options.videoBitsPerSecond,
                audioBitsPerSecond: options.audioBitsPerSecond
            });

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    if (this.onChunk) this.onChunk(event.data);
                }
            };

            recorder.onstop = () => {
                this.stopRecordingTimer();
                this.isCapturing = false;
                this.teardownVideoProcessing();
            };

            recorder.onerror = (event) => {
                console.error('Recording error:', event.error);
                this.cleanup();
                this.teardownVideoProcessing();
            };

            recorder.start(options.timesliceMs || 1000);
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
                    mimeType: recorder.mimeType,
                    processingEnabled: !!options.processingEnabled,
                    processingOptions: options.processingOptions,
                    timesliceMs: options.timesliceMs || 1000
                }
            };

        } catch (error) {
            console.error('Failed to start video recording:', error);
            this.cleanup();
            this.teardownVideoProcessing();
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
     * Set chunk callback
     * @param {Function} callback - Chunk callback function
     */
    setChunkCallback(callback) {
        this.onChunk = typeof callback === 'function' ? callback : null;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        super.cleanup();
        this.stopRecordingTimer();
        this.startTime = null;
        this.onProgress = null;
        this.teardownVideoProcessing();
        this.onChunk = null;
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

    /**
     * Real-time video processing via Canvas
     * @param {MediaStream} baseStream - Base video stream
     * @param {Object} options - Processing options
     * @returns {MediaStream} Processed video stream
     */
    async buildProcessedVideoStream(baseStream, options) {
        const track = baseStream.getVideoTracks()[0];
        const settings = track.getSettings();

        const video = document.createElement('video');
        video.srcObject = baseStream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');

        await new Promise((resolve) => {
            const onReady = () => {
                video.removeEventListener('loadedmetadata', onReady);
                resolve();
            };
            video.addEventListener('loadedmetadata', onReady);
        });

        try { await video.play(); } catch (_) {}

        const canvas = document.createElement('canvas');
        canvas.width = settings.width || 1920;
        canvas.height = settings.height || 1080;

        const ctx = canvas.getContext('2d');

        const filter = this.getCanvasFilterString(options.processingOptions);
        const draw = () => {
            ctx.filter = filter;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            this._rafId = requestAnimationFrame(draw);
        };
        this._rafId = requestAnimationFrame(draw);

        const processedVideoStream = canvas.captureStream(options.frameRate || 30);

        let combined;
        if (options.includeAudio) {
            combined = new MediaStream();
            const processedVideoTrack = processedVideoStream.getVideoTracks()[0];
            if (processedVideoTrack) combined.addTrack(processedVideoTrack);
            baseStream.getAudioTracks().forEach(t => combined.addTrack(t));
        } else {
            combined = processedVideoStream;
        }

        this.videoEl = video;
        this.canvasEl = canvas;
        this.canvasCtx = ctx;

        return combined;
    }

    /**
     * Get canvas filter string
     * @param {Object} p - Processing options
     * @returns {string} CSS filter string
     */
    getCanvasFilterString(p = {}) {
        const brightness = p?.brightness ?? 1.0;
        const contrast = p?.contrast ?? 1.0;
        const saturate = p?.saturate ?? 1.0;
        const blurPx = p?.blurPx ?? 0;
        const hueRotateDeg = p?.hueRotateDeg ?? 0;

        return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blurPx}px) hue-rotate(${hueRotateDeg}deg)`;
    }

    /**
     * Teardown video processing resources
     */
    teardownVideoProcessing() {
        if (this._rafId) {
            try { cancelAnimationFrame(this._rafId); } catch (_) {}
            this._rafId = null;
        }
        if (this.videoEl) {
            try { this.videoEl.pause(); } catch (_) {}
            this.videoEl.srcObject = null;
            this.videoEl.remove();
            this.videoEl = null;
        }
        if (this.canvasEl) {
            this.canvasEl.remove();
            this.canvasEl = null;
            this.canvasCtx = null;
        }
    }
}

module.exports = VideoRecorder;
