import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Monitor, Layers, Square, Circle, X, GripVertical, AudioWaveform, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDraggable } from './output-window/hooks'

interface AudioRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
    onRecordingComplete?: (audioBlob: Blob) => void
}

export function AudioRecorderPill({ onClose, isDarkTheme = true, onRecordingComplete }: AudioRecorderPillProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [source, setSource] = useState<'mic' | 'system' | 'both'>('mic')
    const [recordingDuration, setRecordingDuration] = useState(0)

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
    const cleanup = useCallback(() => {
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

            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
            cleanup()
        }
    }, [source, getSupportedMimeType, onRecordingComplete, cleanup])

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        } else {
            cleanup()
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
            cleanup()
        }
    }, [cleanup])

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
