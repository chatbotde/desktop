/**
 * useGeminiLiveAudio Hook
 * 
 * Real-time audio conversation with Gemini Native Audio model.
 * Records audio, sends to Gemini, and plays back the audio response.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Gemini Live API WebSocket endpoint
const GEMINI_LIVE_API_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export interface GeminiLiveAudioState {
    isConnected: boolean;
    isRecording: boolean;
    isProcessing: boolean;
    isPlaying: boolean;
    error: string | null;
}

export interface UseGeminiLiveAudioOptions {
    modelId?: string;
    onAudioResponse?: (audioBlob: Blob) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: GeminiLiveAudioState) => void;
}

export function useGeminiLiveAudio(options: UseGeminiLiveAudioOptions = {}) {
    const {
        modelId = 'gemini-2.5-flash-native-audio-preview-12-2025',
        onAudioResponse,
        onError,
        onStateChange,
    } = options;

    const [state, setState] = useState<GeminiLiveAudioState>({
        isConnected: false,
        isRecording: false,
        isProcessing: false,
        isPlaying: false,
        error: null,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Update state and notify
    const updateState = useCallback((newState: Partial<GeminiLiveAudioState>) => {
        setState(prev => {
            const updated = { ...prev, ...newState };
            onStateChange?.(updated);
            return updated;
        });
    }, [onStateChange]);

    // Get API key from environment or storage
    const getApiKey = useCallback(async (): Promise<string | null> => {
        // Try localStorage first (where settings might store it)
        const storedKey = localStorage.getItem('google-api-key');
        if (storedKey) return storedKey;

        // Try environment variable accessor
        try {
            // @ts-ignore - Window might have this from preload
            if (window.electronAPI?.getEnvVariable) {
                return await window.electronAPI.getEnvVariable('VITE_GOOGLE_API_KEY');
            }
        } catch {
            // Ignore
        }

        return null;
    }, []);

    // Connect to Gemini Live API
    const connect = useCallback(async () => {
        const apiKey = await getApiKey();
        if (!apiKey) {
            const error = 'Google API key not found. Please set it in settings.';
            updateState({ error });
            onError?.(error);
            return false;
        }

        try {
            const wsUrl = `${GEMINI_LIVE_API_URL}?key=${apiKey}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('[GeminiLiveAudio] WebSocket connected');

                // Send setup message
                const setupMessage = {
                    setup: {
                        model: `models/${modelId}`,
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Aoede' // Can be: Aoede, Charon, Fenrir, Kore, Puck
                                    }
                                }
                            }
                        }
                    }
                };

                wsRef.current?.send(JSON.stringify(setupMessage));
                updateState({ isConnected: true, error: null });
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[GeminiLiveAudio] Received:', data);

                    // Handle setup complete
                    if (data.setupComplete) {
                        console.log('[GeminiLiveAudio] Setup complete');
                    }

                    // Handle audio response
                    if (data.serverContent?.modelTurn?.parts) {
                        for (const part of data.serverContent.modelTurn.parts) {
                            if (part.inlineData?.mimeType?.startsWith('audio/')) {
                                // Decode base64 audio and play it
                                const audioData = atob(part.inlineData.data);
                                const audioBytes = new Uint8Array(audioData.length);
                                for (let i = 0; i < audioData.length; i++) {
                                    audioBytes[i] = audioData.charCodeAt(i);
                                }

                                const audioBlob = new Blob([audioBytes], { type: part.inlineData.mimeType });
                                onAudioResponse?.(audioBlob);
                                await playAudio(audioBlob);
                            }
                        }
                    }

                    // Handle turn complete
                    if (data.serverContent?.turnComplete) {
                        updateState({ isProcessing: false });
                    }
                } catch (e) {
                    console.error('[GeminiLiveAudio] Error parsing message:', e);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('[GeminiLiveAudio] WebSocket error:', error);
                updateState({ error: 'Connection error', isConnected: false });
                onError?.('Connection error');
            };

            wsRef.current.onclose = () => {
                console.log('[GeminiLiveAudio] WebSocket closed');
                updateState({ isConnected: false });
            };

            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to connect';
            updateState({ error: errorMsg });
            onError?.(errorMsg);
            return false;
        }
    }, [getApiKey, modelId, onAudioResponse, onError, updateState]);

    // Play audio blob
    const playAudio = useCallback(async (audioBlob: Blob) => {
        updateState({ isPlaying: true });

        try {
            const audioUrl = URL.createObjectURL(audioBlob);

            if (!audioPlayerRef.current) {
                audioPlayerRef.current = new Audio();
            }

            audioPlayerRef.current.src = audioUrl;

            await new Promise<void>((resolve, reject) => {
                if (!audioPlayerRef.current) return reject('No audio player');

                audioPlayerRef.current.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    updateState({ isPlaying: false });
                    resolve();
                };

                audioPlayerRef.current.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    updateState({ isPlaying: false });
                    reject(e);
                };

                audioPlayerRef.current.play();
            });
        } catch (error) {
            console.error('[GeminiLiveAudio] Error playing audio:', error);
            updateState({ isPlaying: false });
        }
    }, [updateState]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            // Connect if not connected
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                const connected = await connect();
                if (!connected) return false;

                // Wait a bit for setup to complete
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            streamRef.current = stream;
            audioChunksRef.current = [];

            // Create audio context for processing
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });

            // Find supported MIME type
            const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
            const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                // Combine all chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });

                // Convert to base64 and send
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];

                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        updateState({ isProcessing: true });

                        const message = {
                            clientContent: {
                                turns: [{
                                    role: 'user',
                                    parts: [{
                                        inlineData: {
                                            mimeType: recorder.mimeType || 'audio/webm',
                                            data: base64
                                        }
                                    }]
                                }],
                                turnComplete: true
                            }
                        };

                        wsRef.current.send(JSON.stringify(message));
                    }
                };
                reader.readAsDataURL(audioBlob);
            };

            recorder.start(100); // Collect data every 100ms
            updateState({ isRecording: true, error: null });

            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
            updateState({ error: errorMsg, isRecording: false });
            onError?.(errorMsg);
            return false;
        }
    }, [connect, onError, updateState]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        updateState({ isRecording: false });
    }, [updateState]);

    // Toggle recording
    const toggleRecording = useCallback(async () => {
        if (state.isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }, [state.isRecording, startRecording, stopRecording]);

    // Disconnect
    const disconnect = useCallback(() => {
        stopRecording();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        updateState({ isConnected: false, isRecording: false, isProcessing: false });
    }, [stopRecording, updateState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        toggleRecording,
    };
}

export default useGeminiLiveAudio;
