import { ipcRenderer } from 'electron';

export interface MediaGifSupport {
    ffmpeg: boolean;
    maxDurationSeconds: number;
    ffmpegPath?: string;
    error?: string;
}

export interface ConvertVideoToGifRequest {
    videoBase64: string;
    mimeType?: string;
    fileName?: string;
    durationSeconds: number;
}

export interface ConvertVideoToGifResult {
    success: boolean;
    error?: string;
    gifBase64?: string;
    fileName?: string;
    mimeType?: string;
    maxDurationSeconds?: number;
}

export function createMediaAPI() {
    return {
        checkGifSupport: (): Promise<MediaGifSupport> =>
            ipcRenderer.invoke('media:check-gif-support'),
        convertVideoToGif: (request: ConvertVideoToGifRequest): Promise<ConvertVideoToGifResult> =>
            ipcRenderer.invoke('media:convert-video-to-gif', request),
    };
}
