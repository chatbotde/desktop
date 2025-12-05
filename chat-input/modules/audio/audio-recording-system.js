/**
 * Audio Recording System - SOLID Compliant Architecture
 * 
 * This module consolidates all audio-related functionality following SOLID principles:
 * - Single Responsibility Principle: Each class has one clear responsibility
 * - Open/Closed Principle: Extensible through interfaces and strategies
 * - Liskov Substitution Principle: Interfaces are substitutable
 * - Interface Segregation Principle: Focused, client-specific interfaces
 * - Dependency Inversion Principle: Dependencies injected, not created
 */

import { addMediaAttachment } from '../media/richmedia.js';

// ============================================================================
// INTERFACES & ABSTRACTIONS
// ============================================================================

/**
 * Interface for audio source strategies
 */
class IAudioSourceStrategy {
    async startRecording(options) {
        throw new Error('Must implement startRecording');
    }
    
    async stopRecording() {
        throw new Error('Must implement stopRecording');
    }
    
    cleanup() {
        throw new Error('Must implement cleanup');
    }
    
    getSourceName() {
        throw new Error('Must implement getSourceName');
    }
}

/**
 * Interface for transcription service
 */
class ITranscriptionService {
    async transcribeFile(audioBlob) {
        throw new Error('Must implement transcribeFile');
    }
    
    async startRealtimeTranscription(onTranscript, onError, stream) {
        throw new Error('Must implement startRealtimeTranscription');
    }
    
    stopRealtimeTranscription() {
        throw new Error('Must implement stopRealtimeTranscription');
    }
}

// ============================================================================
// AUDIO SOURCE STRATEGIES (Open/Closed Principle)
// ============================================================================

/**
 * Microphone Audio Source Strategy
 */
class MicrophoneAudioSource extends IAudioSourceStrategy {
    constructor() {
        super();
        this.stream = null;
        this.recorder = null;
        this.chunks = [];
        this.mimeType = null;
    }
    
    async startRecording(options = {}) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                },
                video: false
            });
            
            this.mimeType = this._getSupportedMimeType();
            this.recorder = new MediaRecorder(this.stream, {
                mimeType: this.mimeType,
                audioBitsPerSecond: 128000
            });
            
            this.chunks = [];
            this.recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.chunks.push(event.data);
                }
            };
            
            this.recorder.start(500);
            
            return {
                success: true,
                recordingId: `mic_${Date.now()}`,
                stream: this.stream,
                recorder: this.recorder
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async stopRecording() {
        return new Promise((resolve) => {
            if (!this.recorder) {
                resolve({ success: false, error: 'No active recorder' });
                return;
            }
            
            this.recorder.onstop = async () => {
                const blob = new Blob(this.chunks, { type: this.mimeType });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    resolve({
                        success: true,
                        data: base64Data,
                        mimeType: this.mimeType,
                        size: blob.size,
                        blob: blob
                    });
                };
                
                reader.readAsDataURL(blob);
            };
            
            if (this.recorder.state !== 'inactive') {
                this.recorder.stop();
            }
        });
    }
    
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.recorder = null;
        this.chunks = [];
    }
    
    getSourceName() {
        return 'Microphone';
    }
    
    _getSupportedMimeType() {
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
}

/**
 * System Audio Source Strategy
 */
class SystemAudioSource extends IAudioSourceStrategy {
    constructor() {
        super();
        this.stream = null;
        this.recorder = null;
        this.chunks = [];
        this.mimeType = null;
    }
    
