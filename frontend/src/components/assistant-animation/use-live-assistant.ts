import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { toast } from 'sonner';
import { LIVE_ASSISTANT_PROMPT } from '@/services/prompts/prompts/system-prompts';
import { getLiveAssistantLanguageClause } from '@/lib/settings/general-settings';
import { getProviderConfig } from '@/lib/settings/custom-providers';
import { getProviderApiKey } from '@/lib/ai/ai-sdk/providers';
import { hasValidEnvValue, PROVIDER_ENV_KEYS, resolveEnvValue } from '@/lib/ai/env-utils';
import { TOOLS_CONFIG } from './assistant-tools';
import { MemoryService } from '@/lib/memory/memory-service';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
/** Gemini Live API requires 16 kHz little-endian PCM input. */
const INPUT_PCM_RATE = 16000;
const OUTPUT_PCM_RATE = 24000;
const SETUP_TIMEOUT_MS = 20000;
/** Pause mic briefly after AI finishes speaking to avoid speaker→mic echo loops. */
const MIC_RESUME_DELAY_MS = 350;

function buildSystemInstruction(): string {
    const memories = MemoryService.getMemories();
    const memoryBlock = memories.length > 0
        ? `\n\nYour Memories:\n${memories.map(m => `- ${m.content}`).join('\n')}`
        : '';
    return LIVE_ASSISTANT_PROMPT
        + memoryBlock
        + getLiveAssistantLanguageClause()
        + "\n\nCRITICAL INSTRUCTIONS:\n1. Keep responses extremely brief and concise to minimize latency.\n2. NEVER repeat yourself, echo the user, or restate what was just said.\n3. Give each answer exactly once — do not repeat phrases or sentences.\n4. Follow LANGUAGE PREFERENCE when it appears above if the user's spoken language is unclear; when they are clearly speaking one language, respond in that language.\n5. Do not use conversational filler words.\n6. NEVER mention that you are using a tool. For example, if you take a screenshot, do not say 'I am using the take_screenshot tool', just act naturally like you are looking at their screen. Same for listening to audio.";
}

function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
    if (inputRate === INPUT_PCM_RATE) return input;
    const ratio = inputRate / INPUT_PCM_RATE;
    const outLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
        const srcIndex = i * ratio;
        const idx = Math.floor(srcIndex);
        const frac = srcIndex - idx;
        const s0 = input[idx] ?? 0;
        const s1 = input[idx + 1] ?? s0;
        output[i] = s0 + frac * (s1 - s0);
    }
    return output;
}

