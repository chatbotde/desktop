import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { Mic, CircleEllipsis, MessageSquareText } from 'lucide-react'
import { cn } from "@/shared/lib"
import { Button } from '@/shared/components/ui/button'
import { getThemeClasses } from "@/features/prompt"
import { AudioSourceSelector } from './AudioSourceSelector'
import { AudioRecorderControls } from './AudioRecorderControls'
import { useLiveAssistant } from '@/components/assistant-animation/live-assistant-provider'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

import { formatDuration } from './audio-utils'
import { addAudioBlobToPrompt } from '@/components/prompt-input/prompt-files-bridge'

import { useAudioRecorder, type AudioSourceType } from '../hooks/useAudioRecorder'
import { useFeature } from '@/contexts/FeatureContext'

const HOVER_DELAY_MS = 150
const HIDE_DELAY_MS = 300

/** Keep Electron overlay clickable while interacting with the audio pill */
function capturePointerForOverlay(event: React.PointerEvent) {
    event.stopPropagation()
    window.interfaceAPI?.setIgnoreMouseEvents(false)
}

interface MicHoverAudioPillProps {
    isDarkTheme?: boolean
    className?: string
    onRecordingComplete?: (audioBlob: Blob) => void
}

/**
 * Mic button in the prompt input. Hover or click to open the source pill.
 * While recording: shows timer, pause, and stop — on stop, adds audio to the prompt (click attachment to preview).
 */
