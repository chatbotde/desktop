import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Monitor, Layers, Square, X, FileText, Sparkles, Loader2, Pause, Play, GripVertical } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { useDraggable } from '@/features/output-window'
import { createStreamingService, isAssemblyAIConfigured } from '@/lib/audio'
import type { IStreamingTranscriptionService, TranscriptionEvent } from '@/lib/audio'
import { sendMessageComplete as sendCloudMessageComplete } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { QuickInsert } from '@/components/quick-insert'
import { buildVoiceRewritePromptFromLiveTranscription } from '@/lib/prompt'

interface AudioRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
    onRecordingComplete?: (audioBlob: Blob) => void
    onTranscriptionUpdate?: (text: string, isFinal: boolean) => void
}

export function AudioRecorderPill({ onClose, isDarkTheme = true, onRecordingComplete, onTranscriptionUpdate }: AudioRecorderPillProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [source, setSource] = useState<'mic' | 'system' | 'both'>('mic')
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [transcriptionText, setTranscriptionText] = useState('')
    const [partialText, setPartialText] = useState('')
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [showTranscription, setShowTranscription] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)
    const transcriptionContainerRef = useRef<HTMLDivElement>(null)

    // Transcription service
    const transcriptionServiceRef = useRef<IStreamingTranscriptionService | null>(null)
    const transcriptionStreamRef = useRef<MediaStream | null>(null)

    // Refs for recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioStreamRef = useRef<MediaStream | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const systemStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const recordingStartTimeRef = useRef<number>(0)
    const pausedTimeRef = useRef<number>(0)
    const pauseStartTimeRef = useRef<number>(0)
    const isPausedRef = useRef<boolean>(false)

    // Initial position left side
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight / 2 - 100 })
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const { handleDragMouseDown } = useDraggable(setPosition, containerRef)

    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    // Format duration from seconds to readable format (HH:MM:SS or MM:SS)
    const formatDuration = useCallback((seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`
        }
    }, [])

    // Get supported MIME type for audio recording
    const getSupportedMimeType = useCallback(() => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/wav'
        ]

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type
            }
        }
        return '' // Browser will choose default
    }, [])

    // Cleanup function
    const cleanup = useCallback(async () => {
        // Stop transcription if active
        if (transcriptionServiceRef.current && transcriptionServiceRef.current.isStreaming()) {
            try {
                await transcriptionServiceRef.current.stop()
            } catch (error) {
                console.error('Error stopping transcription:', error)
            }
            transcriptionServiceRef.current = null
        }
        transcriptionStreamRef.current = null
        setIsTranscribing(false)
        setTranscriptionText('')

        // Stop all streams
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop())
            micStreamRef.current = null
        }
        if (systemStreamRef.current) {
            systemStreamRef.current.getTracks().forEach(track => track.stop())
            systemStreamRef.current = null
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop())
            audioStreamRef.current = null
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        destinationNodeRef.current = null

        // Stop recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
        }

        // Clear duration interval
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current)
            durationIntervalRef.current = null
        }

        chunksRef.current = []
        setRecordingDuration(0)
        setIsPaused(false)
    }, [])

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            chunksRef.current = []
            setRecordingDuration(0)

            let finalStream: MediaStream | null = null

            if (source === 'mic') {
                // Microphone only
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                })
                micStreamRef.current = stream
                finalStream = stream
            } else if (source === 'system') {
                // System audio only
                if (!window.CaptureAPI) {
                    throw new Error('CaptureAPI is not available')
                }

                const sourcesResult = await (window.CaptureAPI as any).getScreenshotSources(false)
                if (!sourcesResult.success || !sourcesResult.sources?.length) {
                    throw new Error('No screen sources available for system audio')
                }

                const screenSource = sourcesResult.sources.find((s: any) => s.type === 'screen') || sourcesResult.sources[0]

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: screenSource.id
                        }
                    } as any,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: screenSource.id,
                            maxWidth: 1,
                            maxHeight: 1
                        }
                    } as any
                })

                // Remove video tracks
                stream.getVideoTracks().forEach(track => {
                    track.stop()
                    stream.removeTrack(track)
                })

                systemStreamRef.current = stream
                finalStream = stream
            } else if (source === 'both') {
                // Mixed audio (mic + system)
                const micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                })
                micStreamRef.current = micStream

                let systemStream: MediaStream | null = null
                try {
                    if (window.CaptureAPI) {
                        const sourcesResult = await (window.CaptureAPI as any).getScreenshotSources(false)
                        if (sourcesResult.success && sourcesResult.sources?.length) {
                            const screenSource = sourcesResult.sources.find((s: any) => s.type === 'screen') || sourcesResult.sources[0]

                            const sysStream = await navigator.mediaDevices.getUserMedia({
                                audio: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: screenSource.id
                                    }
                                } as any,
                                video: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: screenSource.id,
                                        maxWidth: 1,
                                        maxHeight: 1
                                    }
                                } as any
                            })

                            sysStream.getVideoTracks().forEach(track => {
                                track.stop()
                                sysStream.removeTrack(track)
                            })

                            systemStream = sysStream
                            systemStreamRef.current = sysStream
                        }
                    }
                } catch (sysError) {
                    console.warn('Could not capture system audio:', sysError)
                }

                // Mix streams using Web Audio API
                const audioContext = new AudioContext()
                audioContextRef.current = audioContext

                const destination = audioContext.createMediaStreamDestination()
                destinationNodeRef.current = destination

                // Connect microphone
                const micSource = audioContext.createMediaStreamSource(micStream)
                micSource.connect(destination)

                // Connect system audio if available
                if (systemStream && systemStream.getAudioTracks().length > 0) {
                    const systemSource = audioContext.createMediaStreamSource(systemStream)
                    systemSource.connect(destination)
                }

                finalStream = destination.stream
                audioStreamRef.current = finalStream
            }

            if (!finalStream) {
                throw new Error('Failed to create audio stream')
            }

            // Create MediaRecorder
            const mimeType = getSupportedMimeType()
            const recorder = new MediaRecorder(finalStream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000
            })

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
                onRecordingComplete?.(blob)
                cleanup()
            }

            recorder.start(500) // Collect data every 500ms
            mediaRecorderRef.current = recorder

            // Start duration timer
            recordingStartTimeRef.current = Date.now()
            pausedTimeRef.current = 0
            pauseStartTimeRef.current = 0
            isPausedRef.current = false
            durationIntervalRef.current = setInterval(() => {
                if (!isPausedRef.current) {
                    const elapsed = Date.now() - recordingStartTimeRef.current - pausedTimeRef.current
                    setRecordingDuration(Math.floor(elapsed / 1000))
                }
                // When paused, don't update the duration - it stays at the last value
            }, 1000)

            // Start real-time transcription if available
            if (isAssemblyAIConfigured() && showTranscription) {
                try {
                    console.log('[AudioRecorderPill] Starting real-time transcription...')
                    const service = createStreamingService()
                    transcriptionServiceRef.current = service
                    transcriptionStreamRef.current = finalStream
                    // Don't set isTranscribing to true yet - wait for connection confirmation
                    setIsTranscribing(false)

                    await service.start(
                        finalStream,
                        {
                            sampleRate: 16000,
                            punctuate: true,
                            formatText: true,
                        },
                        (event: TranscriptionEvent) => {
                            const textPreview = event.text ? event.text.substring(0, 50) : 'no text'
                            console.log('[AudioRecorderPill] Transcription event:', event.type, textPreview)

                            // Use setTimeout to ensure state updates happen
                            setTimeout(() => {
                                if (event.type === 'partial') {
                                    // Show partial transcript in real-time
                                    if (event.text && event.text.trim()) {
                                        console.log('[AudioRecorderPill] Setting partial text:', event.text)
                                        setPartialText(event.text)
                                        onTranscriptionUpdate?.(event.text, false)
                                    }
                                } else if (event.type === 'final') {
                                    // Append final transcript to accumulated text
                                    if (event.text && event.text.trim()) {
                                        console.log('[AudioRecorderPill] Setting final text:', event.text)
                                        setTranscriptionText((prev) => {
                                            const newText = prev ? `${prev} ${event.text}`.trim() : (event.text || '').trim()
                                            console.log('[AudioRecorderPill] Updated transcription text length:', newText.length)
                                            return newText
                                        })
                                        setPartialText('') // Clear partial text
                                        onTranscriptionUpdate?.(event.text, true)
                                    }
                                } else if (event.type === 'connected') {
                                    console.log('[AudioRecorderPill] Transcription connected - setting isTranscribing to true')
                                    setIsTranscribing(true) // Only set to true when actually connected
                                    setTranscriptionText('')
                                    setPartialText('')
                                } else if (event.type === 'error') {
                                    console.error('[AudioRecorderPill] Transcription error:', event.error)
                                    setIsTranscribing(false)
                                    // Show error message
                                    if (event.error?.message) {
                                        console.error('[AudioRecorderPill] Error details:', event.error.message)
                                        alert(`Transcription error: ${event.error.message}`)
                                    }
                                } else if (event.type === 'disconnected') {
                                    console.log('[AudioRecorderPill] Transcription disconnected')
                                    setIsTranscribing(false)
                                    setPartialText('')
                                }
                            }, 0)
                        }
                    )
                    console.log('[AudioRecorderPill] Transcription service start() completed - waiting for connection...')
                } catch (error) {
                    console.error('[AudioRecorderPill] Failed to start transcription:', error)
                    setIsTranscribing(false)
                    alert(`Failed to start transcription: ${error instanceof Error ? error.message : String(error)}`)
                }
            }

            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
            cleanup()
        }
    }, [source, getSupportedMimeType, onRecordingComplete, cleanup, showTranscription, onTranscriptionUpdate])

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause()
            pauseStartTimeRef.current = Date.now()
            isPausedRef.current = true
            setIsPaused(true)
            // Pause transcription if active
            if (transcriptionServiceRef.current && transcriptionServiceRef.current.isStreaming()) {
                transcriptionServiceRef.current.stop().catch(console.error)
            }
        }
    }, [])

    // Resume recording
    const resumeRecording = useCallback(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume()
            // Update paused time before resuming - add the duration of this pause
            const pauseDuration = Date.now() - pauseStartTimeRef.current
            pausedTimeRef.current += pauseDuration
            isPausedRef.current = false
            setIsPaused(false)
            // Immediately update the duration display
            const elapsed = Date.now() - recordingStartTimeRef.current - pausedTimeRef.current
            setRecordingDuration(Math.floor(elapsed / 1000))
            // Resume transcription if needed
            if (showTranscription && isAssemblyAIConfigured() && transcriptionStreamRef.current) {
                try {
                    const service = createStreamingService()
                    transcriptionServiceRef.current = service
                    await service.start(
                        transcriptionStreamRef.current,
                        {
                            sampleRate: 16000,
                            punctuate: true,
                            formatText: true,
                        },
                        (event: TranscriptionEvent) => {
                            setTimeout(() => {
                                if (event.type === 'partial') {
                                    if (event.text && event.text.trim()) {
                                        setPartialText(event.text)
                                        onTranscriptionUpdate?.(event.text, false)
                                    }
                                } else if (event.type === 'final') {
                                    if (event.text && event.text.trim()) {
                                        setTranscriptionText((prev) => {
                                            const newText = prev ? `${prev} ${event.text}`.trim() : (event.text || '').trim()
                                            return newText
                                        })
                                        setPartialText('')
                                        onTranscriptionUpdate?.(event.text, true)
                                    }
                                } else if (event.type === 'connected') {
                                    setIsTranscribing(true)
                                } else if (event.type === 'error') {
                                    setIsTranscribing(false)
                                } else if (event.type === 'disconnected') {
                                    setIsTranscribing(false)
                                    setPartialText('')
                                }
                            }, 0)
                        }
                    )
                } catch (error) {
                    console.error('Failed to resume transcription:', error)
                }
            }
        }
    }, [showTranscription, onTranscriptionUpdate])

    // Stop recording
    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        } else {
            await cleanup()
        }
        setIsRecording(false)
        setIsPaused(false)
    }, [cleanup])

    // Handle source button click - starts recording immediately
    const handleSourceClick = useCallback(async (selectedSource: 'mic' | 'system' | 'both') => {
        if (isRecording) return
        setSource(selectedSource)
        await startRecording()
    }, [isRecording, startRecording])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup().catch(console.error)
        }
    }, [cleanup])

    // Cleanup transcription when recording stops
    useEffect(() => {
        if (!isRecording && transcriptionServiceRef.current) {
            transcriptionServiceRef.current.stop().catch(console.error)
            transcriptionServiceRef.current = null
            setIsTranscribing(false)
            setPartialText('')
        }
    }, [isRecording])

    // Auto-scroll transcription container to bottom when new text arrives
    useEffect(() => {
        if (transcriptionContainerRef.current && (transcriptionText || partialText)) {
            const container = transcriptionContainerRef.current
            const scrollElement = container.querySelector('[style*="overflow-y"]') as HTMLElement
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight
            }
        }
    }, [transcriptionText, partialText])

    // Adjust initial position on mount to be safe
    useEffect(() => {
        setPosition({ x: 20, y: window.innerHeight / 2 - 100 })
    }, [])

    const handleGenerateFromLiveTranscription = useCallback(async () => {
        const fullText = `${transcriptionText} ${partialText}`.trim()
        if (!fullText) return

        setIsGenerating(true)
        setAiError(null)

        const prompt = buildVoiceRewritePromptFromLiveTranscription(fullText)

        try {
            const localModel = unifiedLocalLLMService.getCurrentModel()
            const replyText = localModel
                ? await (async () => {
                    const init = await unifiedLocalLLMService.initialize()
                    if (!init.success) {
                        throw new Error(init.message)
                    }
                    return await unifiedLocalLLMService.sendMessageComplete(prompt, undefined, localModel.name)
                })()
                : await sendCloudMessageComplete(prompt)

            const suggestion = replyText.trim()
            setAiSuggestion(suggestion)

            // Automatically insert into the main prompt input and send to AI
            try {
                window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: suggestion } }))
                window.dispatchEvent(new Event('prompt-send-now'))
            } catch (error) {
                console.error('[AudioRecorderPill] Failed to auto-send generated prompt:', error)
            }
        } catch (error) {
            console.error('[AudioRecorderPill] AI generation from live transcription failed:', error)
            setAiError(error instanceof Error ? error.message : 'Failed to generate prompt from transcription')
        } finally {
            setIsGenerating(false)
        }
    }, [partialText, transcriptionText])

    const handleInsertSuggestion = useCallback(() => {
        if (!aiSuggestion.trim()) return

        try {
            const text = aiSuggestion.trim()
            window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text } }))
        } catch (error) {
            console.error('[AudioRecorderPill] Failed to dispatch prompt-add-text event:', error)
        }
    }, [aiSuggestion])

    return (
        <div
            ref={containerRef}
            className="fixed z-[50] flex flex-row items-center gap-2"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Drag handle - outside the main UI */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "p-1.5 rounded-full border shadow-lg transition-colors flex items-center justify-center",
                            themeClasses.containerBorder,
                            hoverClass
                        )}
                        style={{
                            backgroundColor: themeClasses.containerBg,
                        }}
                        onMouseDown={handleDragMouseDown}
                    >
                        <GripVertical className={cn("size-3.5", themeClasses.icon)} />
                    </div>
                </TooltipTrigger>
                <TooltipContent 
                    side="top" 
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Drag to move
                </TooltipContent>
            </Tooltip>

            {/* Main UI */}
            <div
                ref={cardRef}
                className={cn(
                    "flex flex-row items-center gap-1.5 p-1.5 rounded-full border shadow-lg transition-all duration-300",
                    themeClasses.containerBorder
                )}
                style={{
                    backgroundColor: themeClasses.containerBg,
                }}
            >
            {!isRecording ? (
                <>
                    {/* Source selection buttons - clicking starts recording */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => handleSourceClick('mic')}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    source === 'mic'
                                        ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                        : hoverClass
                                )}
                            >
                                <Mic className={cn(
                                    "size-3.5",
                                    source === 'mic' ? "text-blue-500" : themeClasses.icon
                                )} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            Start Recording with Microphone
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => handleSourceClick('system')}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    source === 'system'
                                        ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                        : hoverClass
                                )}
                            >
                                <Monitor className={cn(
                                    "size-3.5",
                                    source === 'system' ? "text-blue-500" : themeClasses.icon
                                )} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            Start Recording with System Audio
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => handleSourceClick('both')}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    source === 'both'
                                        ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                        : hoverClass
                                )}
                            >
                                <Layers className={cn(
                                    "size-3.5",
                                    source === 'both' ? "text-blue-500" : themeClasses.icon
                                )} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            Start Recording with Both (Mic + System)
                        </TooltipContent>
                    </Tooltip>
                </>
            ) : (
                <>
                    {/* Time display when recording */}
                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        isPaused 
                            ? (isDarkTheme ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                            : (isDarkTheme ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700")
                    )}>
                        {formatDuration(recordingDuration)}
                    </div>

                    {/* Pause/Resume and Stop buttons when recording */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={isPaused ? resumeRecording : pauseRecording}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    hoverClass
                                )}
                            >
                                {isPaused ? (
                                    <Play className="size-3.5 text-yellow-500 fill-current" />
                                ) : (
                                    <Pause className="size-3.5 text-yellow-500 fill-current" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            {isPaused ? 'Resume Recording' : 'Pause Recording'}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={stopRecording}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    hoverClass
                                )}
                            >
                                <Square className="size-3.5 text-red-500 fill-current" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            Stop Recording
                        </TooltipContent>
                    </Tooltip>
                </>
            )}

            {/* Transcription Toggle - only show when not recording */}
            {!isRecording && isAssemblyAIConfigured() && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => {
                                setShowTranscription(!showTranscription)
                            }}
                            className={cn(
                                "p-1.5 rounded-full transition-colors",
                                showTranscription
                                    ? (isDarkTheme ? "bg-green-600/30 border-2 border-green-500" : "bg-green-100 border-2 border-green-500")
                                    : hoverClass
                            )}
                        >
                            <FileText className={cn(
                                "size-3.5",
                                showTranscription ? "text-green-500" : themeClasses.icon
                            )} />
                        </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            {showTranscription ? '✓ Real-time Transcription' : 'Enable Real-time Transcription'}
                        </TooltipContent>
                    </Tooltip>
            )}

            {/* Transcription Display */}
            {showTranscription && (isRecording || transcriptionText || partialText) && (
                <div
                    ref={transcriptionContainerRef}
                    className={cn(
                        "fixed bottom-24 left-1/2 -translate-x-1/2",
                        "w-full max-w-2xl px-4",
                        "z-[50]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={cn(
                        "p-4 rounded-lg border shadow-xl",
                        themeClasses.containerBorder,
                        "bg-opacity-95 backdrop-blur-sm",
                        "max-h-[40vh] flex flex-col"
                    )}
                        style={{ backgroundColor: themeClasses.containerBg }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "size-2 rounded-full transition-colors",
                                    isTranscribing ? "bg-green-500 animate-pulse" : "bg-zinc-500"
                                )}
                                    title={isTranscribing ? "Connected" : "Not connected"} />
                                <div className={cn("text-xs font-semibold", themeClasses.input)}>
                                    Live Transcription
                                </div>
                            </div>
                            <div className={cn("text-xs flex items-center gap-1", themeClasses.icon)}>
                                {isTranscribing ? (
                                    <>
                                        <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span>Connected</span>
                                    </>
                                ) : isRecording ? (
                                    <>
                                        <div className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <span>Not connected</span>
                                )}
                            </div>
                        </div>

                        <div
                            className={cn(
                                "text-sm whitespace-pre-wrap overflow-y-auto flex-1",
                                "scrollbar-thin",
                                isDarkTheme
                                    ? "scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
                                    : "scrollbar-thumb-zinc-400 scrollbar-track-zinc-200",
                                themeClasses.input
                            )}
                            style={{
                                minHeight: '4rem',
                            }}
                        >
                            {/* Accumulated final transcripts */}
                            {transcriptionText && (
                                <div className={cn("mb-2 leading-relaxed", themeClasses.input)}>
                                    {transcriptionText}
                                </div>
                            )}

                            {/* Current partial transcript (shown in different style) */}
                            {partialText && partialText.trim() && (
                                <div className={cn(
                                    "leading-relaxed",
                                    transcriptionText ? "text-zinc-400 italic" : themeClasses.input
                                )}>
                                    {partialText}
                                    <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
                                </div>
                            )}

                            {/* Empty state */}
                            {!transcriptionText && !partialText && isTranscribing && (
                                <div className={cn("text-sm text-center py-4", themeClasses.icon)}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Waiting for speech...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons and AI suggestion */}
                        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: themeClasses.containerBorder }}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {(transcriptionText || partialText) && (
                                        <button
                                            onClick={() => {
                                                setTranscriptionText('')
                                                setPartialText('')
                                                setAiSuggestion('')
                                                setAiError(null)
                                            }}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded transition-colors",
                                                hoverClass
                                            )}
                                        >
                                            Clear
                                        </button>
                                    )}
                                    {isAssemblyAIConfigured() && (transcriptionText || partialText) && (
                                        <button
                                            onClick={handleGenerateFromLiveTranscription}
                                            disabled={isGenerating}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1",
                                                hoverClass
                                            )}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="size-3 animate-spin" />
                                                    Generating…
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="size-3" />
                                                    Prompt
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className={cn("text-xs ml-auto", themeClasses.icon)}>
                                    {transcriptionText ? `${transcriptionText.split(' ').filter(w => w).length} words` : ''}
                                </div>
                            </div>

                            {aiError && (
                                <div className={cn("text-xs text-red-400", themeClasses.icon)}>
                                    {aiError}
                                </div>
                            )}

                            {aiSuggestion && (
                                <div className="space-y-2">
                                    <div className={cn(
                                        "text-sm whitespace-pre-wrap rounded-md px-2 py-1",
                                        isDarkTheme ? "bg-zinc-900/60" : "bg-zinc-100"
                                    )}>
                                        {aiSuggestion}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <QuickInsert
                                            text={aiSuggestion}
                                            className={cn(
                                                "h-7 px-3 text-xs rounded-md border flex items-center",
                                                isDarkTheme ? "border-zinc-700" : "border-zinc-300"
                                            )}
                                        />
                                        <button
                                            onClick={handleInsertSuggestion}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded transition-colors",
                                                isDarkTheme ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"
                                            )}
                                        >
                                            Insert into prompt
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Close button - only show when not recording */}
            {!isRecording && (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onClose}
                                className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    hoverClass
                                )}
                            >
                                <X className={cn("size-3.5", themeClasses.icon)} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent 
                            side="top"
                            className={cn(
                                isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                            )}
                        >
                            Close
                        </TooltipContent>
                    </Tooltip>
                </>
            )}
            </div>
        </div>
    )
}
