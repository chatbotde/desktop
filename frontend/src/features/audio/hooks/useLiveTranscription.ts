import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { createStreamingService, isAssemblyAIConfigured } from '@/lib/audio'
import type { IStreamingTranscriptionService, TranscriptionEvent } from '@/lib/audio'

interface UseLiveTranscriptionProps {
    onTranscriptionUpdate?: (text: string, isFinal: boolean) => void
    isEnabled: boolean
}

export function useLiveTranscription({ onTranscriptionUpdate, isEnabled }: UseLiveTranscriptionProps) {
    const [transcriptionText, setTranscriptionText] = useState('')
    const [partialText, setPartialText] = useState('')
    const [isTranscribing, setIsTranscribing] = useState(false)

    const transcriptionServiceRef = useRef<IStreamingTranscriptionService | null>(null)
    const transcriptionStreamRef = useRef<MediaStream | null>(null)

    const stopTranscription = useCallback(async () => {
        if (transcriptionServiceRef.current && transcriptionServiceRef.current.isStreaming()) {
            try {
                await transcriptionServiceRef.current.stop()
            } catch (error) {
                console.error('Error stopping transcription:', error)
            }
        }
        transcriptionServiceRef.current = null
        setIsTranscribing(false)
        setPartialText('')
    }, [])

    const startTranscription = useCallback(async (stream: MediaStream) => {
        if (!isAssemblyAIConfigured() || !isEnabled) return

        try {
            // Stop any existing service
            await stopTranscription()

            const service = createStreamingService()
            transcriptionServiceRef.current = service
            transcriptionStreamRef.current = stream

            // Set to false initially, 'connected' event sets it to true
            setIsTranscribing(false)

            await service.start(
                stream,
                {
                    sampleRate: 16000,
                    punctuate: true,
                    formatText: true,
                },
                (event: TranscriptionEvent) => {
                    // Use setTimeout to ensure state updates happen in next tick
                    setTimeout(() => {
                        if (event.type === 'partial') {
                            if (event.text && event.text.trim()) {
                                setPartialText(event.text)
                                onTranscriptionUpdate?.(event.text, false)
                            }
                        } else if (event.type === 'final') {
                            if (event.text && event.text.trim()) {
                                setTranscriptionText((prev) => {
                                    return prev ? `${prev} ${event.text}`.trim() : (event.text || '').trim()
                                })
                                setPartialText('')
                                onTranscriptionUpdate?.(event.text, true)
                            }
                        } else if (event.type === 'connected') {
                            setIsTranscribing(true)
                            setPartialText('')
                        } else if (event.type === 'error') {
                            console.error('Transcription error:', event.error)
                            setIsTranscribing(false)
                        } else if (event.type === 'disconnected') {
                            setIsTranscribing(false)
                            setPartialText('')
                        }
                    }, 0)
                }
            )
        } catch (error) {
            console.error('Failed to start transcription:', error)
            setIsTranscribing(false)
        }
    }, [isEnabled, onTranscriptionUpdate, stopTranscription])

    const clearTranscription = useCallback(() => {
        setTranscriptionText('')
        setPartialText('')
    }, [])

    // Cleanup on unmount - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            return () => {
                if (transcriptionServiceRef.current) {
                    transcriptionServiceRef.current.stop().catch(console.error)
                }
            }
        }, []),
        () => null,
        () => null
    )

    return {
        transcriptionText,
        partialText,
        isTranscribing,
        startTranscription,
        stopTranscription,
        clearTranscription,
        setTranscriptionText, // Exposed for manual clearing interaction
        setPartialText
    }
}
