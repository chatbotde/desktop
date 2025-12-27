/**
 * Video Recording Handler
 * Handles screen video recording using Electron's desktopCapturer + MediaRecorder
 * Runs in the RENDERER process (needs access to MediaRecorder API)
 */

import CaptureBase from '../utils/capture-base';
import {
    VideoRecordingOptions,
    VideoRecordingResult,
    RecordingState,
    SelectionArea
} from '../types/capture.types';

class VideoRecorder extends CaptureBase {
    private recordingOptions: {
        fps: number;
        videoBitsPerSecond: number;
        audioEnabled: boolean;
        mimeType: string;
    };
    private recordingState: RecordingState = 'idle';
    private recordingStartTime: number = 0;
    private pausedDuration: number = 0;
    private pauseStartTime: number = 0;

    constructor() {
        super();
        this.recordingOptions = {
            fps: 30,
            videoBitsPerSecond: 2500000, // 2.5 Mbps
            audioEnabled: false,
            mimeType: 'video/webm;codecs=vp9'
        };
    }

    /**
     * Get the best supported MIME type for recording
     */
    private getSupportedMimeType(): string {
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        for (const mimeType of mimeTypes) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }

        return 'video/webm';
    }

    /**
     * Get media stream constraints for given FPS and resolution
     */
    private getStreamConstraints(sourceId: string, options: VideoRecordingOptions = {}): MediaStreamConstraints {
        const {
            fps = this.recordingOptions.fps,
            width = 1920,
            height = 1080,
            audioEnabled = this.recordingOptions.audioEnabled
        } = options;

        const constraints: MediaStreamConstraints = {
            audio: audioEnabled ? {
                // @ts-ignore - Electron-specific constraint
                mandatory: {
                    chromeMediaSource: 'desktop'
                }
            } : false,
            video: {
                // @ts-ignore - Electron-specific constraint
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    minWidth: width,
                    maxWidth: width,
                    minHeight: height,
                    maxHeight: height,
                    minFrameRate: fps,
                    maxFrameRate: fps
                }
            }
        };

        return constraints;
    }

    /**
     * Start recording the screen
     */
    async startRecording(options: VideoRecordingOptions = {}): Promise<VideoRecordingResult> {
        if (this.recordingState === 'recording') {
            return {
                success: false,
                error: 'Recording already in progress'
            };
        }

        try {
            const {
                sourceId = null,
                fps = 30,
                videoBitsPerSecond = 2500000,
                width = 1920,
                height = 1080,
                audioEnabled = false
            } = options;

            // Update recording options
            this.recordingOptions.fps = fps;
            this.recordingOptions.videoBitsPerSecond = videoBitsPerSecond;
            this.recordingOptions.audioEnabled = audioEnabled;
            this.recordingOptions.mimeType = this.getSupportedMimeType();

            // Get the source to record
            let targetSourceId = sourceId;
            if (!targetSourceId) {
                const sources = await this.getDesktopSources({
                    types: ['screen'],
                    thumbnailSize: { width: 150, height: 150 }
                });
                if (sources.length === 0) {
                    throw new Error('No screen sources available');
                }
                targetSourceId = sources[0].id;
            }

            // Get media stream using navigator.mediaDevices.getUserMedia
            const constraints = this.getStreamConstraints(targetSourceId, {
                fps,
                width,
                height,
                audioEnabled
            });

            // Get the stream (this runs in renderer context)
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.currentStream, {
                mimeType: this.recordingOptions.mimeType,
                videoBitsPerSecond: this.recordingOptions.videoBitsPerSecond
            });

            this.recordedChunks = [];

            // Handle data available event
            this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Start recording with timeslice for regular data chunks (every 1 second)
            this.mediaRecorder.start(1000);
            this.recordingState = 'recording';
            this.recordingStartTime = Date.now();
            this.pausedDuration = 0;

            console.log(`[VideoRecorder] Started recording at ${fps} FPS, ${videoBitsPerSecond / 1000000} Mbps`);

            return {
                success: true,
                state: this.recordingState,
                sourceId: targetSourceId,
                fps,
                videoBitsPerSecond,
                mimeType: this.recordingOptions.mimeType
            };

        } catch (error: any) {
            console.error('Start recording error:', error);
            this.cleanup();
            return {
                success: false,
                error: error.message || 'Failed to start recording'
            };
        }
    }

    /**
     * Stop recording and return the video data
     */
    async stopRecording(): Promise<VideoRecordingResult> {
        if (this.recordingState === 'idle') {
            return {
                success: false,
                error: 'No recording in progress'
            };
        }

        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve({
                    success: false,
                    error: 'MediaRecorder not initialized'
                });
                return;
            }

            this.mediaRecorder.onstop = async () => {
                try {
                    // Calculate recording duration
                    const endTime = Date.now();
                    const totalDuration = endTime - this.recordingStartTime - this.pausedDuration;

                    // Combine all chunks into a single Blob
                    const videoBlob = new Blob(this.recordedChunks, {
                        type: this.recordingOptions.mimeType
                    });

                    // Convert to base64 data URL
                    const arrayBuffer = await videoBlob.arrayBuffer();
                    const base64Data = this.arrayBufferToBase64(arrayBuffer);
                    const dataUrl = `data:${this.recordingOptions.mimeType};base64,${base64Data}`;

                    // Get video dimensions from stream
                    let width = 0;
                    let height = 0;
                    if (this.currentStream) {
                        const videoTrack = this.currentStream.getVideoTracks()[0];
                        if (videoTrack) {
                            const settings = videoTrack.getSettings();
                            width = settings.width || 0;
                            height = settings.height || 0;
                        }
                    }

                    // Cleanup
                    this.stopMediaStream();
                    this.recordingState = 'idle';

                    const fileName = `recording-${Date.now()}.webm`;

                    console.log(`[VideoRecorder] Stopped recording. Duration: ${totalDuration}ms, Size: ${videoBlob.size} bytes`);

                    resolve({
                        success: true,
                        video: {
                            name: fileName,
                            type: this.recordingOptions.mimeType,
                            size: videoBlob.size,
                            data: dataUrl,
                            blob: videoBlob,
                            dimensions: { width, height },
                            duration: totalDuration,
                            fps: this.recordingOptions.fps,
                            timestamp: Date.now()
                        }
                    });

                } catch (error: any) {
                    console.error('Stop recording error:', error);
                    this.cleanup();
                    resolve({
                        success: false,
                        error: error.message || 'Failed to process recording'
                    });
                }
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pauseRecording(): VideoRecordingResult {
        if (this.recordingState !== 'recording') {
            return {
                success: false,
                error: 'Recording is not active'
            };
        }

        if (!this.mediaRecorder) {
            return {
                success: false,
                error: 'MediaRecorder not initialized'
            };
        }

        this.mediaRecorder.pause();
        this.recordingState = 'paused';
        this.pauseStartTime = Date.now();

        console.log('[VideoRecorder] Recording paused');

        return {
            success: true,
            state: this.recordingState
        };
    }

    /**
     * Resume recording
     */
    resumeRecording(): VideoRecordingResult {
        if (this.recordingState !== 'paused') {
            return {
                success: false,
                error: 'Recording is not paused'
            };
        }

        if (!this.mediaRecorder) {
            return {
                success: false,
                error: 'MediaRecorder not initialized'
            };
        }

        this.mediaRecorder.resume();
        this.recordingState = 'recording';
        this.pausedDuration += Date.now() - this.pauseStartTime;

        console.log('[VideoRecorder] Recording resumed');

        return {
            success: true,
            state: this.recordingState
        };
    }

    /**
     * Get current recording state
     */
    getRecordingState(): RecordingState {
        return this.recordingState;
    }

    /**
     * Get recording duration in milliseconds
     */
    getRecordingDuration(): number {
        if (this.recordingState === 'idle') {
            return 0;
        }

        const now = Date.now();
        let duration = now - this.recordingStartTime - this.pausedDuration;

        if (this.recordingState === 'paused') {
            duration -= (now - this.pauseStartTime);
        }

        return Math.max(0, duration);
    }

    /**
     * Record a specific area of the screen
     * Note: This captures the full screen and the area info is for reference
     * Actual cropping would need to be done in post-processing
     */
    async startAreaRecording(area: SelectionArea, options: VideoRecordingOptions = {}): Promise<VideoRecordingResult> {
        // Start regular recording
        const result = await this.startRecording(options);

        if (result.success) {
            return {
                ...result,
                area
            };
        }

        return result;
    }

    /**
     * Convert ArrayBuffer to Base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Check if video recording is supported
     */
    static override isSupported(): boolean {
        return (
            typeof navigator !== 'undefined' &&
            typeof navigator.mediaDevices !== 'undefined' &&
            typeof navigator.mediaDevices.getUserMedia === 'function' &&
            typeof MediaRecorder !== 'undefined'
        );
    }

    /**
     * Get available video sources for recording
     */
    async getAvailableSources(includeWindows: boolean = true) {
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
                thumbnail: source.thumbnail?.toDataURL(),
                icon: source.appIcon?.toDataURL()
            }))
        };
    }

    /**
     * Override cleanup to also reset recording state
     */
    override cleanup(): void {
        super.cleanup();
        this.recordingState = 'idle';
        this.recordingStartTime = 0;
        this.pausedDuration = 0;
        this.pauseStartTime = 0;
    }
}

export default VideoRecorder;
module.exports = VideoRecorder;