    async startRecording(options = {}) {
        try {
            const sources = await window.chatInputAPI?.getScreenshotSources?.(false);
            if (!sources?.success || !sources.sources?.length) {
                throw new Error('No screen sources available');
            }
            
            const screenSource = sources.sources.find(s => s.type === 'screen') || sources.sources[0];
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: screenSource.id
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: screenSource.id,
                        maxWidth: 1,
                        maxHeight: 1
                    }
                }
            });
            
            // Remove video track
            this.stream.getVideoTracks().forEach(track => {
                track.stop();
                this.stream.removeTrack(track);
            });
            
            this.mimeType = this._getSupportedMimeType();
            this.recorder = new MediaRecorder(this.stream, {
                mimeType: this.mimeType,
                audioBitsPerSecond: 128000
            });
            
            this.chunks = [];
            this.recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.chunks.push(event.data);
                }
            };
            
            this.recorder.start(500);
            
            return {
                success: true,
                recordingId: `system_${Date.now()}`,
                stream: this.stream,
                recorder: this.recorder
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async stopRecording() {
        return new Promise((resolve) => {
            if (!this.recorder) {
                resolve({ success: false, error: 'No active recorder' });
                return;
            }
            
            this.recorder.onstop = async () => {
                const blob = new Blob(this.chunks, { type: this.mimeType });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    resolve({
                        success: true,
                        data: base64Data,
                        mimeType: this.mimeType,
                        size: blob.size,
                        blob: blob
                    });
                };
                
                reader.readAsDataURL(blob);
            };
            
            if (this.recorder.state !== 'inactive') {
                this.recorder.stop();
            }
        });
    }
    
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.recorder = null;
        this.chunks = [];
    }
    
    getSourceName() {
        return 'System Audio';
    }
    
    _getSupportedMimeType() {
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
}

/**
 * Mixed Audio Source Strategy (Microphone + System)
 */
class MixedAudioSource extends IAudioSourceStrategy {
    constructor() {
        super();
        this.micStream = null;
        this.systemStream = null;
        this.audioContext = null;
        this.destinationStream = null;
        this.recorder = null;
        this.chunks = [];
        this.mimeType = null;
    }
    
    async startRecording(options = {}) {
        try {
            // Get microphone stream
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                },
                video: false
            });
            
            // Try to get system audio
            try {
                const sources = await window.chatInputAPI?.getScreenshotSources?.(false);
                if (sources?.success && sources.sources?.length) {
                    const screenSource = sources.sources.find(s => s.type === 'screen') || sources.sources[0];
                    
                    const sysStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: screenSource.id
                            }
                        },
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: screenSource.id,
                                maxWidth: 1,
                                maxHeight: 1
                            }
                        }
                    });
                    
                    sysStream.getVideoTracks().forEach(track => {
                        track.stop();
                        sysStream.removeTrack(track);
                    });
                    
                    this.systemStream = sysStream;
                }
            } catch (sysError) {
                console.warn('Could not capture system audio:', sysError.message);
            }
            
            // Mix streams using Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = this.audioContext.createMediaStreamDestination();
            
            // Connect microphone
            const micSource = this.audioContext.createMediaStreamSource(this.micStream);
            const micGain = this.audioContext.createGain();
            micGain.gain.value = 1.0;
            micSource.connect(micGain);
            micGain.connect(destination);
            
            // Connect system audio if available
            if (this.systemStream && this.systemStream.getAudioTracks().length > 0) {
                const sysSource = this.audioContext.createMediaStreamSource(this.systemStream);
                const sysGain = this.audioContext.createGain();
                sysGain.gain.value = 0.8;
                sysSource.connect(sysGain);
                sysGain.connect(destination);
            }
            
            this.destinationStream = destination.stream;
            this.mimeType = this._getSupportedMimeType();
            this.recorder = new MediaRecorder(this.destinationStream, {
                mimeType: this.mimeType,
                audioBitsPerSecond: 128000
            });
            
            this.chunks = [];
            this.recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.chunks.push(event.data);
                }
            };
            
            this.recorder.start(500);
            
            return {
                success: true,
                recordingId: `mixed_${Date.now()}`,
                stream: this.destinationStream,
                recorder: this.recorder
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async stopRecording() {
        return new Promise((resolve) => {
            if (!this.recorder) {
                resolve({ success: false, error: 'No active recorder' });
                return;
            }
            
            this.recorder.onstop = async () => {
                const blob = new Blob(this.chunks, { type: this.mimeType });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    resolve({
                        success: true,
                        data: base64Data,
                        mimeType: this.mimeType,
                        size: blob.size,
                        blob: blob
                    });
                };
                
                reader.readAsDataURL(blob);
            };
            
            if (this.recorder.state !== 'inactive') {
                this.recorder.stop();
            }
        });
    }
    
    cleanup() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.systemStream) {
            this.systemStream.getTracks().forEach(track => track.stop());
            this.systemStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.destinationStream = null;
        this.recorder = null;
        this.chunks = [];
    }
    
    getSourceName() {
        return 'Mic + System';
    }
    
    _getSupportedMimeType() {
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
}

