/**
 * Base Capture Utilities
 * Common functionality for all capture types
 */

const { desktopCapturer } = require('electron');

class CaptureBase {
    constructor() {
        this.isCapturing = false;
        this.currentStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    /**
     * Get available desktop sources
     * @param {Object} options - Capture options
     * @returns {Promise<Array>} Available sources
     */
    async getDesktopSources(options = {}) {
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
     * @returns {Promise<Object>} Primary screen source
     */
    async getPrimaryScreenSource() {
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
     * Create media stream from desktop source
     * @param {string} sourceId - Desktop source ID
     * @param {Object} constraints - Media stream constraints
     * @returns {Promise<MediaStream>} Media stream
     */
    async createMediaStream(sourceId, constraints = {}) {
        const defaultConstraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    minWidth: 1280,
                    maxWidth: 1920,
                    minHeight: 720,
                    maxHeight: 1080
                }
            }
        };

        const finalConstraints = { ...defaultConstraints, ...constraints };
        const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
        this.currentStream = stream;
        return stream;
    }

    /**
     * Create audio-only stream
     * @param {Object} constraints - Audio constraints
     * @returns {Promise<MediaStream>} Audio stream
     */
    async createAudioStream(constraints = {}) {
        const defaultConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                ...constraints.audio
            },
            video: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
        this.currentStream = stream;
        return stream;
    }

    /**
     * Stop current media stream
     */
    stopMediaStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    /**
     * Create media recorder
     * @param {MediaStream} stream - Media stream to record
     * @param {Object} options - Recorder options
     * @returns {MediaRecorder} Media recorder instance
     */
    createMediaRecorder(stream, options = {}) {
        const defaultOptions = {
            mimeType: this.getSupportedMimeType(),
            videoBitsPerSecond: 2000000,
            audioBitsPerSecond: 128000
        };

        const finalOptions = { ...defaultOptions, ...options };
        const recorder = new MediaRecorder(stream, finalOptions);
        
        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder = recorder;
        return recorder;
    }

    /**
     * Get supported MIME type for recording
     * @param {string} preferredType - Preferred MIME type
     * @returns {string} Supported MIME type
     */
    getSupportedMimeType(preferredType = null) {
        const types = [
            preferredType,
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4'
        ].filter(Boolean);

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'video/webm'; // Fallback
    }

    /**
     * Convert recorded chunks to blob
     * @param {string} mimeType - MIME type for the blob
     * @returns {Blob} Recorded data as blob
     */
    createBlobFromChunks(mimeType = null) {
        if (this.recordedChunks.length === 0) {
            throw new Error('No recorded data available');
        }

        const blob = new Blob(this.recordedChunks, { 
            type: mimeType || this.getSupportedMimeType() 
        });
        
        this.recordedChunks = [];
        return blob;
    }

    /**
     * Get recording quality presets
     * @param {string} quality - Quality level (low, medium, high)
     * @returns {Object} Quality settings
     */
    getQualityPresets(quality = 'medium') {
        const presets = {
            low: {
                video: { mandatory: { maxWidth: 1280, maxHeight: 720, maxFrameRate: 30 } },
                videoBitsPerSecond: 1000000,
                audioBitsPerSecond: 64000
            },
            medium: {
                video: { mandatory: { maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
                videoBitsPerSecond: 2000000,
                audioBitsPerSecond: 128000
            },
            high: {
                video: { mandatory: { maxWidth: 2560, maxHeight: 1440, maxFrameRate: 60 } },
                videoBitsPerSecond: 4000000,
                audioBitsPerSecond: 192000
            }
        };

        return presets[quality] || presets.medium;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
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
     * @returns {boolean} Whether screen capture is supported
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder &&
            desktopCapturer
        );
    }
}

module.exports = CaptureBase;
