/**
 * Audio Recording Handler
 * Handles audio recording from microphone and system audio
 */

const CaptureBase = require('../utils/capture-base');

class AudioRecorder extends CaptureBase {
    constructor(options = {}) {
        super();
        
        this.options = {
            source: 'microphone', // 'microphone', 'system', 'both'
            quality: 'medium',
            sampleRate: 44100,
            channelCount: 2,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            processingEnabled: false,
            processingOptions: {
                highpassHz: 80,
                lowpassHz: 12000,
                compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 3 },
                gain: 1.0
            },
            timesliceMs: 1000,
            ...options
        };
        
        this.startTime = null;
        this.recordingTimer = null;
        this.onProgress = null;
        this.volumeCallback = null;
        this.analyser = null;
        this.volumeCheckInterval = null;

        // Processing state
        this.audioContext = null;
        this.audioNodes = null;

        // Chunk callback
        this.onChunk = null;
    }

    /**
     * Start audio recording
     * @param {Object} recordingOptions - Recording options
     * @returns {Promise<Object>} Recording start result
     */
    async start(recordingOptions = {}) {
        if (this.isCapturing) {
            throw new Error('Recording already in progress');
        }

        const options = { ...this.options, ...recordingOptions };
        
        try {
            let stream;
            
            if (options.source === 'system') {
                stream = await this.createSystemAudioStream(options);
            } else if (options.source === 'both') {
                stream = await this.createMixedAudioStream(options);
            } else {
                stream = await this.createMicrophoneStream(options);
            }

            // Optional real-time audio processing
            let streamForRecord = stream;
            if (options.processingEnabled) {
                streamForRecord = await this.buildProcessedAudioStream(stream, options);
            }

            const recorder = this.createMediaRecorder(streamForRecord, {
                mimeType: this.getAudioMimeType(),
                audioBitsPerSecond: this.getAudioBitrate(options.quality)
            });

            this.setupVolumeMonitoring(streamForRecord);

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    if (this.onChunk) this.onChunk(event.data);
                }
            };

            recorder.onstop = () => {
                this.stopRecordingTimer();
                this.stopVolumeMonitoring();
                this.isCapturing = false;
            };

            recorder.onerror = (event) => {
                console.error('Audio recording error:', event.error);
                this.cleanup();
            };

            recorder.start(options.timesliceMs || 1000);
            this.isCapturing = true;
            this.startTime = Date.now();
            this.startRecordingTimer();

            return {
                success: true,
                message: 'Audio recording started',
                settings: {
                    source: options.source,
                    quality: options.quality,
                    sampleRate: options.sampleRate,
                    channelCount: options.channelCount,
                    mimeType: recorder.mimeType,
                    processingEnabled: !!options.processingEnabled,
                    processingOptions: options.processingOptions,
                    timesliceMs: options.timesliceMs || 1000
                }
            };

        } catch (error) {
            console.error('Failed to start audio recording:', error);
            this.cleanup();
            return {
                success: false,
                error: error.message || 'Failed to start audio recording'
            };
        }
    }

    /**
     * Stop audio recording
     * @returns {Promise<Object>} Recording stop result with audio file
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
                    const file = new File([blob], `audio-recording-${Date.now()}.webm`, {
                        type: blob.type
                    });

                    // Create media file object using MediaUtils
                    const MediaUtils = require('../utils/media-utils');
                    const mediaFile = await MediaUtils.createMediaFile(file, 'audio-recording');
                    
                    // Add duration and additional metadata
                    mediaFile.duration = duration;
                    mediaFile.recordingInfo = {
                        startTime: this.startTime,
                        endTime: Date.now(),
                        source: this.options.source,
                        quality: this.options.quality,
                        sampleRate: this.options.sampleRate,
                        channelCount: this.options.channelCount
                    };

                    this.cleanup();

                    resolve({
                        success: true,
                        audio: mediaFile,
                        metadata: {
                            duration,
                            size: mediaFile.size,
                            source: this.options.source,
                            quality: this.options.quality
                        }
                    });

                } catch (error) {
                    console.error('Error processing recorded audio:', error);
                    this.cleanup();
                    resolve({
                        success: false,
                        error: 'Failed to process recorded audio: ' + error.message
                    });
                }
            };

            // Stop the recording
            this.mediaRecorder.stop();
            this.stopMediaStream();
        });
    }

    /**
     * Create microphone audio stream
     * @param {Object} options - Stream options
     * @returns {Promise<MediaStream>} Audio stream
     */
    async createMicrophoneStream(options) {
        const constraints = {
            audio: {
                echoCancellation: options.echoCancellation,
                noiseSuppression: options.noiseSuppression,
                autoGainControl: options.autoGainControl,
                sampleRate: options.sampleRate,
                channelCount: options.channelCount
            },
            video: false
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentStream = stream;
            return stream;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone access denied. Please grant microphone permissions.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone.');
            } else {
                throw new Error('Failed to access microphone: ' + error.message);
            }
        }
    }

    /**
     * Create system audio stream (requires special setup)
     * @param {Object} options - Stream options
     * @returns {Promise<MediaStream>} System audio stream
     */
    async createSystemAudioStream(options) {
        try {
            // For system audio, we need to use desktop capture with audio
            const source = await this.getPrimaryScreenSource();
            
            const constraints = {
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                },
                video: false // Audio only
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentStream = stream;
            return stream;
        } catch (error) {
            throw new Error('System audio capture not supported or failed: ' + error.message);
        }
    }

    /**
     * Create mixed audio stream (microphone + system)
     * @param {Object} options - Stream options
     * @returns {Promise<MediaStream>} Mixed audio stream
     */
    async createMixedAudioStream(options) {
        try {
            // This is complex and may require Web Audio API mixing
            // For now, prioritize microphone with note about system audio
            const micStream = await this.createMicrophoneStream(options);
            
            // TODO: Implement proper audio mixing with Web Audio API
            console.warn('Mixed audio recording: Currently recording microphone only. System audio mixing requires additional implementation.');
            
            return micStream;
        } catch (error) {
            throw new Error('Mixed audio recording failed: ' + error.message);
        }
    }

    /**
     * Setup volume monitoring for visual feedback
     * @param {MediaStream} stream - Audio stream to monitor
     */
    setupVolumeMonitoring(stream) {
        try {
            const audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3;
            source.connect(analyser);
            
            this.analyser = analyser;
            this.startVolumeCheck();
        } catch (error) {
            console.warn('Volume monitoring setup failed:', error);
        }
    }

    /**
     * Start volume level checking
     */
    startVolumeCheck() {
        if (!this.analyser) return;

        this.volumeCheckInterval = setInterval(() => {
            if (!this.analyser || !this.isCapturing) return;

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const volumeLevel = Math.round((average / 255) * 100);
            
            if (this.volumeCallback) {
                this.volumeCallback(volumeLevel);
            }
        }, 100); // Check every 100ms
    }

    /**
     * Stop volume monitoring
     */
    stopVolumeMonitoring() {
        if (this.volumeCheckInterval) {
            clearInterval(this.volumeCheckInterval);
            this.volumeCheckInterval = null;
        }
        this.analyser = null;
    }

    /**
     * Set volume level callback
     * @param {Function} callback - Volume callback function
     */
    setVolumeCallback(callback) {
        this.volumeCallback = callback;
    }

    /**
     * Set chunk callback
     * @param {Function} callback - Chunk callback function
     */
    setChunkCallback(callback) {
        this.onChunk = typeof callback === 'function' ? callback : null;
    }

    /**
     * Build processed audio stream using WebAudio nodes
     * @param {MediaStream} inputStream - Input audio stream
     * @param {Object} options - Processing options
     * @returns {MediaStream} Processed audio stream
     */
    async buildProcessedAudioStream(inputStream, options) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: options.sampleRate });
        const source = ctx.createMediaStreamSource(inputStream);

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = options.processingOptions?.highpassHz ?? 80;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = options.processingOptions?.lowpassHz ?? 12000;

        const comp = ctx.createDynamicsCompressor();
        const compCfg = options.processingOptions?.compressor || {};
        if (typeof compCfg.threshold === 'number') comp.threshold.value = compCfg.threshold;
        if (typeof compCfg.ratio === 'number') comp.ratio.value = compCfg.ratio;
        if (typeof compCfg.attack === 'number') comp.attack.value = compCfg.attack;
        if (typeof compCfg.release === 'number') comp.release.value = compCfg.release;
        if (typeof compCfg.knee === 'number') comp.knee.value = compCfg.knee;

        const gain = ctx.createGain();
        gain.gain.value = options.processingOptions?.gain ?? 1.0;

        const dest = ctx.createMediaStreamDestination();

        source.connect(hp);
        hp.connect(lp);
        lp.connect(comp);
        comp.connect(gain);
        gain.connect(dest);

        // Keep references for cleanup / monitoring
        this.audioContext = ctx;
        this.audioNodes = { source, hp, lp, comp, gain, dest };

        return dest.stream;
    }

    /**
     * Get audio MIME type
     * @returns {string} Supported audio MIME type
     */
    getAudioMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Fallback
    }

    /**
     * Get audio bitrate based on quality
     * @param {string} quality - Quality level
     * @returns {number} Bitrate in bps
     */
    getAudioBitrate(quality) {
        const bitrates = {
            low: 64000,    // 64 kbps
            medium: 128000, // 128 kbps
            high: 192000   // 192 kbps
        };

        return bitrates[quality] || bitrates.medium;
    }

    /**
     * Pause audio recording
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
     * Resume audio recording
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
            dataSize: this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0),
            source: this.options.source
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
        this.stopVolumeMonitoring();
        this.startTime = null;
        this.onProgress = null;
        this.volumeCallback = null;

        if (this.audioContext) {
            try { this.audioContext.close(); } catch (_) {}
            this.audioContext = null;
            this.audioNodes = null;
        }

        this.onChunk = null;
    }

    /**
     * Check if audio recording is supported
     * @returns {boolean} Support status
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder
        );
    }

    /**
     * Get available audio sources
     * @returns {Array} Available audio sources
     */
    static getAvailableSources() {
        return [
            { id: 'microphone', name: 'Microphone', description: 'Record from microphone input' },
            { id: 'system', name: 'System Audio', description: 'Record system/desktop audio' },
            { id: 'both', name: 'Microphone + System', description: 'Record both microphone and system audio' }
        ];
    }

    /**
     * Check microphone permissions
     * @returns {Promise<string>} Permission status
     */
    static async checkMicrophonePermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            return result.state;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get supported audio formats
     * @returns {Array} Supported MIME types
     */
    static getSupportedFormats() {
        const formats = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav',
            'audio/ogg'
        ];

        return formats.filter(format => 
            typeof MediaRecorder !== 'undefined' && 
            MediaRecorder.isTypeSupported(format)
        );
    }
}

module.exports = AudioRecorder;