function float32ToPcmBase64(samples: Float32Array): string {
    const pcmData = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const uint8Array = new Uint8Array(pcmData.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

/** Prefer .env key for voice unless the user explicitly enabled custom voice API. */
async function resolveVoiceApiKey(shouldUseCustom: boolean, customKey: string): Promise<string | undefined> {
    if (shouldUseCustom) return customKey;

    const envConfig = PROVIDER_ENV_KEYS.google;
    const fromEnv = resolveEnvValue(envConfig.primary, {
        fallbacks: envConfig.fallbacks,
        provider: 'Google',
    });
    if (hasValidEnvValue(fromEnv)) return fromEnv.value;

    if (window.electronAPI?.getEnvVariable) {
        try {
            const runtimeKey = await window.electronAPI.getEnvVariable('VITE_GOOGLE_API_KEY');
            if (runtimeKey?.trim()) return runtimeKey.trim();
        } catch {
            // Fall through to provider/localStorage resolution.
        }
    }

    return getProviderApiKey('google');
}

/** Live API WebSocket uses the host root — REST paths like /v1beta break the socket URL. */
function getLiveApiBaseUrl(customBaseUrl?: string): string | undefined {
    const trimmed = customBaseUrl?.trim();
    if (!trimmed) return undefined;
    if (trimmed.includes('/v1beta') || trimmed.includes('/v1/')) {
        return 'https://generativelanguage.googleapis.com/';
    }
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export type LiveAssistantState = ReturnType<typeof useLiveAssistantInternal>;

export function useLiveAssistantInternal() {
    const [connected, setConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
    const [isUserSpeaking, setIsUserSpeaking] = useState(false); // User is speaking (VAD-like)
    const [volume, setVolume] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const isPlayingRef = useRef(false);
    const isProcessingQueueRef = useRef(false);
    const micSendPausedRef = useRef(false);
    const micResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastVolumeUiUpdateRef = useRef(0);
    const scheduledTimeRef = useRef(0);
    const connectingRef = useRef(false);
    const setupCompleteRef = useRef(false);
    const connectedRef = useRef(false);
    const setupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputSampleRateRef = useRef(INPUT_PCM_RATE);

    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    connectedRef.current = connected;

    // System Audio Refs
    const systemAudioStreamRef = useRef<MediaStream | null>(null);
    const systemSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);

    // Generation States
    const [imageGeneration, setImageGeneration] = useState<{
        isVisible: boolean;
        images: string[];
        isLoading: boolean;
    }>({ isVisible: false, images: [], isLoading: false });

    const [videoGeneration, setVideoGeneration] = useState<{
        isVisible: boolean;
        videos: string[];
        isLoading: boolean;
    }>({ isVisible: false, videos: [], isLoading: false });


    const ensureAudioContext = useCallback(async () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 16000,
                });
            } catch {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
    }, []);

    const ensurePlaybackContext = useCallback(async () => {
        if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
            playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: OUTPUT_PCM_RATE,
            });
        }
        if (playbackContextRef.current.state === 'suspended') {
            await playbackContextRef.current.resume();
        }
    }, []);

    const pauseMicSend = useCallback((resumeAfterMs = 0) => {
        micSendPausedRef.current = true;
        if (micResumeTimeoutRef.current) {
            clearTimeout(micResumeTimeoutRef.current);
            micResumeTimeoutRef.current = null;
        }
        if (resumeAfterMs > 0) {
            micResumeTimeoutRef.current = setTimeout(() => {
                micSendPausedRef.current = false;
                micResumeTimeoutRef.current = null;
            }, resumeAfterMs);
        }
    }, []);

    const processAudioQueueRef = useRef<() => void>(() => {});

    const processAudioQueue = useCallback(async () => {
        if (audioQueueRef.current.length === 0 || isProcessingQueueRef.current) return;

        isProcessingQueueRef.current = true;
        try {
            await ensurePlaybackContext();
            const ctx = playbackContextRef.current;
            if (!ctx) return;

            const currentTime = ctx.currentTime;
            if (scheduledTimeRef.current < currentTime) {
                scheduledTimeRef.current = currentTime + 0.02;
            }

            micSendPausedRef.current = true;

            while (audioQueueRef.current.length > 0) {
                const chunk = audioQueueRef.current.shift();
                if (!chunk) continue;

                const buffer = ctx.createBuffer(1, chunk.length, OUTPUT_PCM_RATE);
                buffer.copyToChannel(chunk as Float32Array<ArrayBuffer>, 0);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);

                sourceNodesRef.current.push(source);

                source.start(scheduledTimeRef.current);
                scheduledTimeRef.current += buffer.duration;

                setIsSpeaking(true);
                isPlayingRef.current = true;

                source.onended = () => {
                    sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== source);
                    if (sourceNodesRef.current.length === 0 && audioQueueRef.current.length === 0) {
                        isPlayingRef.current = false;
                        setIsSpeaking(false);
                        scheduledTimeRef.current = ctx.currentTime;
                        pauseMicSend(MIC_RESUME_DELAY_MS);
                    }
                    if (audioQueueRef.current.length > 0) {
                        processAudioQueueRef.current();
                    }
                };
            }
        } finally {
            isProcessingQueueRef.current = false;
        }
    }, [ensurePlaybackContext, pauseMicSend]);

    processAudioQueueRef.current = () => { void processAudioQueue(); };

    const playAudioChunk = useCallback((base64Data: string) => {
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
        processAudioQueueRef.current();
    }, []);

    const stopSystemAudio = useCallback(() => {
        if (systemSourceRef.current) {
            systemSourceRef.current.disconnect();
            systemSourceRef.current = null;
        }
        if (systemAudioStreamRef.current) {
            systemAudioStreamRef.current.getTracks().forEach(track => track.stop());
            systemAudioStreamRef.current = null;
        }
        setIsSystemAudioActive(false);
        console.log('[LiveAssistant] Stopped system audio');
    }, []);

    const startSystemAudio = useCallback(async () => {
        try {
            if (!audioContextRef.current || !processorRef.current) return false;

            // @ts-ignore
            if (!window.CaptureAPI) {
                console.error('CaptureAPI not available');
                return false;
            }

            // 1. Get Sources
            // @ts-ignore
            const result = await window.CaptureAPI.getVideoSources(false); // screens only
            if (!result.success || !result.sources || result.sources.length === 0) {
                throw new Error("No screen sources found");
            }
            const sourceId = result.sources[0].id; // Primary screen

            // 2. Get Stream (Audio + Dummy Video)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    // @ts-ignore
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                },
                video: {
                    // @ts-ignore
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        maxWidth: 1,
                        maxHeight: 1
                    }
                }
            } as any);

            // 3. Extract Audio
            const audioStream = new MediaStream();
            stream.getAudioTracks().forEach(track => audioStream.addTrack(track));

            // cleanup video tracks immediately
            stream.getVideoTracks().forEach(track => track.stop());

            if (audioStream.getAudioTracks().length === 0) {
                console.warn('No system audio tracks found');
                return false;
            }

            systemAudioStreamRef.current = audioStream;

            // 4. Connect to Processor (Mix with Mic)
            const source = audioContextRef.current.createMediaStreamSource(audioStream);
            source.connect(processorRef.current);
            systemSourceRef.current = source;

            setIsSystemAudioActive(true);
            console.log('[LiveAssistant] Started system audio listening');
            return true;

        } catch (error) {
            console.error('Failed to start system audio:', error);
            stopSystemAudio();
            return false;
        }
    }, [stopSystemAudio]);

    const connect = useCallback(async () => {
        if (connectedRef.current || connectingRef.current) return;

        connectingRef.current = true;
        setupCompleteRef.current = false;
        setConnectionError(null);
        setIsConnecting(true);

        try {
            await ensureAudioContext();

            const googleConfig = getProviderConfig('google');
            const useCustomApi = localStorage.getItem('voice-use-custom-api') === 'true';
            const hasCustomKey = googleConfig.apiKey.trim().length > 0;
            const shouldUseCustom = useCustomApi && hasCustomKey;
            const apiKey = await resolveVoiceApiKey(
                shouldUseCustom,
                googleConfig.apiKey.trim(),
            );

            if (!apiKey) {
                throw new Error('No API key available. Add a Google key in Settings or set VITE_GOOGLE_API_KEY in .env.');
            }

            console.log(`[LiveAssistant] Using ${shouldUseCustom ? 'custom' : 'default'} API, key length: ${apiKey.length}`);

            // Request mic during the user gesture before opening the WebSocket
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: INPUT_PCM_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            mediaStreamRef.current = stream;

            const liveBaseUrl = shouldUseCustom ? getLiveApiBaseUrl(googleConfig.baseUrl) : undefined;
            const client = new GoogleGenAI({
                apiKey,
                ...(liveBaseUrl ? { httpOptions: { baseUrl: liveBaseUrl } } : {}),
            });

            const config = {
                responseModalities: [Modality.AUDIO],
                systemInstruction: buildSystemInstruction(),
                tools: TOOLS_CONFIG as any,
            };

            const clearSetupTimeout = () => {
                if (setupTimeoutRef.current) {
                    clearTimeout(setupTimeoutRef.current);
                    setupTimeoutRef.current = null;
                }
            };

            const markReady = () => {
                if (setupCompleteRef.current) return;
                setupCompleteRef.current = true;
                clearSetupTimeout();
                micSendPausedRef.current = false;
                setConnected(true);
                setIsConnecting(false);
                connectingRef.current = false;
                window.dispatchEvent(new CustomEvent('assistant-connection-changed', { detail: { connected: true } }));
                console.log('[LiveAssistant] Ready — mic streaming enabled');
            };

            const session = await client.live.connect({
                model: MODEL_NAME,
                config,
                callbacks: {
                    onopen: () => {
                        console.log('[LiveAssistant] WebSocket open, waiting for setupComplete...');
                    },
                    onmessage: async (message: any) => {
                        if (message.setupComplete) {
                            console.log('[LiveAssistant] Setup complete');
                            markReady();
                            return;
                        }

                        if (message.serverContent?.interrupted) {
                            console.log('Model interrupted by user, clearing queue');
                            audioQueueRef.current = [];
                            sourceNodesRef.current.forEach(source => {
                                try { source.stop(); } catch (e) { }
                            });
                            sourceNodesRef.current = [];
                            isPlayingRef.current = false;
                            isProcessingQueueRef.current = false;
                            if (playbackContextRef.current) {
                                scheduledTimeRef.current = playbackContextRef.current.currentTime;
                            }
                            setIsSpeaking(false);
                            micSendPausedRef.current = false;
                            if (micResumeTimeoutRef.current) {
                                clearTimeout(micResumeTimeoutRef.current);
                                micResumeTimeoutRef.current = null;
                            }
                        }

                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    playAudioChunk(part.inlineData.data);
                                }
                            }
                        }

                        if (message.serverContent?.turnComplete) {
                            return;
                        }

                        if (message.toolCall) {
                            console.log('Received tool call:', message.toolCall);
                            const functionCalls = message.toolCall.functionCalls;
                            const responses = [];

                            for (const call of functionCalls) {
                                if (call.name === 'take_screenshot') {
                                    try {
                                        // @ts-ignore
                                        if (window.CaptureAPI) {
                                            // @ts-ignore
                                            const result = await window.CaptureAPI.quickScreenshot();
                                            if (result.success && result.screenshot) {
                                                console.log('Screenshot captured, sending to model...');

                                                try {
                                                    const imageData = result.screenshot.data;
                                                    // Strip base64 header if present
                                                    const base64Data = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
                                                    const mimeType = result.screenshot.type || 'image/png';

                                                    console.log(`Sending image data (length: ${base64Data.length}) via sendRealtimeInput`);

                                                    // Use sendRealtimeInput for visual context (treated as video frames/media chunks)
                                                    // @ts-ignore
                                                    sessionRef.current?.sendRealtimeInput({
                                                        media: {
                                                            mimeType,
                                                            data: base64Data
                                                        }
                                                    });

                                                    responses.push({
                                                        name: call.name,
                                                        response: { result: "Screenshot captured and sent to context successfully." },
                                                        id: call.id
                                                    });

                                                } catch (sendError) {
                                                    console.error('Error sending screenshot to model:', sendError);
                                                    responses.push({
                                                        name: call.name,
                                                        response: { error: `Failed to send screenshot: ${sendError}` },
                                                        id: call.id
                                                    });
                                                }
                                            } else {
                                                console.error('Screenshot failed:', result.error);
                                                responses.push({
                                                    name: call.name,
                                                    response: { error: `Failed to take screenshot: ${result.error}` },
                                                    id: call.id
                                                });
                                            }
                                        } else {
                                            console.error('CaptureAPI not available');
                                            responses.push({
                                                name: call.name,
                                                response: { error: "Screen capture capability is not available on this device." },
                                                id: call.id
                                            });
                                        }
                                    } catch (err) {
                                        console.error('Error executing screenshot tool:', err);
                                        responses.push({
                                            name: call.name,
                                            response: { error: `Internal error: ${err}` },
                                            id: call.id
                                        });
                                    }
                                } else if (call.name === 'start_system_audio') {
                                    const success = await startSystemAudio();
                                    responses.push({
                                        name: call.name,
                                        response: { result: success ? "Started listening to system audio." : "Failed to start system audio." },
                                        id: call.id
                                    });
                                } else if (call.name === 'stop_system_audio') {
                                    stopSystemAudio();
                                    responses.push({
                                        name: call.name,
                                        response: { result: "Stopped listening to system audio." },
                                        id: call.id
                                    });
                                } else if (call.name === 'generate_image') {
                                    const { prompt } = (call as any).args;
                                    setImageGeneration({ isVisible: true, images: [], isLoading: true });

                                    try {
                                        // We'll use the unified service for generation
                                        // Importing it inside because of potential circular dependencies/context
                                        const { aiSDKUnifiedService } = await import('../../lib/ai/ai-sdk/unified-service');
                                        const imageUrls = await aiSDKUnifiedService.generateImages(prompt);

                                        setImageGeneration({
                                            isVisible: true,
                                            images: imageUrls,
                                            isLoading: false
                                        });

                                        // Premium Feature: Send the first generated image back to the model 
                                        // so the assistant "sees" what it just created and can talk about it.
                                        if (imageUrls.length > 0 && sessionRef.current) {
                                            try {
                                                const response = await fetch(imageUrls[0]);
                                                const blob = await response.blob();
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const base64data = (reader.result as string).split(',')[1];
                                                    // @ts-ignore
                                                    sessionRef.current?.sendRealtimeInput({
                                                        media: {
                                                            mimeType: blob.type,
                                                            data: base64data
                                                        }
                                                    });
                                                };
                                                reader.readAsDataURL(blob);
                                            } catch (fetchErr) {
                                                console.warn('Failed to send generated image back to context:', fetchErr);
                                            }
                                        }


                                        responses.push({
                                            name: call.name,
                                            response: { result: `Successfully generated ${imageUrls.length} image(s). I can see them now.` },
                                            id: call.id
                                        });

                                    } catch (err) {
                                        console.error('Image generation error:', err);
                                        setImageGeneration(prev => ({ ...prev, isLoading: false }));
                                        responses.push({
                                            name: call.name,
                                            response: { error: `Failed to generate image: ${err}` },
                                            id: call.id
                                        });
                                    }
                                } else if (call.name === 'generate_video') {
                                    const { prompt } = (call as any).args;
                                    setVideoGeneration({ isVisible: true, videos: [], isLoading: true });

                                    try {
                                        const { aiSDKUnifiedService } = await import('../../lib/ai/ai-sdk/unified-service');
                                        const videoUrls = await aiSDKUnifiedService.generateVideos(prompt);

                                        setVideoGeneration({
                                            isVisible: true,
                                            videos: videoUrls,
                                            isLoading: false
                                        });

                                        responses.push({
                                            name: call.name,
                                            response: { result: `Successfully generated ${videoUrls.length} video(s).` },
                                            id: call.id
                                        });
                                    } catch (err) {
                                        console.error('Video generation error:', err);
                                        setVideoGeneration(prev => ({ ...prev, isLoading: false }));
                                        responses.push({
                                            name: call.name,
                                            response: { error: `Failed to generate video: ${err}` },
                                            id: call.id
                                        });
                                    }
                                } else if (call.name === 'remember') {
                                    const { info } = (call as any).args;
                                    MemoryService.addMemory(info);
                                    responses.push({
                                        name: call.name,
                                        response: { result: `I have stored this in my memory: "${info}"` },
                                        id: call.id
                                    });
                                } else if (call.name === 'forget') {
                                    const { info } = (call as any).args;
                                    const removed = MemoryService.removeMemory(info);
                                    responses.push({
                                        name: call.name,
                                        response: { result: removed ? `I have removed "${info}" from my memory.` : `I couldn't find "${info}" in my memory.` },
                                        id: call.id
                                    });
                                } else if (call.name === 'point_to_element') {
                                    const { x_percent, y_percent, x, y } = (call as any).args;
                                    let targetX = 0;
                                    let targetY = 0;

                                    // Use primary percentage based logic for accuracy regardless of screen density / resolution
                                    if (x_percent !== undefined && y_percent !== undefined) {
                                        targetX = (x_percent / 100.0) * window.innerWidth;
                                        targetY = (y_percent / 100.0) * window.innerHeight;
                                    } else {
                                        // Fallback if model behaves poorly
                                        targetX = x || 0;
                                        targetY = y || 0;
                                        // Try converting if the model assumed native pixels
                                        if (window.devicePixelRatio && window.devicePixelRatio !== 1) {
                                            targetX = targetX / window.devicePixelRatio;
                                            targetY = targetY / window.devicePixelRatio;
                                        }
                                    }

                                    window.dispatchEvent(new CustomEvent('assistant-point-to', { detail: { x: targetX, y: targetY } }));
                                    responses.push({
                                        name: call.name,
                                        response: { result: `Pointer successfully moved to (${x_percent}%, ${y_percent}%).` },
                                        id: call.id
                                    });
                                }

                            }

                            if (responses.length > 0 && sessionRef.current) {
                                // @ts-ignore
                                sessionRef.current?.sendToolResponse({ functionResponses: responses });
                            }

                        }
                    },
                    onclose: () => {
                        console.log('[LiveAssistant] Disconnected from Gemini Live');
                        clearSetupTimeout();
                        setConnected(false);
                        setIsConnecting(false);
                        connectingRef.current = false;
                        setupCompleteRef.current = false;
                    },
                    onerror: (error: any) => {
                        console.error('[LiveAssistant] Gemini Live error:', error);
                        const errMsg = error?.message || error?.reason || 'Voice connection failed';
                        setConnectionError(errMsg);
                        toast.error(errMsg);
                        setConnected(false);
                        setIsConnecting(false);
                        connectingRef.current = false;
                        setupCompleteRef.current = false;
                    }
                }
            });

            sessionRef.current = session;

            setupTimeoutRef.current = setTimeout(() => {
                if (setupCompleteRef.current) return;
                const errMsg = 'Voice connection timed out. Check your Google API key and network.';
                console.error('[LiveAssistant]', errMsg);
                setConnectionError(errMsg);
                toast.error(errMsg);
                try { sessionRef.current?.close?.(); } catch { /* ignore */ }
                sessionRef.current = null;
                mediaStreamRef.current?.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
                setConnected(false);
                setIsConnecting(false);
                connectingRef.current = false;
                setupCompleteRef.current = false;
                clearSetupTimeout();
            }, SETUP_TIMEOUT_MS);

            if (!audioContextRef.current) {
                throw new Error('Audio context unavailable');
            }

            inputSampleRateRef.current = audioContextRef.current.sampleRate;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current || !setupCompleteRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);

                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);

                const now = performance.now();
                if (now - lastVolumeUiUpdateRef.current > 80) {
                    lastVolumeUiUpdateRef.current = now;
                    setVolume(rms);
                    setIsUserSpeaking(rms > 0.01);
                }

                // Half-duplex: don't send mic while AI is speaking (prevents echo/repeat loops)
                if (isPlayingRef.current || micSendPausedRef.current) return;

                const pcmSamples = resampleTo16k(
                    new Float32Array(inputData),
                    inputSampleRateRef.current,
                );
                const base64Audio = float32ToPcmBase64(pcmSamples);

                try {
                    sessionRef.current.sendRealtimeInput({
                        audio: {
                            data: base64Audio,
                            mimeType: `audio/pcm;rate=${INPUT_PCM_RATE}`,
                        }
                    });
                } catch (sendErr) {
                    console.error('[LiveAssistant] Failed to send audio chunk:', sendErr);
                }
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
            let errMsg = error instanceof Error ? error.message : 'Failed to connect to voice assistant';
            if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
                errMsg = 'Microphone permission denied. Allow mic access for this app in Windows settings.';
            }
            console.error('[LiveAssistant] Failed to connect:', error);
            if (setupTimeoutRef.current) {
                clearTimeout(setupTimeoutRef.current);
                setupTimeoutRef.current = null;
            }
            setConnectionError(errMsg);
            toast.error(errMsg);
            setConnected(false);
            setIsConnecting(false);
            connectingRef.current = false;
            setupCompleteRef.current = false;

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (sessionRef.current) {
                try {
                    sessionRef.current.close?.();
                } catch { /* ignore */ }
                sessionRef.current = null;
            }
        }
    }, [ensureAudioContext, playAudioChunk, startSystemAudio, stopSystemAudio]);

    const disconnect = useCallback(() => {
        if (setupTimeoutRef.current) {
            clearTimeout(setupTimeoutRef.current);
            setupTimeoutRef.current = null;
        }
        if (micResumeTimeoutRef.current) {
            clearTimeout(micResumeTimeoutRef.current);
            micResumeTimeoutRef.current = null;
        }
        micSendPausedRef.current = false;
        isProcessingQueueRef.current = false;

        if (sessionRef.current) {
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

        sourceNodesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        sourceNodesRef.current = [];
        audioQueueRef.current = [];
        scheduledTimeRef.current = 0;
        isPlayingRef.current = false;

        // Don't close capture AudioContext if we want to reuse it, but suspend it
        if (audioContextRef.current) {
            audioContextRef.current.suspend();
        }
        if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
            playbackContextRef.current.close().catch(() => {});
            playbackContextRef.current = null;
        }

        setConnected(false);
        window.dispatchEvent(new CustomEvent('assistant-connection-changed', { detail: { connected: false } }));
        setIsConnecting(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        setVolume(0);
        setConnectionError(null);
        connectingRef.current = false;
        setupCompleteRef.current = false;

        // Also stop system audio
        stopSystemAudio();
    }, [stopSystemAudio]);

    // Keep refs for stable event listeners registered once at provider mount.
    const connectRef = useRef(connect);
    const disconnectRef = useRef(disconnect);
    connectRef.current = connect;
    disconnectRef.current = disconnect;

    useEffect(() => {
        const handleVisibilityToggle = (event: Event) => {
            const detail = (event as CustomEvent<{ connect?: boolean }>).detail;
            setIsVisible(prev => {
                const next = !prev;
                if (next && detail?.connect !== false) {
                    connectRef.current();
                }
                return next;
            });
        };

        const handleAssistantConnect = () => {
            setIsVisible(true);
            connectRef.current();
        };

        window.addEventListener('toggle-assistant-visibility', handleVisibilityToggle);
        window.interfaceAPI?.onMessage?.('assistant-connect', handleAssistantConnect);

        return () => {
            window.removeEventListener('toggle-assistant-visibility', handleVisibilityToggle);
            window.interfaceAPI?.removeMessageListener?.('assistant-connect', handleAssistantConnect);
        };
    }, []);

    useEffect(() => {
        if (!isVisible && connected) {
            disconnectRef.current();
        }
    }, [isVisible, connected]);

    const isCustomActive = (() => {
        const config = getProviderConfig('google');
        return config.enabled && config.apiKey.trim().length > 0;
    })();

    /**
     * Send a text message to the live session along with a fresh screenshot.
     * Used by the PointerInputOverlay to ask the model "where is X?" and
     * get a point_to_element response.
     */
    const sendTextWithScreenshot = useCallback(async (text: string) => {
        if (!sessionRef.current) {
            console.warn('[LiveAssistant] Cannot send text — no active session');
            return;
        }

        try {
            // 1. Capture screenshot
            // @ts-ignore
            if (window.CaptureAPI) {
                // @ts-ignore
                const result = await window.CaptureAPI.quickScreenshot();
                if (result.success && result.screenshot) {
                    const imageData = result.screenshot.data;
                    const base64Data = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
                    const mimeType = result.screenshot.type || 'image/png';

                    // Send screenshot as realtime media context
                    // @ts-ignore
                    sessionRef.current?.sendRealtimeInput({
                        media: { mimeType, data: base64Data }
                    });
                    console.log('[LiveAssistant] Screenshot sent for pointer-input');
                }
            }

            // 2. Send the user's text instruction
            // @ts-ignore
            sessionRef.current?.sendClientContent({
                turns: [{
                    role: 'user',
                    parts: [{ text: `Look at my screen and ${text}. Use the point_to_element tool to point to what I described.` }]
                }],
                turnComplete: true
            });

            console.log('[LiveAssistant] Pointer text sent:', text);
        } catch (err) {
            console.error('[LiveAssistant] Error sending pointer text:', err);
        }
    }, []);

    return {
        connect,
        disconnect,
        connected,
        isVisible,
        isSpeaking,
        isUserSpeaking,
        volume,
        connectionError,
        isConnecting,
        isCustomActive,
        isSystemAudioActive,
        imageGeneration,
        videoGeneration,
        sendTextWithScreenshot,
        closeImageGeneration: () => setImageGeneration(prev => ({ ...prev, isVisible: false })),
        closeVideoGeneration: () => setVideoGeneration(prev => ({ ...prev, isVisible: false }))
    };

}
