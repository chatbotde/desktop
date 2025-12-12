import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Monitor, Layers, Square, Circle, X, GripVertical, AudioWaveform, Minus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDraggable } from './output-window/hooks'
import { createStreamingService, isAssemblyAIConfigured } from '@/lib/audio'
import type { IStreamingTranscriptionService, TranscriptionEvent } from '@/lib/audio'

interface AudioRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
    onRecordingComplete?: (audioBlob: Blob) => void
    onTranscriptionUpdate?: (text: string, isFinal: boolean) => void
}

export function AudioRecorderPill({ onClose, isDarkTheme = true, onRecordingComplete, onTranscriptionUpdate }: AudioRecorderPillProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [source, setSource] = useState<'mic' | 'system' | 'both'>('mic')
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [transcriptionText, setTranscriptionText] = useState('')
    const [partialText, setPartialText] = useState('')
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [showTranscription, setShowTranscription] = useState(false)
    const transcriptionContainerRef = useRef<HTMLDivElement>(null)

    // Transcription service
    const transcriptionServiceRef = useRef<IStreamingTranscriptionService | null>(null)

    // Refs for recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioStreamRef = useRef<MediaStream | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const systemStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Initial position bottom-rightish
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 300 })
    const cardRef = useRef<HTMLDivElement>(null)
    const { handleDragMouseDown } = useDraggable(setPosition, cardRef)

    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

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

                const sourcesResult = await window.CaptureAPI.getScreenshotSources(false)
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
                        const sourcesResult = await window.CaptureAPI.getScreenshotSources(false)
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
            const startTime = Date.now()
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)

            // Start real-time transcription if available
            if (isAssemblyAIConfigured() && showTranscription) {
                try {
                    console.log('[AudioRecorderPill] Starting real-time transcription...')
                    const service = createStreamingService()
                    transcriptionServiceRef.current = service
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
    }, [source, getSupportedMimeType, onRecordingComplete, cleanup])

    // Stop recording
    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        } else {
            await cleanup()
        }
        setIsRecording(false)
    }, [cleanup])

    const handleToggleRecord = useCallback(() => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }, [isRecording, startRecording, stopRecording])

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
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 350 })
    }, [])

    if (isCollapsed) {
        return (
            <div
                ref={cardRef}
                className={cn(
                    "relative flex items-center justify-center p-4 rounded-full border shadow-lg fixed z-50 cursor-move transition-all duration-300",
                    themeClasses.containerBorder
                )}
                style={{
                    backgroundColor: themeClasses.containerBg,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
                onMouseDown={handleDragMouseDown}
                onDoubleClick={() => setIsCollapsed(false)}
            >
                {/* Wave animation effect */}
                <div className={cn(
                    "absolute inset-0 rounded-full animate-ping",
                    isRecording ? "bg-red-500/20" : "bg-blue-500/20"
                )} />

                <div className="relative z-10 animate-pulse">
                    <AudioWaveform className={cn(
                        "size-6",
                        isRecording ? "text-red-500" : "text-blue-500"
                    )} />
                </div>
                
                {isRecording && recordingDuration > 0 && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-400 whitespace-nowrap">
                        {recordingDuration}s
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={cardRef}
            className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-full border shadow-lg fixed z-50 transition-all duration-300",
                themeClasses.containerBorder
            )}
            style={{
                backgroundColor: themeClasses.containerBg,
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div
                className={cn("cursor-move p-1 rounded-full", hoverClass)}
                onMouseDown={handleDragMouseDown}
            >
                <GripVertical className={cn("size-4", themeClasses.icon)} />
            </div>

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                console.log('[AudioRecorderPill] Source changed to: mic')
                                setSource('mic')
                            }
                        }}
                        disabled={isRecording}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'mic' 
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass,
                            isRecording && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Mic className={cn(
                            "size-4",
                            source === 'mic' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {source === 'mic' ? '✓ Microphone' : 'Microphone'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                console.log('[AudioRecorderPill] Source changed to: system')
                                setSource('system')
                            }
                        }}
                        disabled={isRecording}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'system' 
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass,
                            isRecording && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Monitor className={cn(
                            "size-4",
                            source === 'system' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {source === 'system' ? '✓ System Audio' : 'System Audio'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                console.log('[AudioRecorderPill] Source changed to: both')
                                setSource('both')
                            }
                        }}
                        disabled={isRecording}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'both' 
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass,
                            isRecording && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Layers className={cn(
                            "size-4",
                            source === 'both' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {source === 'both' ? '✓ Both (Mic + System)' : 'Both (Mic + System)'}
                </TooltipContent>
            </Tooltip>

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleToggleRecord}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        {isRecording ? (
                            <Square className="size-4 text-red-500 fill-current" />
                        ) : (
                            <Circle className="size-4 text-red-500" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {isRecording 
                        ? `Stop Recording (${recordingDuration}s) - ${source === 'mic' ? 'Microphone' : source === 'system' ? 'System Audio' : 'Both'}`
                        : `Start Recording - ${source === 'mic' ? 'Microphone' : source === 'system' ? 'System Audio' : 'Both'}`
                    }
                </TooltipContent>
            </Tooltip>
            
            {isRecording && (
                <div className="text-xs text-center mt-1 space-y-0.5">
                    <div className={cn(
                        "font-semibold",
                        isDarkTheme ? "text-red-400" : "text-red-600"
                    )}>
                        {recordingDuration}s
                    </div>
                    <div className={cn("text-xs", themeClasses.icon)}>
                        {source === 'mic' ? 'Mic' : source === 'system' ? 'System' : 'Both'}
                    </div>
                    {isTranscribing && (
                        <div className={cn("text-xs flex items-center justify-center gap-1", themeClasses.icon)}>
                            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            Transcribing
                        </div>
                    )}
                </div>
            )}

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            {/* Transcription Toggle */}
            {isAssemblyAIConfigured() && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => {
                                if (!isRecording) {
                                    setShowTranscription(!showTranscription)
                                }
                            }}
                            disabled={isRecording}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                showTranscription
                                    ? (isDarkTheme ? "bg-green-600/30 border-2 border-green-500" : "bg-green-100 border-2 border-green-500")
                                    : hoverClass,
                                isRecording && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <FileText className={cn(
                                "size-4",
                                showTranscription ? "text-green-500" : themeClasses.icon
                            )} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
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
                        "z-[100]"
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
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: themeClasses.containerBorder }}>
                        {(transcriptionText || partialText) && (
                            <button
                                onClick={() => {
                                    setTranscriptionText('')
                                    setPartialText('')
                                }}
                                className={cn(
                                    "text-xs px-3 py-1.5 rounded transition-colors",
                                    hoverClass
                                )}
                            >
                                Clear
                            </button>
                        )}
                        <div className={cn("text-xs ml-auto", themeClasses.icon)}>
                            {transcriptionText ? `${transcriptionText.split(' ').filter(w => w).length} words` : ''}
                        </div>
                    </div>
                    </div>
                </div>
            )}

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <Minus className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Minimize</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <X className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Close</TooltipContent>
            </Tooltip>
        </div>
    )
}
