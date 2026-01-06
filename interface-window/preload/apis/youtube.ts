/**
 * YouTube Transcript API for Preload
 * Exposes YouTube transcript functionality to the renderer process
 */

import { ipcRenderer } from 'electron';

// IPC Channel names (must match main process)
const IPC_CHANNELS = {
    GET_TRANSCRIPT: 'youtube-transcript:get-transcript',
    GET_LANGUAGES: 'youtube-transcript:get-languages',
    VALIDATE_URL: 'youtube-transcript:validate-url',
} as const;

export interface TranscriptOptions {
    language?: string;
    includeTimestamps?: boolean;
}

export interface TranscriptResult {
    success: boolean;
    transcript?: string;
    language?: {
        code: string;
        name: string;
    };
    videoId?: string;
    error?: string;
}

export interface ValidationResult {
    valid: boolean;
    videoId?: string;
    error?: string;
}

export interface YouTubeTranscriptAPI {
    getTranscript: (url: string, options?: TranscriptOptions) => Promise<TranscriptResult>;
    getLanguages: (url: string) => Promise<{ success: boolean; languages?: any[]; error?: string }>;
    validateUrl: (url: string) => Promise<ValidationResult>;
}

export function createYouTubeTranscriptAPI(): YouTubeTranscriptAPI {
    return {
        /**
         * Get transcript for a YouTube video
         */
        getTranscript: async (url: string, options?: TranscriptOptions): Promise<TranscriptResult> => {
            try {
                const result = await ipcRenderer.invoke(IPC_CHANNELS.GET_TRANSCRIPT, { url, options });
                return result;
            } catch (error) {
                console.error('[YouTubeTranscriptAPI] getTranscript error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                };
            }
        },

        /**
         * Get available languages for a YouTube video
         */
        getLanguages: async (url: string) => {
            try {
                const result = await ipcRenderer.invoke(IPC_CHANNELS.GET_LANGUAGES, { url });
                return result;
            } catch (error) {
                console.error('[YouTubeTranscriptAPI] getLanguages error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                };
            }
        },

        /**
         * Validate a YouTube URL
         */
        validateUrl: async (url: string): Promise<ValidationResult> => {
            try {
                const result = await ipcRenderer.invoke(IPC_CHANNELS.VALIDATE_URL, { url });
                return result;
            } catch (error) {
                console.error('[YouTubeTranscriptAPI] validateUrl error:', error);
                return {
                    valid: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                };
            }
        },
    };
}
