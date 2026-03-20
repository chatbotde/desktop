import { useState, useRef, useCallback, useEffect } from 'react';

// Common Whisper hallucinations to filter out to prevent background noise from adding junk text
const CLEANUP_REGEX = /\[BLANK_AUDIO\]|\(music\)|\(silence\)|Thank you for watching|Subtitled by|^[\s.,!?;]+$/gi;

const cleanWhisperText = (text: string) => {
    return text.replace(CLEANUP_REGEX, '').trim();
};

export interface UseSpeechToTextReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    transcript: string | null;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
    setTranscript: (text: string | null) => void;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isProcessingRef = useRef<boolean>(false);

    // Voice activity detection refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const hasSpeechRecently = useRef<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);

    // Initial monitor volume level to check if the user is actually speaking
    const startVolumeMonitor = (stream: MediaStream) => {
        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);

            audioContextRef.current = audioContext;
            analyzerRef.current = analyzer;

            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
                if (!analyzerRef.current) return;
                analyzerRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume energy
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                // If average volume exceeds threshold (8), flag that speech occurred in this interval
                if (average > 8) {
                    hasSpeechRecently.current = true;
                }

                animationFrameRef.current = requestAnimationFrame(checkVolume);
            };

            checkVolume();
        } catch (err) {
            console.warn('VAD: Failed to initialize volume monitor', err);
            // Fallback: always assume speech is possible if VAD fails
            hasSpeechRecently.current = true;
        }
    };

    const stopVolumeMonitor = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
        }
        audioContextRef.current = null;
        analyzerRef.current = null;
    }, []);

    const transcribeCurrentBuffer = useCallback(async (isFinal: boolean = false) => {
        // Skip if busy, no data, or if no speech was detected in this interval (unless final)
        // This avoids pointless heavy CPU usage and Whisper hallucinations during silence.
        if (!isFinal && (isProcessingRef.current || audioChunksRef.current.length === 0 || !hasSpeechRecently.current)) {
            return;
        }

        // Reset speech flag for next interval
        hasSpeechRecently.current = false;

        // If it's final, we wait for any existing process to finish
        if (isFinal) {
            while (isProcessingRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        isProcessingRef.current = true;
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();

            if (!window.whisperAPI) {
                throw new Error('Whisper API not available');
            }

            const result = await window.whisperAPI.transcribe(arrayBuffer, 'webm');

            if (result.success && result.text) {
                const cleanedText = cleanWhisperText(result.text);

                // Only update if we have meaningful text or if it's the final result
                if (cleanedText || isFinal) {
                    setTranscript(cleanedText || result.text);
                }
            }
        } catch (err) {
            console.error('Transcription error:', err);
        } finally {
            isProcessingRef.current = false;
        }
    }, []);

    const startRecording = useCallback(async () => {
        setError(null);
        setTranscript(null);
        audioChunksRef.current = [];
        isProcessingRef.current = false;
        hasSpeechRecently.current = false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            startVolumeMonitor(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    // Attempt incremental transcription only if speech was detected
                    transcribeCurrentBuffer();
                }
            };

            // Request chunks every 3 seconds for incremental transcription
            mediaRecorder.start(3000);
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    }, [transcribeCurrentBuffer]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            setIsRecording(false);

            // Stop monitoring volume
            stopVolumeMonitor();

            // Stop the recorder will trigger a final ondataavailable
            mediaRecorderRef.current.stop();

            // Set transcribing to true for the final pass
            setIsTranscribing(true);

            mediaRecorderRef.current.onstop = async () => {
                try {
                    // Final transcription pass to ensure we get everything
                    await transcribeCurrentBuffer(true);
                } catch (err: any) {
                    console.error('Final transcription error:', err);
                    setError(err.message || 'Failed to transcribe audio');
                } finally {
                    setIsTranscribing(false);
                    // Stop all tracks to release microphone
                    if (mediaRecorderRef.current?.stream) {
                        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                    }
                    mediaRecorderRef.current = null;
                }
            };
        }
    }, [transcribeCurrentBuffer, stopVolumeMonitor]);

    // Ensure cleanup on unmount
    useEffect(() => {
        return () => {
            stopVolumeMonitor();
        };
    }, [stopVolumeMonitor]);

    return {
        isRecording,
        isTranscribing,
        transcript,
        error,
        startRecording,
        stopRecording,
        clearTranscript: () => setTranscript(null),
        setTranscript
    };
};
