/**
 * Capture API
 * Provides screenshot and video recording functionality
 */

import { ipcRenderer } from 'electron';
import { CaptureAPI, ScreenshotOptions, VideoRecordingOptions, SelectionArea } from '../types';

export function createCaptureAPI(): CaptureAPI {
    return {
        // ==================== SCREENSHOT METHODS ====================

        /**
         * Take a screenshot
         * @param options - Screenshot options
         * @returns Screenshot result
         */
        takeScreenshot: (options: ScreenshotOptions = {}) => {
            return ipcRenderer.invoke('interface-capture-screenshot', options);
        },

        /**
         * Take a screenshot of a specific window
         * @param windowId - Window ID
         * @param options - Screenshot options
         * @returns Screenshot result
         */
        takeWindowScreenshot: (windowId: string, options: ScreenshotOptions = {}) => {
            return ipcRenderer.invoke('interface-capture-window-screenshot', windowId, options);
        },

        /**
         * Take a screenshot of a specific area
         * @param area - Area coordinates {x, y, width, height}
         * @param options - Screenshot options
         * @returns Screenshot result
         */
        takeAreaScreenshot: (area: SelectionArea, options: ScreenshotOptions = {}) => {
            return ipcRenderer.invoke('interface-capture-area-screenshot', area, options);
        },

        /**
         * Get available screenshot sources
         * @param includeWindows - Include window sources
         * @returns Available sources
         */
        getScreenshotSources: (includeWindows: boolean = true) => {
            return ipcRenderer.invoke('interface-get-screenshot-sources', includeWindows);
        },

        /**
         * Quick screenshot capture (convenience method)
         * @returns Screenshot result
         */
        quickScreenshot: () => {
            console.log('[Preload] quickScreenshot called, invoking interface-quick-screenshot');
            return ipcRenderer.invoke('interface-quick-screenshot');
        },

        /**
         * Check capture support
         * @returns Support status
         */
        checkSupport: () => {
            return ipcRenderer.invoke('interface-check-capture-support');
        },

        // ==================== VIDEO RECORDING METHODS ====================

        /**
         * Start video recording
         * @param options - Recording options (fps, videoBitsPerSecond, width, height, audioEnabled)
         * @returns Recording result
         */
        startVideoRecording: (options: VideoRecordingOptions = {}) => {
            console.log('[Preload] startVideoRecording called with options:', options);
            return ipcRenderer.invoke('interface-start-video-recording', options);
        },

        /**
         * Stop video recording
         * @returns Recording result with video data
         */
        stopVideoRecording: () => {
            console.log('[Preload] stopVideoRecording called');
            return ipcRenderer.invoke('interface-stop-video-recording');
        },

        /**
         * Pause video recording
         * @returns Pause result
         */
        pauseVideoRecording: () => {
            return ipcRenderer.invoke('interface-pause-video-recording');
        },

        /**
         * Resume video recording
         * @returns Resume result
         */
        resumeVideoRecording: () => {
            return ipcRenderer.invoke('interface-resume-video-recording');
        },

        /**
         * Get current recording state
         * @returns Recording state ('idle' | 'recording' | 'paused')
         */
        getVideoRecordingState: () => {
            return ipcRenderer.invoke('interface-get-video-recording-state');
        },

        /**
         * Get current recording duration in milliseconds
         * @returns Recording duration
         */
        getVideoRecordingDuration: () => {
            return ipcRenderer.invoke('interface-get-video-recording-duration');
        },

        /**
         * Start area video recording
         * @param area - Area coordinates {x, y, width, height}
         * @param options - Recording options
         * @returns Recording result
         */
        startAreaVideoRecording: (area: SelectionArea, options: VideoRecordingOptions = {}) => {
            return ipcRenderer.invoke('interface-start-area-video-recording', area, options);
        },

        /**
         * Get available video sources
         * @param includeWindows - Include window sources
         * @returns Available sources
         */
        getVideoSources: (includeWindows: boolean = true) => {
            return ipcRenderer.invoke('interface-get-video-sources', includeWindows);
        }
    };
}

/**
 * Create a fallback Capture API for error scenarios
 */
export function createFallbackCaptureAPI(): Partial<CaptureAPI> {
    return {
        quickScreenshot: () => {
            console.error('[Preload] CaptureAPI not fully loaded, but quickScreenshot stub available');
            return Promise.resolve({ success: false, error: 'CaptureAPI not properly initialized' });
        }
    };
}
