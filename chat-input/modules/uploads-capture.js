import { showAttachmentLoading, hideAttachmentLoading, addImageAttachment } from './attachments.js';
import { addMediaAttachment } from './richmedia.js';
import { showRecordingState, hideRecordingState } from './recording.js';
import { activateAreaScreenshot } from './area-screenshot-cursor.js';
import { recordingControlPanel } from './recording-control-panel.js';

export async function handleImageUpload() {
    try {
        showAttachmentLoading();
        const result = await window.chatInputAPI.openFilePicker(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']);
        hideAttachmentLoading();
        if (result.success && result.files && result.files.length > 0) {
            for (const file of result.files) addImageAttachment({ name: file.name, type: file.type, size: file.size, data: file.data, source: 'upload' });
        } else if (result.success && result.file) {
            addImageAttachment({ name: result.file.name, type: result.file.type, size: result.file.size, data: result.file.data, source: 'upload' });
        } else if (!result.canceled) { console.error('Failed to upload image:', result.error); }
    } catch (error) {
        hideAttachmentLoading(); console.error('Error uploading image:', error);
    }
}

export async function handleDesktopCapture() {
    try {
        // Skip loading animation for screenshots
        const result = await window.CaptureAPI.quickScreenshot();
        if (result.success && result.screenshot) {
            addImageAttachment({ name: result.screenshot.name, type: result.screenshot.type, size: result.screenshot.size, data: result.screenshot.data, source: 'screenshot' });
        } else { console.error('Failed to take screenshot:', result.error); }
    } catch (error) {
        console.error('Error in desktop capture:', error);
    }
}

export async function handleAreaScreenshot() {
    try {
        // Activate cursor-driven area selection mode
        await activateAreaScreenshot();
    } catch (error) {
        console.error('Error in area screenshot:', error);
    }
}

export async function handleVideoUpload() {
    try {
        showAttachmentLoading();
        const result = await window.chatInputAPI.openFilePicker(['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', '3gp', 'm4v']);
        hideAttachmentLoading();
        if (result.success && result.files && result.files.length > 0) {
            for (const file of result.files) {
                addMediaAttachment({ name: file.name, type: file.type, size: file.size, data: file.data, mediaType: file.type.startsWith('video/') ? 'video' : 'audio', source: 'upload', timestamp: Date.now() });
            }
        } else if (!result.canceled) { console.error('Failed to upload video:', result.error); }
    } catch (error) { hideAttachmentLoading(); console.error('Error uploading video:', error); }
}

export async function handleAudioUpload() {
    try {
        showAttachmentLoading();
        const result = await window.chatInputAPI.openFilePicker(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus']);
        hideAttachmentLoading();
        if (result.success && result.files && result.files.length > 0) {
            for (const file of result.files) {
                addMediaAttachment({ name: file.name, type: file.type, size: file.size, data: file.data, mediaType: file.type.startsWith('audio/') ? 'audio' : 'video', source: 'upload', timestamp: Date.now() });
            }
        } else if (!result.canceled) { console.error('Failed to upload audio:', result.error); }
    } catch (error) { hideAttachmentLoading(); console.error('Error uploading audio:', error); }
}

export async function handleAudioCapture() {
    try {
        if (window.__isRecording?.() && window.__getRecordingType?.() === 'audio') {
            const result = await window.stopCurrentRecording();
            if (result.success) console.log('Audio recording stopped successfully');
        } else if (!window.__isRecording?.()) {
            const result = await window.chatInputAPI.startAudioRecording({
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                processingEnabled: false,
                timesliceMs: 500,
                onChunk: async (blob) => {
                    if (recordingControlPanel.filePath) {
                        const dataUrl = await blob.arrayBuffer().then(buf => {
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                            return base64;
                        });
                        await window.electron.invoke('media:write', { 
                            filePath: recordingControlPanel.filePath, 
                            base64: dataUrl 
                        });
                        recordingControlPanel.updateStats(blob);
                    }
                }
            });
            if (result.success) {
                window.currentAudioRecordingId = result.recordingId;
                await recordingControlPanel.show('audio', result.recordingId, {
                    filePath: null
                });
            } else {
                console.error('Failed to start audio recording:', result.error);
            }
        }
    } catch (error) {
        console.error('Error in audio capture:', error);
    }
}

export async function handleVideoCapture() {
    try {
        if (window.__isRecording?.() && window.__getRecordingType?.() === 'video') {
            const result = await window.stopCurrentRecording(); if (result.success) console.log('Video recording stopped successfully');
        } else if (!window.__isRecording?.()) {
            const result = await window.chatInputAPI.startVideoRecording({
                quality: 'medium',
                includeAudio: true,
                processingEnabled: false,
                timesliceMs: 1000,
                onChunk: async (blob) => {
                    if (recordingControlPanel.filePath) {
                        const dataUrl = await blob.arrayBuffer().then(buf => {
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                            return base64;
                        });
                        await window.electron.invoke('media:write', { 
                            filePath: recordingControlPanel.filePath, 
                            base64: dataUrl 
                        });
                        recordingControlPanel.updateStats(blob);
                    }
                }
            });
            if (result.success) {
                window.currentVideoRecordingId = result.recordingId;
                await recordingControlPanel.show('video', result.recordingId, {
                    filePath: null
                });
            } else {
                console.error('Failed to start video recording:', result.error);
            }
        }
    } catch (error) {
        console.error('Error in video capture:', error);
    }
}


