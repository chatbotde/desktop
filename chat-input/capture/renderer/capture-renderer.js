/**
 * Renderer-side capture utilities
 * These functions run in the renderer process where getUserMedia is available
 */

class RendererCaptureAPI {
    constructor() {
        this.activeRecorders = new Map();
        this.recordingCounter = 0;
        this.volumeCallback = null;
    }

    /**
     * Check if capture APIs are supported in renderer
     * @returns {Object} Support status
     */
    checkSupport() {
        return {
            screenshot: typeof window.chatInputAPI?.quickScreenshot === 'function',
            videoRecording: !!(
                navigator.mediaDevices &&
                navigator.mediaDevices.getUserMedia &&
                window.MediaRecorder
            ),
            audioRecording: !!(
                navigator.mediaDevices &&
                navigator.mediaDevices.getUserMedia &&
                window.MediaRecorder
            ),
            desktopCapturer: !!(
                navigator.mediaDevices &&
                navigator.mediaDevices.getUserMedia
            )
        };
    }

    /**
     * Get supported formats in renderer
     * @returns {Object} Supported formats
     */
    getSupportedFormats() {
        const videoFormats = [];
        const audioFormats = [];

        if (typeof MediaRecorder !== 'undefined') {
            const testFormats = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=h264,opus',
                'video/webm',
                'video/mp4',
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/wav'
            ];

            testFormats.forEach(format => {
                if (MediaRecorder.isTypeSupported(format)) {
                    if (format.startsWith('video/')) {
                        videoFormats.push(format);
                    } else if (format.startsWith('audio/')) {
                        audioFormats.push(format);
                    }
                }
            });
        }

