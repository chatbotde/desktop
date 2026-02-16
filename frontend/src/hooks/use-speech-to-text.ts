import { useState, useRef, useCallback } from 'react';

export interface UseSpeechToTextReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    transcript: string | null;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        setError(null);
        setTranscript(null);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsTranscribing(true);

            mediaRecorderRef.current.onstop = async () => {
                try {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();

                    if (!window.whisperAPI) {
                        throw new Error('Whisper API not available');
                    }

                    const result = await window.whisperAPI.transcribe(arrayBuffer, 'webm');

                    if (result.success && result.text) {
                        setTranscript(result.text);
                    } else {
                        setError(result.error || 'Transcription failed');
                    }
                } catch (err: any) {
                    console.error('Transcription error:', err);
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
    }, []);

    return {
        isRecording,
        isTranscribing,
        transcript,
        error,
        startRecording,
        stopRecording
    };
};
