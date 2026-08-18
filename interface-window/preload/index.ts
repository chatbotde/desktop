/**
 * Preload Script
 * Exposes secure APIs to the renderer process via contextBridge
 */

import { contextBridge } from 'electron';
import {
    createInterfaceAPI,
    createElectronAPI,
    createTsfAPI,
    createCaptureAPI,
    createFallbackCaptureAPI,
    createBlockAPI,
    createAuthAPI,
    createFileAPI,
    createYouTubeTranscriptAPI,
    createWhisperAPI,
    createComposioAPI,
    createMcpAPI,
    createCuaAPI,
    createRemotePadAPI,
    createManimVideoAPI,
    createMediaAPI,
    createSkillsAPI,
} from './apis';

// Verify contextBridge is available
if (!contextBridge) {
    console.error('[Preload] contextBridge is not available!');
}

console.log('[Preload] Starting to expose APIs...');

// Expose interfaceAPI
try {
    const interfaceAPI = createInterfaceAPI();
    contextBridge.exposeInMainWorld('interfaceAPI', interfaceAPI);
    console.log('[Preload] interfaceAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing interfaceAPI:', error);
}

// Expose electronAPI
try {
    const electronAPI = createElectronAPI();
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('[Preload] electronAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing electronAPI:', error);
}

// Expose tsfAPI
try {
    const tsfAPI = createTsfAPI();
    contextBridge.exposeInMainWorld('tsfAPI', tsfAPI);
    console.log('[Preload] tsfAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing tsfAPI:', error);
}

// Expose CaptureAPI
console.log('[Preload] Exposing CaptureAPI to renderer...');
try {
    const captureAPI = createCaptureAPI();
    contextBridge.exposeInMainWorld('CaptureAPI', captureAPI);
    console.log('[Preload] CaptureAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing CaptureAPI:', error);
    // Try to expose a minimal API for debugging
    try {
        const fallbackCaptureAPI = createFallbackCaptureAPI();
        contextBridge.exposeInMainWorld('CaptureAPI', fallbackCaptureAPI);
        console.log('[Preload] Fallback CaptureAPI exposed');
    } catch (fallbackError) {
        console.error('[Preload] Even fallback API failed:', fallbackError);
    }
}

// Expose blockAPI
try {
    const blockAPI = createBlockAPI();
    contextBridge.exposeInMainWorld('blockAPI', blockAPI);
    console.log('[Preload] blockAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing blockAPI:', error);
}

// Expose authAPI
try {
    const authAPI = createAuthAPI();
    contextBridge.exposeInMainWorld('authAPI', authAPI);
    console.log('[Preload] authAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing authAPI:', error);
}

// Expose fileAPI
try {
    const fileAPI = createFileAPI();
    contextBridge.exposeInMainWorld('fileAPI', fileAPI);
    console.log('[Preload] fileAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing fileAPI:', error);
}

// Expose youtubeTranscriptAPI
try {
    const youtubeTranscriptAPI = createYouTubeTranscriptAPI();
    contextBridge.exposeInMainWorld('youtubeTranscriptAPI', youtubeTranscriptAPI);
    console.log('[Preload] youtubeTranscriptAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing youtubeTranscriptAPI:', error);
}

// Expose whisperAPI
try {
    const whisperAPI = createWhisperAPI();
    contextBridge.exposeInMainWorld('whisperAPI', whisperAPI);
    console.log('[Preload] whisperAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing whisperAPI:', error);
}

// Expose composioAPI
try {
    const composioAPI = createComposioAPI();
    contextBridge.exposeInMainWorld('composioAPI', composioAPI);
    console.log('[Preload] composioAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing composioAPI:', error);
}

// Expose mcpAPI
try {
    const mcpAPI = createMcpAPI();
    contextBridge.exposeInMainWorld('mcpAPI', mcpAPI);
    console.log('[Preload] mcpAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing mcpAPI:', error);
}

// Expose cuaAPI
try {
    const cuaAPI = createCuaAPI();
    contextBridge.exposeInMainWorld('cuaAPI', cuaAPI);
    console.log('[Preload] cuaAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing cuaAPI:', error);
}

// Expose remotePadAPI
try {
    const remotePadAPI = createRemotePadAPI();
    contextBridge.exposeInMainWorld('remotePadAPI', remotePadAPI);
    console.log('[Preload] remotePadAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing remotePadAPI:', error);
}

// Expose manimVideoAPI
try {
    const manimVideoAPI = createManimVideoAPI();
    contextBridge.exposeInMainWorld('manimVideoAPI', manimVideoAPI);
    console.log('[Preload] manimVideoAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing manimVideoAPI:', error);
}

// Expose mediaAPI (short recording → GIF)
try {
    const mediaAPI = createMediaAPI();
    contextBridge.exposeInMainWorld('mediaAPI', mediaAPI);
    console.log('[Preload] mediaAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing mediaAPI:', error);
}

// Expose skillsAPI
try {
    const skillsAPI = createSkillsAPI();
    contextBridge.exposeInMainWorld('skillsAPI', skillsAPI);
    console.log('[Preload] skillsAPI exposed successfully');
} catch (error) {
    console.error('[Preload] Error exposing skillsAPI:', error);
}

console.log('[Preload] All APIs exposed, preload script complete');

// Re-export types for convenience
export * from './types';