        return {
            video: videoFormats,
            audio: audioFormats,
            image: ['image/png', 'image/jpeg', 'image/webp']
        };
    }

         /**
      * Start screen recording using desktopCapturer
      * @param {Object} options - Recording options
      * @returns {Promise<Object>} Recording result
      */
     async startScreenRecording(options = {}) {
         try {
             console.log('Starting screen recording with options:', options);
             
             // Get desktop sources from main process
             const sources = await window.chatInputAPI.getScreenshotSources(false);
             if (!sources.success || sources.sources.length === 0) {
                 throw new Error('No screen sources available');
             }

             console.log('Available sources:', sources.sources.length);

             // Use primary screen (usually the first screen source)
             const screenSource = sources.sources.find(s => s.type === 'screen') || sources.sources[0];
             console.log('Using source:', screenSource.name, screenSource.type);
             
             // Create media stream with more compatible constraints
             const constraints = {
                 audio: false, // Start with video only for better compatibility
                 video: {
                     mandatory: {
                         chromeMediaSource: 'desktop',
                         chromeMediaSourceId: screenSource.id,
                         maxWidth: 1920,
                         maxHeight: 1080,
                         maxFrameRate: 30
                     }
                 }
             };

             console.log('Requesting media stream with constraints:', constraints);
             const stream = await navigator.mediaDevices.getUserMedia(constraints);
             console.log('Media stream created:', stream.getTracks().length, 'tracks');

             // Get the best supported MIME type
             const mimeType = this.getBestVideoMimeType();
             console.log('Using MIME type:', mimeType);

             // Create media recorder with compatible settings
             const recordingId = `video_${++this.recordingCounter}`;
             const recorderOptions = {
                 mimeType: mimeType
             };

             // Add bitrate only if supported
             if (options.videoBitsPerSecond) {
                 recorderOptions.videoBitsPerSecond = options.videoBitsPerSecond;
             }

             const recorder = new MediaRecorder(stream, recorderOptions);
             console.log('MediaRecorder created with options:', recorderOptions);

             const recordedChunks = [];
             const startTime = Date.now();

             recorder.ondataavailable = (event) => {
                 console.log('Data available:', event.data.size, 'bytes');
                 if (event.data && event.data.size > 0) {
                     recordedChunks.push(event.data);
                 }
             };

             recorder.onerror = (event) => {
                 console.error('MediaRecorder error:', event.error);
             };

             recorder.start(1000); // Collect data every second
             console.log('Recording started with ID:', recordingId);

             // Store recording info
             this.activeRecorders.set(recordingId, {
                 type: 'video',
                 recorder,
                 stream,
                 chunks: recordedChunks,
                 startTime,
                 mimeType
             });

             return {
                 success: true,
                 recordingId,
                 message: `Video recording started with ${mimeType}`
             };

         } catch (error) {
             console.error('Screen recording error:', error);
             return {
                 success: false,
                 error: error.message
             };
         }
     }

    /**
     * Start audio recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Recording result
     */
    async startAudioRecording(options = {}) {
        try {
            // Create audio stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                },
                video: false
            });

            // Create media recorder
            const recordingId = `audio_${++this.recordingCounter}`;
            const recorder = new MediaRecorder(stream, {
                mimeType: this.getSupportedAudioMimeType(),
                audioBitsPerSecond: options.audioBitsPerSecond || 128000
            });

            const recordedChunks = [];
            const startTime = Date.now();

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            recorder.start(1000);

            // Setup volume monitoring
            this.setupVolumeMonitoring(stream, recordingId);

            // Store recording info
            this.activeRecorders.set(recordingId, {
                type: 'audio',
                recorder,
                stream,
                chunks: recordedChunks,
                startTime
            });

            return {
                success: true,
                recordingId,
                message: 'Audio recording started'
            };

        } catch (error) {
            console.error('Audio recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Stop result
     */
    async stopRecording(recordingId) {
        const recording = this.activeRecorders.get(recordingId);
        if (!recording) {
            return {
                success: false,
                error: 'Recording not found'
            };
        }

        return new Promise((resolve) => {
            recording.recorder.onstop = async () => {
                                 try {
                     console.log(`Processing stop for ${recording.type} recording with ${recording.chunks.length} chunks`);
                     
                     // Stop all tracks
                     recording.stream.getTracks().forEach(track => {
                         console.log(`Stopping track: ${track.kind}, state: ${track.readyState}`);
                         track.stop();
                     });

                     // Get the actual MIME type from recording or fall back to stored type
                     const actualMimeType = recording.recorder.mimeType || recording.mimeType || 'video/webm';
                     console.log('Creating blob with MIME type:', actualMimeType);

                     // Create blob from chunks
                     const blob = new Blob(recording.chunks, {
                         type: actualMimeType
                     });

                     console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

                     // Convert to media file
                     const duration = (Date.now() - recording.startTime) / 1000;
                     
                     // Determine file extension based on MIME type
                     let extension = 'webm';
                     if (actualMimeType.includes('mp4')) {
                         extension = 'mp4';
                     } else if (actualMimeType.includes('webm')) {
                         extension = 'webm';
                     }
                     
                     const fileName = `${recording.type}-${Date.now()}.${extension}`;
                     console.log('Creating file:', fileName);

                     const file = new File([blob], fileName, {
                         type: actualMimeType
                     });

                     // Create media file object with object URL for better video playback
                     let dataUrl;
                     if (recording.type === 'video') {
                         // For video, create an object URL for better performance and compatibility
                         dataUrl = URL.createObjectURL(blob);
                         console.log('Created object URL for video:', dataUrl);
                     } else {
                         // For audio, use data URL
                         dataUrl = await new Promise((resolve) => {
                             const reader = new FileReader();
                             reader.onload = e => resolve(e.target.result);
                             reader.onerror = e => {
                                 console.error('FileReader error:', e);
                                 resolve('');
                             };
                             reader.readAsDataURL(file);
                         });
                         console.log('Created data URL for audio');
                     }

                     const mediaFile = {
                         name: file.name,
                         type: actualMimeType,
                         size: file.size,
                         data: dataUrl,
                         mediaType: recording.type,
                         source: 'recording',
                         timestamp: Date.now(),
                         duration: duration,
                         isObjectUrl: recording.type === 'video' // Flag to know if we need to revoke URL later
                     };

                     console.log('Media file created:', {
                         name: mediaFile.name,
                         type: mediaFile.type,
                         size: mediaFile.size,
                         duration: mediaFile.duration,
                         isObjectUrl: mediaFile.isObjectUrl
                     });

                     // Cleanup
                     this.activeRecorders.delete(recordingId);

                     resolve({
                         success: true,
                         [recording.type]: mediaFile,
                         metadata: {
                             duration,
                             size: mediaFile.size,
                             mimeType: actualMimeType,
                             chunks: recording.chunks.length
                         }
                     });

                 } catch (error) {
                     console.error('Error in stop recording:', error);
                     resolve({
                         success: false,
                         error: error.message
                     });
                 }
            };

            recording.recorder.stop();
        });
    }

    /**
     * Pause recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Pause result
     */
    pauseRecording(recordingId) {
        const recording = this.activeRecorders.get(recordingId);
        if (!recording) {
            return { success: false, error: 'Recording not found' };
        }

        try {
            if (recording.recorder.state === 'recording') {
                recording.recorder.pause();
                return { success: true, message: 'Recording paused' };
            }
            return { success: false, error: 'Recording not in recordable state' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Resume recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Resume result
     */
    resumeRecording(recordingId) {
        const recording = this.activeRecorders.get(recordingId);
        if (!recording) {
            return { success: false, error: 'Recording not found' };
        }

        try {
            if (recording.recorder.state === 'paused') {
                recording.recorder.resume();
                return { success: true, message: 'Recording resumed' };
            }
            return { success: false, error: 'Recording not paused' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get active recordings
     * @returns {Array} Active recordings
     */
    getActiveRecordings() {
        const recordings = [];
        for (const [recordingId, recording] of this.activeRecorders.entries()) {
            recordings.push({
                id: recordingId,
                type: recording.type,
                startTime: recording.startTime,
                duration: (Date.now() - recording.startTime) / 1000,
                state: recording.recorder.state
            });
        }
        return recordings;
    }

    /**
     * Stop all recordings
     * @returns {Promise<Array>} Stop results
     */
    async stopAllRecordings() {
        const results = [];
        const recordingIds = Array.from(this.activeRecorders.keys());
        
        for (const recordingId of recordingIds) {
            const result = await this.stopRecording(recordingId);
            results.push({
                recordingId,
                result
            });
        }
        
        return results;
    }

    /**
     * Setup volume monitoring for audio
     * @param {MediaStream} stream - Audio stream
     * @param {string} recordingId - Recording ID
     */
    setupVolumeMonitoring(stream, recordingId) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3;
            source.connect(analyser);
            
            const volumeCheck = () => {
                if (!this.activeRecorders.has(recordingId)) return;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                
                const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                const volumeLevel = Math.round((average / 255) * 100);
                
                // Trigger volume change event
                if (window.rendererCaptureAPI?.volumeCallback) {
                    window.rendererCaptureAPI.volumeCallback({ volume: volumeLevel });
                }
                
                setTimeout(volumeCheck, 100);
            };
            
            volumeCheck();
        } catch (error) {
            console.warn('Volume monitoring setup failed:', error);
        }
    }

    /**
     * Get supported video MIME type
     * @returns {string} MIME type
     */
    getSupportedVideoMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    }

    /**
     * Get the best video MIME type for playback compatibility
     * @returns {string} MIME type
     */
    getBestVideoMimeType() {
        // Prioritize formats that work well in browsers
        const types = [
            'video/webm;codecs=vp8', // Most compatible WebM
            'video/webm',            // Basic WebM
            'video/mp4',             // MP4 fallback
            'video/webm;codecs=vp9', // VP9 (newer but good quality)
            'video/webm;codecs=h264' // H264 in WebM container
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Selected video MIME type:', type);
                return type;
            }
        }
        
        console.log('Falling back to basic video/webm');
        return 'video/webm';
    }

    /**
     * Get supported audio MIME type
     * @returns {string} MIME type
     */
    getSupportedAudioMimeType() {
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
        return 'audio/webm';
    }

    /**
     * Set volume callback
     * @param {Function} callback - Volume callback function
     */
    setVolumeCallback(callback) {
        this.volumeCallback = callback;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RendererCaptureAPI = RendererCaptureAPI;
}
