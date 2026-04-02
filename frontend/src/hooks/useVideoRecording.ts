/**
 * useVideoRecording Hook
 * Performs video recording directly in the renderer process using MediaRecorder
 * The main process only provides source IDs via desktopCapturer
 */

import { useState, useCallback, useRef, useSyncExternalStore } from 'react';

// Types
export type RecordingState = 'idle' | 'recording' | 'paused';

export interface VideoRecordingOptions {
    sourceId?: string | null;
    fps?: number;
    videoBitsPerSecond?: number;
    width?: number;
    height?: number;
    audioEnabled?: boolean;
}

export interface VideoData {
    name: string;
    type: string;
    size: number;
    data: string; // base64 data URL
    blob?: Blob;
    dimensions: { width: number; height: number };
    duration: number;
    fps: number;
    timestamp: number;
}

export interface UseVideoRecordingResult {
    // State
    isRecording: boolean;
    isPaused: boolean;
    recordingState: RecordingState;
    duration: number;
    error: string | null;

    // Actions
    startRecording: (options?: VideoRecordingOptions) => Promise<boolean>;
    stopRecording: () => Promise<VideoData | null>;
    pauseRecording: () => Promise<boolean>;
    resumeRecording: () => Promise<boolean>;

    // Utilities
    getVideoSources: (includeWindows?: boolean) => Promise<any[]>;
    isSupported: () => boolean;
}