export function MicHoverAudioPill({
    isDarkTheme = true,
    className,
    onRecordingComplete,
}: MicHoverAudioPillProps) {
    const { isFeatureEnabled, setFeatureEnabled } = useFeature()
    const isVoiceInsertEnabled = isFeatureEnabled('voice-insert')
    const [isPillActive, setIsPillActive] = useState(false)
    const [source, setSource] = useState<AudioSourceType>('mic')
    const [isAssistantVisible, setIsAssistantVisible] = useState(false)
    const { connected, isConnecting } = useLiveAssistant()
    const isVoiceLive = connected || isConnecting
    const containerRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleRecordingComplete = useCallback((blob: Blob) => {
        if (blob.size > 0) {
            addAudioBlobToPrompt(blob)
        } else {
            console.warn('[MicHoverAudioPill] Recording was empty — nothing captured')
        }

        setIsPillActive(false)
        onRecordingComplete?.(blob)
    }, [onRecordingComplete])

    const {
        isRecording,
        isPaused,
        duration,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        cleanup: cleanupRecorder
    } = useAudioRecorder({ onRecordingComplete: handleRecordingComplete })

    const themeClasses = getThemeClasses(isDarkTheme)
    const shouldShowPill = isPillActive || isRecording

    const clearHoverTimeout = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
    }, [])

    const handleMouseEnter = useCallback(() => {
        clearHoverTimeout()
        hoverTimeoutRef.current = setTimeout(() => {
            setIsPillActive(true)
        }, HOVER_DELAY_MS)
    }, [clearHoverTimeout])

    const handleMouseLeave = useCallback(() => {
        clearHoverTimeout()
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, HIDE_DELAY_MS)
        }
    }, [isRecording, clearHoverTimeout])

    const handlePillMouseEnter = useCallback(() => {
        clearHoverTimeout()
    }, [clearHoverTimeout])

    const handlePillMouseLeave = useCallback(() => {
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, HIDE_DELAY_MS)
        }
    }, [isRecording, clearHoverTimeout])

    const handleStopRecording = useCallback(() => {
        stopRecording()
    }, [stopRecording])

    const handleSourceClick = useCallback(async (selectedSource: AudioSourceType) => {
        if (isRecording) return

        setSource(selectedSource)
        setIsPillActive(true)
        clearHoverTimeout()

        try {
            await startRecording(selectedSource)
        } catch (error) {
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
        }
    }, [isRecording, startRecording, clearHoverTimeout])

    const handleMicButtonClick = useCallback(() => {
        if (isRecording) {
            handleStopRecording()
            return
        }
        clearHoverTimeout()
        setIsPillActive((prev) => !prev)
    }, [isRecording, handleStopRecording, clearHoverTimeout])

    useSyncExternalStore(
        useCallback(() => {
            const handler = () => setIsAssistantVisible(prev => !prev)
            window.addEventListener('toggle-assistant-visibility', handler)
            return () => window.removeEventListener('toggle-assistant-visibility', handler)
        }, []),
        () => null,
        () => null
    )

    useSyncExternalStore(
        useCallback((_callback) => {
            return () => {
                clearHoverTimeout()
                cleanupRecorder().catch(console.error)
            }
        }, [cleanupRecorder, clearHoverTimeout]),
        () => null,
        () => null
    )

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={capturePointerForOverlay}
        >
            <Button
                onClick={handleMicButtonClick}
                className={cn(
                    "rounded-full transition-all duration-200",
                    isDarkTheme
                        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900",
                    isRecording && "bg-red-500 hover:bg-red-600 text-white",
                    isPillActive && !isRecording && (isDarkTheme ? "bg-zinc-700" : "bg-zinc-200"),
                    className
                )}
                variant="ghost"
                size="icon"
                aria-label={isRecording ? "Stop recording" : "Audio options"}
                aria-expanded={shouldShowPill}
            >
                <Mic className="h-4 w-4" />
            </Button>

            {shouldShowPill && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onMouseEnter={handlePillMouseEnter}
                    onMouseLeave={handlePillMouseLeave}
                    onPointerDown={capturePointerForOverlay}
                    data-no-clickthrough
                >
                    <div
                        className={cn(
                            "relative flex flex-row items-center rounded-full border shadow-lg transition-all duration-300",
                            isRecording ? "gap-1 px-2 py-1.5" : "gap-1.5 pl-1.5 py-1.5 pr-3",
                            themeClasses.containerBorder
                        )}
                        style={{ backgroundColor: themeClasses.containerBg }}
                    >
                        {!isRecording ? (
                            <>
                                <AudioSourceSelector
                                    source={source}
                                    onSourceClick={handleSourceClick}
                                    isDarkTheme={isDarkTheme}
                                />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onPointerDown={capturePointerForOverlay}
                                            onClick={() => {
                                                if (!isVoiceInsertEnabled) {
                                                    setFeatureEnabled('voice-insert', true)
                                                }
                                                window.dispatchEvent(new CustomEvent('toggle-transcription-visibility'))
                                            }}
                                            className={cn(
                                                "h-8 w-8 rounded-full transition-all duration-200",
                                                isDarkTheme
                                                    ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                                    : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900"
                                            )}
                                            variant="ghost"
                                            size="icon"
                                        >
                                            <MessageSquareText className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className={cn(
                                            isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                                        )}
                                    >
                                        <p>Speech to Text</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onPointerDown={capturePointerForOverlay}
                                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-assistant-visibility'))}
                                            className={cn(
                                                "h-8 w-8 rounded-full transition-all duration-200",
                                                isVoiceLive
                                                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                                    : isAssistantVisible
                                                        ? "bg-blue-600/40 text-blue-200 hover:bg-blue-600/50"
                                                        : (isDarkTheme
                                                            ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                                            : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900")
                                            )}
                                            variant="ghost"
                                            size="icon"
                                        >
                                            <CircleEllipsis className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className={cn(
                                            isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                                        )}
                                    >
                                        <p>Voice</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        ) : (
                            <AudioRecorderControls
                                isPaused={isPaused}
                                recordingDuration={duration}
                                onPauseResume={isPaused ? resumeRecording : pauseRecording}
                                onStop={handleStopRecording}
                                formatDuration={formatDuration}
                                isDarkTheme={isDarkTheme}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
