/**
 * useGeminiLiveAudioStream Hook
 * 
 * Real-time bidirectional audio streaming with Gemini Native Audio model.
 * Uses @google/genai SDK's live.connect() for WebSocket communication.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export type AudioState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface GeminiLiveStreamState {
    audioState: AudioState;
    isConnected: boolean;
    isStreaming: boolean;
    error: string | null;
}

export interface UseGeminiLiveAudioStreamOptions {
    modelId?: string;
    voiceName?: 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' | 'Puck';
    systemInstruction?: string;
    onStateChange?: (state: GeminiLiveStreamState) => void;
    onAudioStateChange?: (state: AudioState) => void;
    onError?: (error: string) => void;
    onTranscript?: (text: string) => void;
}

// PCM audio utilities
function float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

function int16ToFloat32(int16Array: Int16Array): Float32Array {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32Array;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function useGeminiLiveAudioStream(options: UseGeminiLiveAudioStreamOptions = {}) {
    const {
        // For Gemini Developer API (non-Vertex), use gemini-live-2.5-flash-preview
        modelId = 'gemini-live-2.5-flash-preview',
        voiceName = 'Aoede',
        systemInstruction = 'You are a helpful and friendly AI assistant.',
        onStateChange,
        onAudioStateChange,
        onError,
        onTranscript,
    } = options;

    const [state, setState] = useState<GeminiLiveStreamState>({
        audioState: 'idle',
        isConnected: false,
        isStreaming: false,
        error: null,
    });

    // All refs for managing resources
    const sessionRef = useRef<any>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const isActiveRef = useRef(false);
    const setupCompleteRef = useRef(false);

    // Update state
    const updateState = useCallback((newState: Partial<GeminiLiveStreamState>) => {
        setState(prev => {
            const updated = { ...prev, ...newState };
            onStateChange?.(updated);
            if (newState.audioState !== undefined && newState.audioState !== prev.audioState) {
                onAudioStateChange?.(newState.audioState);
            }
            return updated;
        });
    }, [onStateChange, onAudioStateChange]);

    // Get API key from environment
    const getApiKey = useCallback((): string | null => {
        // Check localStorage first
        const storedKey = localStorage.getItem('google-api-key');
        if (storedKey) return storedKey;

        // Check Vite environment variable
        try {
            const envKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY;
            if (envKey) return envKey;
        } catch {
            // ignore
        }

        return null;
    }, []);

    // Play queued audio
    const playAudioQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
            playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        if (playbackContextRef.current.state === 'suspended') {
            await playbackContextRef.current.resume();
        }

        isPlayingRef.current = true;
        updateState({ audioState: 'speaking' });

        while (audioQueueRef.current.length > 0 && isActiveRef.current) {
            const audioData = audioQueueRef.current.shift();
            if (!audioData || audioData.length === 0) continue;

            try {
                const buffer = playbackContextRef.current.createBuffer(1, audioData.length, 24000);
                buffer.getChannelData(0).set(audioData);

                const source = playbackContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(playbackContextRef.current.destination);

                await new Promise<void>(resolve => {
                    source.onended = () => resolve();
                    source.start();
                });
            } catch (e) {
                console.error('[GeminiLive] Playback error:', e);
            }
        }

        isPlayingRef.current = false;
        if (isActiveRef.current) {
            updateState({ audioState: 'listening' });
        }
    }, [updateState]);

    // Cleanup all resources
    const cleanup = useCallback(() => {
        console.log('[GeminiLive] Cleanup');
        isActiveRef.current = false;
        setupCompleteRef.current = false;

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }

        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }

        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) {
                // ignore
            }
            sessionRef.current = null;
        }

        audioQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    // Stop streaming
    const stopStreaming = useCallback(() => {
        cleanup();
        updateState({
            isConnected: false,
            isStreaming: false,
            audioState: 'idle',
            error: null
        });
    }, [cleanup, updateState]);

    // Start streaming
    const startStreaming = useCallback(async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            const err = 'API key not found. Set VITE_GOOGLE_API_KEY in .env or google-api-key in localStorage.';
            console.error('[GeminiLive]', err);
            updateState({ error: err, audioState: 'error' });
            onError?.(err);
            return false;
        }

        console.log('[GeminiLive] Starting with API key:', apiKey.slice(0, 10) + '...');
        
        cleanup();
        isActiveRef.current = true;
        updateState({ audioState: 'connecting', error: null, isStreaming: true });

        try {
            // 1. Get microphone
            console.log('[GeminiLive] Requesting microphone...');
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
            micStreamRef.current = micStream;
            console.log('[GeminiLive] Microphone ready, tracks:', micStream.getAudioTracks().length);

            // 2. Connect to Gemini
            console.log('[GeminiLive] Creating GoogleGenAI client...');
            const ai = new GoogleGenAI({ apiKey });
            console.log('[GeminiLive] GoogleGenAI client created, connecting to model:', modelId);

            let session;
            try {
                session = await ai.live.connect({
                    model: modelId,
                    callbacks: {
                        onopen: () => {
                            console.log('[GeminiLive] WebSocket connected to model:', modelId);
                        },
                        onmessage: (message: any) => {
                            console.log('[GeminiLive] Message received:', JSON.stringify(message).slice(0, 500));
                            
                            // Setup complete
                            if (message.setupComplete) {
                                console.log('[GeminiLive] Setup complete - ready to receive audio');
                                setupCompleteRef.current = true;
                                updateState({ isConnected: true, audioState: 'listening' });
                                return;
                            }

                            // Interrupted
                            if (message.serverContent?.interrupted) {
                                console.log('[GeminiLive] Interrupted by server');
                                audioQueueRef.current = [];
                                isPlayingRef.current = false;
                                return;
                            }

                            // Audio/text response
                            if (message.serverContent?.modelTurn?.parts) {
                                console.log('[GeminiLive] Model turn received with', message.serverContent.modelTurn.parts.length, 'parts');
                                for (const part of message.serverContent.modelTurn.parts) {
                                    // Audio
                                    if (part.inlineData?.data) {
                                        console.log('[GeminiLive] Audio data received, length:', part.inlineData.data.length);
                                        const buffer = base64ToArrayBuffer(part.inlineData.data);
                                        const int16 = new Int16Array(buffer);
                                        const float32 = int16ToFloat32(int16);
                                        audioQueueRef.current.push(float32);
                                        playAudioQueue();
                                    }
                                    // Text
                                    if (part.text) {
                                        console.log('[GeminiLive] Text response:', part.text);
                                        onTranscript?.(part.text);
                                    }
                                }
                            }

                            // Turn complete
                            if (message.serverContent?.turnComplete) {
                                console.log('[GeminiLive] Turn complete');
                            }
                        },
                        onerror: (e: any) => {
                            console.error('[GeminiLive] WebSocket error:', e);
                            console.error('[GeminiLive] Error details:', JSON.stringify(e, null, 2));
                            onError?.(e?.message || 'Connection error');
                        },
                        onclose: (e: any) => {
                            console.log('[GeminiLive] WebSocket closed - code:', e?.code, 'reason:', e?.reason, 'wasClean:', e?.wasClean);
                            if (isActiveRef.current) {
                                updateState({ isConnected: false, isStreaming: false, audioState: 'idle' });
                            }
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        systemInstruction: systemInstruction,
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: voiceName
                                }
                            }
                        }
                    },
                });
                console.log('[GeminiLive] ai.live.connect() resolved successfully');
            } catch (connectError: any) {
                console.error('[GeminiLive] Connection failed:', connectError);
                console.error('[GeminiLive] Connection error name:', connectError?.name);
                console.error('[GeminiLive] Connection error message:', connectError?.message);
                throw connectError;
            }

            sessionRef.current = session;
            console.log('[GeminiLive] Session created');

            // 3. Wait for setup complete
            const waitForSetup = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Setup timeout')), 15000);
                const interval = setInterval(() => {
                    if (setupCompleteRef.current) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        resolve();
                    }
                    if (!isActiveRef.current) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        reject(new Error('Cancelled'));
                    }
                }, 100);
            });

            await waitForSetup;
            console.log('[GeminiLive] Ready for audio');

            // 4. Setup audio capture
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createMediaStreamSource(micStream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (!isActiveRef.current || !setupCompleteRef.current || !sessionRef.current) {
                    return;
                }

                const inputData = e.inputBuffer.getChannelData(0);
                
                // Check if there's actual audio data (not just silence)
                let maxSample = 0;
                for (let i = 0; i < inputData.length; i++) {
                    const abs = Math.abs(inputData[i]);
                    if (abs > maxSample) maxSample = abs;
                }
                
                const int16Data = float32ToInt16(new Float32Array(inputData));
                const base64 = arrayBufferToBase64(int16Data.buffer);

                try {
                    sessionRef.current.sendRealtimeInput({
                        audio: {
                            data: base64,
                            mimeType: 'audio/pcm;rate=16000'
                        }
                    });
                    // Log occasionally to avoid spam
                    if (Math.random() < 0.02) {
                        console.log('[GeminiLive] Sending audio chunk, size:', base64.length, 'max sample:', maxSample.toFixed(4));
                    }
                } catch (err) {
                    console.error('[GeminiLive] Send error:', err);
                }
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            console.log('[GeminiLive] Streaming audio - speak now!');
            return true;

        } catch (error: any) {
            console.error('[GeminiLive] Start error:', error);
            console.error('[GeminiLive] Error name:', error?.name);
            console.error('[GeminiLive] Error message:', error?.message);
            console.error('[GeminiLive] Error stack:', error?.stack);
            if (error?.cause) {
                console.error('[GeminiLive] Error cause:', error.cause);
            }
            cleanup();
            const errMsg = error?.message || 'Failed to start';
            updateState({ error: errMsg, audioState: 'error', isStreaming: false, isConnected: false });
            onError?.(errMsg);
            return false;
        }
    }, [getApiKey, modelId, voiceName, systemInstruction, cleanup, updateState, onError, onTranscript, playAudioQueue]);

    // Toggle
    const toggleStreaming = useCallback(async () => {
        if (state.isStreaming) {
            stopStreaming();
        } else {
            await startStreaming();
        }
    }, [state.isStreaming, startStreaming, stopStreaming]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isActiveRef.current = false;
            cleanup();
            if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
                playbackContextRef.current.close().catch(() => {});
            }
        };
    }, [cleanup]);

    return {
        ...state,
        startStreaming,
        stopStreaming,
        toggleStreaming,
    };
}

export default useGeminiLiveAudioStream;