// Get the best supported MIME type for recording
// Priority: MP4 > MKV > WebM (MP4/MKV have better Windows compatibility)
function getSupportedMimeType(): { mimeType: string; extension: string; windowsCompatible: boolean } {
    const mimeTypes = [
        // MP4 formats (best Windows compatibility, but rarely supported by MediaRecorder)
        { mimeType: 'video/mp4;codecs=h264,aac', extension: 'mp4', windowsCompatible: true },
        { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4', windowsCompatible: true },
        { mimeType: 'video/mp4', extension: 'mp4', windowsCompatible: true },
        // Matroska/MKV format (good Windows compatibility with codec pack)
        { mimeType: 'video/x-matroska;codecs=avc1,opus', extension: 'mkv', windowsCompatible: true },
        { mimeType: 'video/x-matroska;codecs=h264', extension: 'mkv', windowsCompatible: true },
        // WebM with H264 (decent compatibility)
        { mimeType: 'video/webm;codecs=h264', extension: 'webm', windowsCompatible: true },
        // Standard WebM formats (require VLC or codec pack on Windows)
        { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm', windowsCompatible: false },
        { mimeType: 'video/webm;codecs=vp9', extension: 'webm', windowsCompatible: false },
        { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm', windowsCompatible: false },
        { mimeType: 'video/webm;codecs=vp8', extension: 'webm', windowsCompatible: false },
        { mimeType: 'video/webm', extension: 'webm', windowsCompatible: false }
    ];

    for (const { mimeType, extension, windowsCompatible } of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
            console.log(`[useVideoRecording] Using MIME type: ${mimeType} (extension: .${extension})`);
            if (!windowsCompatible) {
                console.warn(`[useVideoRecording] ⚠️ This format (.${extension}) may not play in Windows Media Player. Use VLC Player for best compatibility.`);
            }
            return { mimeType, extension, windowsCompatible };
        }
    }

    // Fallback
    console.warn('[useVideoRecording] ⚠️ Using fallback WebM format. Install VLC Player for playback.');
    return { mimeType: 'video/webm', extension: 'webm', windowsCompatible: false };
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function useVideoRecording(): UseVideoRecordingResult {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Refs for recording state
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedDurationRef = useRef<number>(0);
    const pauseStartTimeRef = useRef<number>(0);
    const recordingOptionsRef = useRef<{ fps: number; mimeType: string; extension: string; videoBitsPerSecond: number }>({
        fps: 30,
        mimeType: 'video/mp4',
        extension: 'mp4',
        videoBitsPerSecond: 2500000
    });

    // Computed states
    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';

    // Cleanup media stream
    const cleanupStream = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    // Cleanup duration interval
    const clearDurationInterval = useCallback(() => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    }, []);

    // Start duration tracking
    const startDurationTracking = useCallback(() => {
        startTimeRef.current = Date.now();
        pausedDurationRef.current = 0;

        durationIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTimeRef.current - pausedDurationRef.current;
            setDuration(Math.max(0, elapsed));
        }, 100);
    }, []);

    // Cleanup on unmount - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            return () => {
                clearDurationInterval();
                cleanupStream();
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
            };
        }, [clearDurationInterval, cleanupStream]),
        () => null,
        () => null
    )

    /**
     * Get available video sources from main process
     */
    const getVideoSources = useCallback(async (includeWindows: boolean = true): Promise<any[]> => {
        try {
            if (!window.CaptureAPI) {
                console.error('[useVideoRecording] CaptureAPI not available');
                return [];
            }

            const result = await window.CaptureAPI.getVideoSources(includeWindows);

            if (result.success) {
                return result.sources || [];
            } else {
                console.error('[useVideoRecording] Get video sources error:', result.error);
                return [];
            }
        } catch (err: any) {
            console.error('[useVideoRecording] Get video sources error:', err);
            return [];
        }
    }, []);

    /**
     * Check if video recording is supported
     */
    const isSupported = useCallback((): boolean => {
        return (
            typeof navigator !== 'undefined' &&
            typeof navigator.mediaDevices !== 'undefined' &&
            typeof navigator.mediaDevices.getUserMedia === 'function' &&
            typeof MediaRecorder !== 'undefined'
        );
    }, []);

    /**
     * Start video recording
     */
    const startRecording = useCallback(async (options: VideoRecordingOptions = {}): Promise<boolean> => {
        try {
            setError(null);

            if (!isSupported()) {
                throw new Error('Video recording is not supported in this environment');
            }

            const {
                sourceId = null,
                fps = 30,
                videoBitsPerSecond = 2500000,
                width = 1920,
                height = 1080,
                audioEnabled = true
            } = options;

            // Get source ID if not provided
            let targetSourceId = sourceId;
            if (!targetSourceId) {
                const sources = await getVideoSources(false); // Just screens
                if (sources.length === 0) {
                    throw new Error('No screen sources available');
                }
                targetSourceId = sources[0].id;
            }

            console.log(`[useVideoRecording] Starting recording with sourceId: ${targetSourceId}, audio: ${audioEnabled}`);

            // Step 1: Get video stream (without audio in the same call - audio needs separate handling)
            const videoConstraints: MediaStreamConstraints = {
                audio: false,  // We'll get audio separately
                video: {
                    // @ts-ignore - Electron-specific constraint
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: targetSourceId,
                        minWidth: width,
                        maxWidth: width,
                        minHeight: height,
                        maxHeight: height,
                        minFrameRate: fps,
                        maxFrameRate: fps
                    }
                }
            };

            console.log('[useVideoRecording] Getting video stream...');
            const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);

            // Step 2: If audio is enabled, get system audio separately
            // Note: For Electron desktop audio, we MUST request video too (even 1x1), then discard video tracks
            let finalStream: MediaStream;

            if (audioEnabled) {
                try {
                    console.log('[useVideoRecording] Getting system audio stream...');

                    // Get system audio with mandatory minimal video (required for desktop audio capture)
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            // @ts-ignore - Electron-specific constraint for system audio
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: targetSourceId
                            }
                        } as any,
                        video: {
                            // @ts-ignore - Minimal video required for desktop audio capture to work
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: targetSourceId,
                                maxWidth: 1,
                                maxHeight: 1
                            }
                        } as any
                    });

                    // Remove the dummy video tracks from audio stream
                    audioStream.getVideoTracks().forEach(track => {
                        track.stop();
                        audioStream.removeTrack(track);
                    });

                    // Combine video and audio tracks into one stream
                    finalStream = new MediaStream();

                    // Add video tracks from video stream
                    videoStream.getVideoTracks().forEach(track => {
                        finalStream.addTrack(track);
                    });

                    // Add audio tracks from audio stream
                    audioStream.getAudioTracks().forEach(track => {
                        finalStream.addTrack(track);
                        console.log('[useVideoRecording] Added audio track:', track.label);
                    });

                    console.log(`[useVideoRecording] Combined stream - Video tracks: ${finalStream.getVideoTracks().length}, Audio tracks: ${finalStream.getAudioTracks().length}`);

                } catch (audioError) {
                    console.warn('[useVideoRecording] Failed to capture system audio, continuing with video only:', audioError);
                    finalStream = videoStream;
                }
            } else {
                finalStream = videoStream;
            }

            mediaStreamRef.current = finalStream;

            // Get best MIME type and extension
            const { mimeType, extension } = getSupportedMimeType();
            recordingOptionsRef.current = { fps, mimeType, extension, videoBitsPerSecond };

            // Create MediaRecorder with combined stream
            mediaRecorderRef.current = new MediaRecorder(finalStream, {
                mimeType,
                videoBitsPerSecond
            });

            recordedChunksRef.current = [];

            // Handle data available event
            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            // Start recording with timeslice for regular data chunks (every 1 second)
            mediaRecorderRef.current.start(1000);
            setRecordingState('recording');
            startDurationTracking();

            console.log(`[useVideoRecording] Started recording at ${fps} FPS, ${videoBitsPerSecond / 1000000} Mbps, Audio: ${finalStream.getAudioTracks().length > 0 ? 'Yes' : 'No'}`);
            return true;

        } catch (err: any) {
            setError(err.message || 'Failed to start recording');
            console.error('[useVideoRecording] Start recording error:', err);
            cleanupStream();
            return false;
        }
    }, [isSupported, getVideoSources, startDurationTracking, cleanupStream]);

    /**
     * Stop video recording
     */
    const stopRecording = useCallback(async (): Promise<VideoData | null> => {
        return new Promise((resolve) => {
            try {
                setError(null);
                clearDurationInterval();

                if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                    setRecordingState('idle');
                    resolve(null);
                    return;
                }

                mediaRecorderRef.current.onstop = async () => {
                    try {
                        // Calculate recording duration
                        const endTime = Date.now();
                        const totalDuration = endTime - startTimeRef.current - pausedDurationRef.current;

                        // Combine all chunks into a single Blob
                        const { mimeType, fps, extension } = recordingOptionsRef.current;
                        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });

                        // Convert to base64 data URL
                        const arrayBuffer = await videoBlob.arrayBuffer();
                        const base64Data = arrayBufferToBase64(arrayBuffer);
                        const dataUrl = `data:${mimeType};base64,${base64Data}`;

                        // Get video dimensions from stream
                        let width = 0;
                        let height = 0;
                        if (mediaStreamRef.current) {
                            const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
                            if (videoTrack) {
                                const settings = videoTrack.getSettings();
                                width = settings.width || 0;
                                height = settings.height || 0;
                            }
                        }

                        // Cleanup
                        cleanupStream();
                        setRecordingState('idle');
                        setDuration(0);

                        const fileName = `recording-${Date.now()}.${extension}`;

                        console.log(`[useVideoRecording] Stopped recording. Duration: ${totalDuration}ms, Size: ${videoBlob.size} bytes, Format: ${extension}`);

                        resolve({
                            name: fileName,
                            type: mimeType,
                            size: videoBlob.size,
                            data: dataUrl,
                            blob: videoBlob,
                            dimensions: { width, height },
                            duration: totalDuration,
                            fps,
                            timestamp: Date.now()
                        });

                    } catch (error: any) {
                        console.error('[useVideoRecording] Stop recording error:', error);
                        cleanupStream();
                        setRecordingState('idle');
                        setError(error.message || 'Failed to process recording');
                        resolve(null);
                    }
                };

                mediaRecorderRef.current.stop();

            } catch (err: any) {
                setError(err.message || 'Failed to stop recording');
                setRecordingState('idle');
                cleanupStream();
                console.error('[useVideoRecording] Stop recording error:', err);
                resolve(null);
            }
        });
    }, [clearDurationInterval, cleanupStream]);

    /**
     * Pause video recording
     */
    const pauseRecording = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);

            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                return false;
            }

            mediaRecorderRef.current.pause();
            setRecordingState('paused');
            clearDurationInterval();
            pauseStartTimeRef.current = Date.now();

            console.log('[useVideoRecording] Recording paused');
            return true;

        } catch (err: any) {
            setError(err.message || 'Failed to pause recording');
            console.error('[useVideoRecording] Pause recording error:', err);
            return false;
        }
    }, [clearDurationInterval]);

    /**
     * Resume video recording
     */
    const resumeRecording = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);

            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') {
                return false;
            }

            mediaRecorderRef.current.resume();
            setRecordingState('recording');

            // Update paused duration
            pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;

            // Resume duration tracking
            durationIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const elapsed = now - startTimeRef.current - pausedDurationRef.current;
                setDuration(Math.max(0, elapsed));
            }, 100);

            console.log('[useVideoRecording] Recording resumed');
            return true;

        } catch (err: any) {
            setError(err.message || 'Failed to resume recording');
            console.error('[useVideoRecording] Resume recording error:', err);
            return false;
        }
    }, []);

    return {
        // State
        isRecording,
        isPaused,
        recordingState,
        duration,
        error,

        // Actions
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,

        // Utilities
        getVideoSources,
        isSupported
    };
}

export default useVideoRecording;