// ============================================================================
// RECORDING STATE MANAGER (Single Responsibility)
// ============================================================================

/**
 * Manages recording state and timing
 */
class RecordingStateManager {
    constructor() {
        this.recordingId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.audioSource = 'microphone';
        this.pendingAudio = null;
    }
    
    startRecording(recordingId) {
        this.recordingId = recordingId;
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = true;
    }
    
    pauseRecording() {
        this.isPaused = true;
        this.pausedTime = Date.now() - this.startTime;
    }
    
    resumeRecording() {
        this.isPaused = false;
        this.startTime = Date.now() - this.pausedTime;
    }
    
    stopRecording(audioData) {
        this.isRecording = false;
        this.pendingAudio = audioData;
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        return duration;
    }
    
    reset() {
        this.recordingId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.pendingAudio = null;
    }
    
    setAudioSource(source) {
        this.audioSource = source;
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        if (this.isPaused) return this.pausedTime;
        return Date.now() - this.startTime;
    }
}

// ============================================================================
// TRANSCRIPTION SERVICE (Dependency Inversion)
// ============================================================================

/**
 * AssemblyAI Transcription Service
 */
class AssemblyAITranscriptionService extends ITranscriptionService {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey || "2a1a1ee819a3433da7f995354c54e86a";
        this.baseUrl = "https://api.assemblyai.com/v2";
        this.socket = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.scriptProcessor = null;
        this.isStreaming = false;
        this.usingSharedStream = false;
    }
    
    async transcribeFile(audioBlob) {
        try {
            // Upload
            const uploadUrl = `${this.baseUrl}/upload`;
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': audioBlob.type || 'application/octet-stream'
                },
                body: audioBlob
            });
            
            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }
            
            const uploadData = await uploadResponse.json();
            const audioUrl = uploadData.upload_url;
            
            // Request transcription
            const transcriptUrl = `${this.baseUrl}/transcript`;
            const transcriptResponse = await fetch(transcriptUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    speech_models: ["universal"]
                })
            });
            
            if (!transcriptResponse.ok) {
                const errorText = await transcriptResponse.text();
                throw new Error(`Transcription failed: ${transcriptResponse.status} - ${errorText}`);
            }
            
            const transcriptData = await transcriptResponse.json();
            return await this._pollForTranscript(transcriptData.id);
        } catch (error) {
            throw error;
        }
    }
    
    async startRealtimeTranscription(onTranscript, onError, existingStream = null) {
        if (this.isStreaming) return;
        
        try {
            if (existingStream) {
                this.mediaStream = existingStream;
                this.usingSharedStream = true;
            } else {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.usingSharedStream = false;
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = this.audioContext.sampleRate;
            
            const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${this.apiKey}`;
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.message_type === 'FinalTranscript' || data.message_type === 'PartialTranscript') {
                    if (onTranscript) onTranscript(data);
                }
            };
            
            this.socket.onerror = (error) => {
                if (onError) onError(error);
            };
            
            this.socket.onclose = () => {
                this._cleanupStreaming();
            };
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);
            
            this.scriptProcessor.onaudioprocess = (e) => {
                if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = this._floatTo16BitPCM(inputData);
                this.socket.send(pcmData);
            };
            
            this.isStreaming = true;
        } catch (error) {
            if (onError) onError(error);
            this._cleanupStreaming();
        }
    }
    
    stopRealtimeTranscription() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ terminate_session: true }));
            this.socket.close();
        }
        this._cleanupStreaming();
    }
    
    _cleanupStreaming() {
        this.isStreaming = false;
        if (this.mediaStream && !this.usingSharedStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.mediaStream = null;
        this.usingSharedStream = false;
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.socket = null;
    }
    
    _floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }
    
    async _pollForTranscript(transcriptId) {
        const pollingEndpoint = `${this.baseUrl}/transcript/${transcriptId}`;
        
        while (true) {
            const pollingResponse = await fetch(pollingEndpoint, {
                headers: { 'Authorization': this.apiKey }
            });
            
            if (!pollingResponse.ok) {
                throw new Error(`Polling failed: ${pollingResponse.statusText}`);
            }
            
            const result = await pollingResponse.json();
            
            if (result.status === 'completed') {
                return result.text;
            } else if (result.status === 'error') {
                throw new Error(`Transcription failed: ${result.error}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

// ============================================================================
// AUDIO RECORDING CONTROLLER (Orchestration)
// ============================================================================

/**
 * Main controller that orchestrates audio recording
 */
export class AudioRecordingController {
    constructor(transcriptionService) {
        this.stateManager = new RecordingStateManager();
        this.transcriptionService = transcriptionService;
        this.sourceStrategies = {
            microphone: new MicrophoneAudioSource(),
            system: new SystemAudioSource(),
            both: new MixedAudioSource()
        };
        this.currentStrategy = null;
        this.currentRecorder = null;
        this.currentStream = null;
    }
    
    async startRecording(sourceType = 'microphone', options = {}) {
        this.currentStrategy = this.sourceStrategies[sourceType];
        if (!this.currentStrategy) {
            return { success: false, error: 'Invalid source type' };
        }
        
        const result = await this.currentStrategy.startRecording(options);
        if (result.success) {
            this.stateManager.startRecording(result.recordingId);
            this.stateManager.setAudioSource(sourceType);
            this.currentRecorder = result.recorder;
            this.currentStream = result.stream;
        }
        
        return result;
    }
    
    async stopRecording() {
        if (!this.currentStrategy) {
            return { success: false, error: 'No active recording' };
        }
        
        const result = await this.currentStrategy.stopRecording();
        if (result.success) {
            const duration = this.stateManager.stopRecording(result);
            result.duration = duration;
            result.source = this.stateManager.audioSource;
        }
        
        return result;
    }
    
    async pauseRecording() {
        if (!this.currentRecorder || !this.stateManager.isRecording) {
            return { success: false, error: 'No active recording' };
        }
        
        try {
            if (this.currentRecorder.state === 'recording') {
                this.currentRecorder.pause();
                this.stateManager.pauseRecording();
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async resumeRecording() {
        if (!this.currentRecorder || !this.stateManager.isPaused) {
            return { success: false, error: 'No paused recording' };
        }
        
        try {
            if (this.currentRecorder.state === 'paused') {
                this.currentRecorder.resume();
                this.stateManager.resumeRecording();
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async switchSource(newSourceType, options = {}) {
        if (!this.stateManager.isRecording) {
            return { success: false, error: 'No active recording' };
        }
        
        // Stop current
        if (this.currentRecorder && this.currentRecorder.state !== 'inactive') {
            this.currentRecorder.stop();
        }
        this.currentStrategy.cleanup();
        
        // Start new
        const result = await this.startRecording(newSourceType, options);
        return result;
    }
    
    async transcribeRecording(audioBlob) {
        return await this.transcriptionService.transcribeFile(audioBlob);
    }
    
    async startLiveTranscription(onTranscript, onError) {
        return await this.transcriptionService.startRealtimeTranscription(
            onTranscript,
            onError,
            this.currentStream
        );
    }
    
    stopLiveTranscription() {
        this.transcriptionService.stopRealtimeTranscription();
    }
    
    cleanup() {
        if (this.currentStrategy) {
            this.currentStrategy.cleanup();
        }
        this.stateManager.reset();
        this.currentRecorder = null;
        this.currentStream = null;
    }
    
    getState() {
        return {
            isRecording: this.stateManager.isRecording,
            isPaused: this.stateManager.isPaused,
            elapsedTime: this.stateManager.getElapsedTime(),
            audioSource: this.stateManager.audioSource,
            pendingAudio: this.stateManager.pendingAudio
        };
    }
}

// ============================================================================
// FACTORY (Dependency Injection)
// ============================================================================

/**
 * Factory for creating audio recording controller with dependencies
 */
export class AudioRecordingFactory {
    static create(apiKey) {
        const transcriptionService = new AssemblyAITranscriptionService(apiKey);
        return new AudioRecordingController(transcriptionService);
    }
}

// ============================================================================
// EXPORT FOR BACKWARD COMPATIBILITY
// ============================================================================

export {
    IAudioSourceStrategy,
    ITranscriptionService,
    MicrophoneAudioSource,
    SystemAudioSource,
    MixedAudioSource,
    RecordingStateManager,
    AssemblyAITranscriptionService
};
