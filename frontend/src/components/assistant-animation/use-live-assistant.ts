import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { LIVE_ASSISTANT_PROMPT } from '@/services/prompts/prompts/system-prompts';
import { getLiveAssistantLanguageClause } from '@/lib/settings/general-settings';
import { getProviderConfig } from '@/lib/settings/custom-providers';
import { TOOLS_CONFIG } from './assistant-tools';
import { MemoryService } from '@/lib/memory/memory-service';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

export type LiveAssistantState = ReturnType<typeof useLiveAssistantInternal>;

export function useLiveAssistantInternal() {
    const [connected, setConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
    const [isUserSpeaking, setIsUserSpeaking] = useState(false); // User is speaking (VAD-like)
    const [volume, setVolume] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const isPlayingRef = useRef(false);
    const scheduledTimeRef = useRef(0);
    const connectingRef = useRef(false);

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


    const ensureAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000, // Force 16kHz to match model preference and reduce data
            });
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
        if (audioQueueRef.current.length === 0 || !audioContextRef.current) return;

        const currentTime = audioContextRef.current.currentTime;
        if (scheduledTimeRef.current < currentTime) {
            // Reduced lookahead from 0.05 to 0.015 (15ms) for snappier playback
            scheduledTimeRef.current = currentTime + 0.015;
        }

        while (audioQueueRef.current.length > 0) {
            const chunk = audioQueueRef.current.shift();
            if (!chunk) continue;

            const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
            buffer.copyToChannel(chunk as Float32Array<ArrayBuffer>, 0);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);

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
                    if (audioContextRef.current) {
                        scheduledTimeRef.current = audioContextRef.current.currentTime;
                    }
                }
            };
        }
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
                systemInstruction: {
                    parts: [{
                        text: LIVE_ASSISTANT_PROMPT + (
                            MemoryService.getMemories().length > 0
                                ? `\n\nYour Memories:\n${MemoryService.getMemories().map(m => `- ${m.content}`).join('\n')}`
                                : ''
                        ) + getLiveAssistantLanguageClause() + "\n\nCRITICAL INSTRUCTIONS:\n1. Keep responses extremely brief and concise to minimize latency.\n2. NEVER repeat yourself or what the user says.\n3. Follow LANGUAGE PREFERENCE when it appears above if the user's spoken language is unclear; when they are clearly speaking one language, respond in that language.\n4. Do not use conversational filler words.\n5. NEVER mention that you are using a tool. For example, if you take a screenshot, do not say 'I am using the take_screenshot tool', just act naturally like you are looking at their screen. Same for listening to audio."
                    }]
                },
                tools: TOOLS_CONFIG as any,
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
                    onmessage: async (message: any) => {
                        if (message.serverContent?.interrupted) {
                            console.log('Model interrupted by user, clearing queue');
                            audioQueueRef.current = [];
                            sourceNodesRef.current.forEach(source => {
                                try { source.stop(); } catch (e) { }
                            });
                            sourceNodesRef.current = [];
                            scheduledTimeRef.current = audioContextRef.current?.currentTime || 0;
                            setIsSpeaking(false);
                            isPlayingRef.current = false;
                        }

                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    playAudioChunk(part.inlineData.data);
                                }
                            }
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
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            mediaStreamRef.current = stream;

            if (!audioContextRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            // Reduced buffer size from 2048 to 1024 to halve input latency
            const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);

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

                // Faster Base64 encode using chunked processing
                const uint8Array = new Uint8Array(pcmData.buffer);
                let binary = '';
                const len = uint8Array.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                const base64Audio = btoa(binary);

                session.sendRealtimeInput({
                    audio: {
                        data: base64Audio,
                        mimeType: 'audio/pcm;rate=16000'
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
    }, [connected, ensureAudioContext, playAudioChunk, startSystemAudio, stopSystemAudio]);

    const disconnect = useCallback(() => {
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

        // Don't close AudioContext if we want to reuse it, but suspend it
        if (audioContextRef.current) {
            audioContextRef.current.suspend();
        }

        setConnected(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        setVolume(0);

        // Also stop system audio
        stopSystemAudio();
    }, [stopSystemAudio]);

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
        isSpeaking,
        isUserSpeaking,
        volume,
        isCustomActive,
        isSystemAudioActive,
        imageGeneration,
        videoGeneration,
        sendTextWithScreenshot,
        closeImageGeneration: () => setImageGeneration(prev => ({ ...prev, isVisible: false })),
        closeVideoGeneration: () => setVideoGeneration(prev => ({ ...prev, isVisible: false }))
    };

}
