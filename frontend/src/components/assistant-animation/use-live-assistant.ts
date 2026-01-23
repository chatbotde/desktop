import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { LIVE_ASSISTANT_PROMPT } from '@/services/prompts/prompts/system-prompts';
import { getProviderConfig } from '@/lib/settings/custom-providers';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

export const useLiveAssistant = () => {
    const [connected, setConnected] = useState(false);
    const [] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
    const [isUserSpeaking, setIsUserSpeaking] = useState(false); // User is speaking (VAD-like)
    const [volume, setVolume] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const scheduledTimeRef = useRef(0);
    const connectingRef = useRef(false);

    const ensureAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    const playAudioChunk = useCallback((base64Data: string) => {
        if (!audioContextRef.current) return;

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        audioQueueRef.current.push(float32Array);
        processAudioQueue();
    }, []);

    const processAudioQueue = useCallback(() => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const chunk = audioQueueRef.current.shift();
        if (!chunk) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
        buffer.copyToChannel(chunk as Float32Array<ArrayBuffer>, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        // Schedule playback
        const currentTime = audioContextRef.current.currentTime;
        // If scheduled time is in the past, reset it
        if (scheduledTimeRef.current < currentTime) {
            scheduledTimeRef.current = currentTime;
        }

        source.start(scheduledTimeRef.current);
        scheduledTimeRef.current += buffer.duration;

        source.onended = () => {
            if (audioQueueRef.current.length === 0) {
                isPlayingRef.current = false;
                setIsSpeaking(false);
                // Reset scheduled time if queue is empty to avoid drift delay
                scheduledTimeRef.current = audioContextRef.current?.currentTime || 0;
            } else {
                isPlayingRef.current = false; // logic flow will pick up next chunk immediately if we call processAudioQueue
                processAudioQueue();
            }
        };
    }, []);

    const connect = useCallback(async () => {
        if (connected || connectingRef.current) return;

        connectingRef.current = true;

        try {
            ensureAudioContext();

            // Resolve configuration from settings or environment
            const googleConfig = getProviderConfig('google');

            // Check if user explicitly enabled custom API for voice
            const useCustomApi = localStorage.getItem('voice-use-custom-api') === 'true';
            const hasCustomKey = googleConfig.apiKey.trim().length > 0;

            // Use custom API only if: toggle is ON AND custom key exists
            const shouldUseCustom = useCustomApi && hasCustomKey;
            const apiKey = shouldUseCustom ? googleConfig.apiKey : API_KEY;
            const baseUrl = shouldUseCustom ? googleConfig.baseUrl : undefined;

            if (!apiKey) {
                throw new Error("No API key available. Please configure Google AI in settings or .env file.");
            }

            console.log(`[LiveAssistant] Using ${shouldUseCustom ? 'Custom' : 'Default'} API`);

            // Client and Model setup
            const client = new GoogleGenAI({
                apiKey,
                // @ts-ignore
                baseUrl
            });

            const config = {
                responseModalities: [Modality.AUDIO],
                systemInstruction: { parts: [{ text: LIVE_ASSISTANT_PROMPT }] },
            };

            const session = await client.live.connect({
                model: MODEL_NAME,
                config,
                callbacks: {
                    onopen: () => {
                        console.log('Connected to Gemini Live');
                        setConnected(true);
                        connectingRef.current = false;
                    },
                    onmessage: (message: any) => {
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    playAudioChunk(part.inlineData.data);
                                }
                            }
                        }
                    },
                    onclose: () => {
                        console.log('Disconnected from Gemini Live');
                        setConnected(false);
                    },
                    onerror: (error: any) => {
                        console.error('Gemini Live error:', error);
                        setConnected(false);
                    }
                }
            });

            sessionRef.current = session;

            // Microphone Setup
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                }
            });
            mediaStreamRef.current = stream;

            if (!audioContextRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Volume detection for UI
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(rms);
                setIsUserSpeaking(rms > 0.01);

                // Convert to PCM 16-bit
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Base64 encode
                const base64Audio = btoa(
                    String.fromCharCode(...new Uint8Array(pcmData.buffer))
                );

                session.sendRealtimeInput({
                    audio: {
                        data: base64Audio,
                        mimeType: 'audio/pcm;rate=' + e.inputBuffer.sampleRate
                    }
                });
            };

            source.connect(processor);
            // processor.connect(audioContextRef.current.destination); // ScriptProcessor needs connection to destination to run

            // Connect to a mute gain node to keep the processor running but not audible
            // This prevents the user hearing their own voice (echo)
            const muteGain = audioContextRef.current.createGain();
            muteGain.gain.value = 0;
            processor.connect(muteGain);
            muteGain.connect(audioContextRef.current.destination);
            processorRef.current = processor;

        } catch (error) {
            console.error('Failed to connect:', error);
            setConnected(false);
            connectingRef.current = false;
        }
    }, [connected, ensureAudioContext, playAudioChunk]);

    const disconnect = useCallback(() => {
        if (sessionRef.current) {
            // sessionRef.current.close(); // SDK might method might vary, usually just close socket or end session?
            // Assuming no explicit close method exposed easily or just dereference, but strictly we should clean up.
            // Looking at docs, session.close() exists possibly? If not, we just stop sending.
            // SDK documentation usually has close or similar.
            try {
                // @ts-ignore
                sessionRef.current.close?.();
            } catch (e) { }
            sessionRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current && audioContextRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Don't close AudioContext if we want to reuse it, but suspend it
        if (audioContextRef.current) {
            audioContextRef.current.suspend();
        }

        setConnected(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        setVolume(0);
    }, []);

    const isCustomActive = (() => {
        const config = getProviderConfig('google');
        return config.enabled && config.apiKey.trim().length > 0;
    })();

    return {
        connect,
        disconnect,
        connected,
        isSpeaking,
        isUserSpeaking,
        volume,
        isCustomActive
    };
};
