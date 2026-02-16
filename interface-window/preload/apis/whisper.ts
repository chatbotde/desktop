
import { ipcRenderer } from 'electron';

export const createWhisperAPI = () => ({
    transcribe: (audioData: ArrayBuffer, format: string) =>
        ipcRenderer.invoke('transcribe-audio-buffer', {
            audioData: new Uint8Array(audioData), // Serialize as array
            format
        })
});
