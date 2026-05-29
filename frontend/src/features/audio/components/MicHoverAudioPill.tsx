import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { Mic, CircleEllipsis, MessageSquareText } from 'lucide-react'
import { cn } from "@/shared/lib"
import { Button } from '@/shared/components/ui/button'
import { getThemeClasses } from "@/features/prompt"
import { AudioSourceSelector } from './AudioSourceSelector'
import { AudioRecorderControls } from './AudioRecorderControls'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

import { formatDuration } from './audio-utils'

import { useAudioRecorder, type AudioSourceType } from '../hooks/useAudioRecorder'
import { useLiveTranscription } from '../hooks/useLiveTranscription'
import { useFeature } from '@/contexts/FeatureContext'

interface MicHoverAudioPillProps {
    isDarkTheme?: boolean
    className?: string
    onRecordingComplete?: (audioBlob: Blob) => void
    onTranscriptionUpdate?: (text: string, isFinal: boolean) => void
}

/**
 * A mic button that shows an audio recording pill on hover.
 * The pill appears above/adjacent to the mic button and allows audio recording.
 * This pill does NOT have a drag handle - it's fixed relative to the mic button.
 * 
 * When transcription is enabled: auto-adds transcription text to prompt on stop
 * When transcription is disabled: auto-adds audio file to prompt on stop
 */
export function MicHoverAudioPill({
    isDarkTheme = true,
    className,
    onRecordingComplete,
    onTranscriptionUpdate
}: MicHoverAudioPillProps) {
    // UI State
    const { isFeatureEnabled, setFeatureEnabled } = useFeature()
    const isVoiceToPrompt = isFeatureEnabled('voice-to-prompt')
    const isVoiceInsertEnabled = isFeatureEnabled('voice-insert')
    const [isPillActive, setIsPillActive] = useState(false)
    const [source, setSource] = useState<AudioSourceType>('mic')
    const showTranscription = isVoiceToPrompt
    const [isAssistantVisible, setIsAssistantVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const creditSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // HOOKS MUST BE CALLED BEFORE ANY VARIABLE USAGE
    const handleRecordingComplete = useCallback((blob: Blob) => {
        console.log('[MicHoverAudioPill] Recording complete, size:', blob.size, 'bytes')
        console.log('[MicHoverAudioPill] showTranscription was:', showTranscription)

        if (!showTranscription) {
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
            try {
                window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
                console.log('[MicHoverAudioPill] Dispatched audio file to prompt')
            } catch (error) {
                console.error('[MicHoverAudioPill] Failed to dispatch prompt-add-files event:', error)
            }
        }

        onRecordingComplete?.(blob)
        setIsPillActive(false)
    }, [onRecordingComplete, showTranscription])

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

    const {
        transcriptionText,
        partialText,
        stopTranscription,
        clearTranscription
    } = useLiveTranscription({
        onTranscriptionUpdate,
        isEnabled: showTranscription
    })

    const themeClasses = getThemeClasses(isDarkTheme)

    // Use refs directly - assign after hooks are called
    const transcriptionTextRef = useRef(transcriptionText)
    transcriptionTextRef.current = transcriptionText
    const partialTextRef = useRef(partialText)
    partialTextRef.current = partialText

    // Keep the pill open while recording
    const shouldShowPill = isPillActive || isRecording

    // Clear timeout helper
    const clearHoverTimeout = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
    }, [])

    // Handle mouse enter with a small delay to prevent accidental triggers
    const handleMouseEnter = useCallback(() => {
        clearHoverTimeout()
        hoverTimeoutRef.current = setTimeout(() => {
            setIsPillActive(true)
        }, 150)
    }, [clearHoverTimeout])

    // Handle mouse leave - only hide if not recording
    const handleMouseLeave = useCallback(() => {
        clearHoverTimeout()
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, 300)
        }
    }, [isRecording, clearHoverTimeout])

    // Handle pill mouse enter - keep it visible
    const handlePillMouseEnter = useCallback(() => {
        clearHoverTimeout()
    }, [clearHoverTimeout])

    // Handle pill mouse leave
    const handlePillMouseLeave = useCallback(() => {
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, 300)
        }
    }, [isRecording])

    // Custom stop handler that auto-adds transcription to prompt
    const handleStopRecording = useCallback(async () => {
        console.log('[MicHoverAudioPill] Stopping recording, showTranscription:', showTranscription, 'isVoiceToPrompt:', isVoiceToPrompt)

        // If transcription is active, handle it specially
        if (showTranscription) {
            // Stop transcription first
            await stopTranscription()

            // Wait a brief moment for any final transcription chunks to arrive
            await new Promise(resolve => setTimeout(resolve, 500))

            // Get the full transcribed text using refs
            const fullText = `${transcriptionTextRef.current} ${partialTextRef.current}`.trim()
            console.log('[MicHoverAudioPill] Full transcription text:', fullText)

            if (fullText) {
                if (isVoiceToPrompt) {
                    // Send to LLM immediately!
                    try {
                        window.dispatchEvent(new CustomEvent('prompt-send-now', { detail: { text: fullText } }))
                        console.log('[MicHoverAudioPill] Dispatched prompt-send-now with text')
                    } catch (error) {
                        console.error('[MicHoverAudioPill] Failed to dispatch prompt-send-now event:', error)
                    }
                } else {
                    // Auto-add transcription to prompt
                    try {
                        window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: fullText } }))
                        console.log('[MicHoverAudioPill] Dispatched transcription text to prompt')
                    } catch (error) {
                        console.error('[MicHoverAudioPill] Failed to dispatch prompt-add-text event:', error)
                    }
                }
            }

            // Clear transcription for next use
            clearTranscription()
        }

        // Stop recording (this will trigger handleRecordingComplete)
        stopRecording()
    }, [stopTranscription, stopRecording, clearTranscription, showTranscription, isVoiceToPrompt])

    // Assistant visibility event listener using useSyncExternalStore
    useSyncExternalStore(
        useCallback(() => {
            const handler = () => setIsAssistantVisible(prev => !prev)
            window.addEventListener('toggle-assistant-visibility', handler)
            return () => window.removeEventListener('toggle-assistant-visibility', handler)
        }, []),
        () => null,
        () => null
    )

    // Cleanup on unmount - use ref pattern
    const cleanupRef = useRef<(() => void) | null>(null)
    cleanupRef.current = () => {
        if (creditSaveTimeoutRef.current) {
            clearTimeout(creditSaveTimeoutRef.current)
        }
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        cleanupRecorder().catch(console.error)
    }
    // Register cleanup
    useSyncExternalStore(
        () => () => cleanupRef.current?.(),
        () => null,
        () => null
    )

    // Handle mic button click - start/stop recording with selected source
    const handleSourceClick = useCallback(async (selectedSource: AudioSourceType) => {
        if (isRecording) return
        setSource(selectedSource)
        try {
            await startRecording(selectedSource)
        } catch (error) {
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
        }
    }, [isRecording, startRecording])

    if (!isVoiceToPrompt && !isVoiceInsertEnabled) {
        return null
    }

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Mic Button - Click to start/stop recording */}
            <Button
                className={cn(
                    "rounded-full transition-all duration-200",
                    isDarkTheme
                        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900",
                    isRecording && "bg-red-500 hover:bg-red-600 text-white",
                    className
                )}
                variant="ghost"
                size="icon"
                aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
                <Mic className="h-4 w-4" />
            </Button>

            {/* Audio Pill - appears on hover, positioned above the button */}
            {shouldShowPill && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onMouseEnter={handlePillMouseEnter}
                    onMouseLeave={handlePillMouseLeave}
                    data-no-clickthrough
                >
                    <div
                        className={cn(
                            "relative group flex flex-row items-center gap-1.5 pl-1.5 py-1.5 pr-3 rounded-full border shadow-lg transition-all duration-300",
                            themeClasses.containerBorder
                        )}
                        style={{
                            backgroundColor: themeClasses.containerBg,
                        }}
                    >
                        {!isRecording ? (
                            <AudioSourceSelector
                                source={source}
                                onSourceClick={handleSourceClick}
                                isDarkTheme={isDarkTheme}
                            />
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

                        {/* 
                        <TranscriptionToggle
                            showTranscription={showTranscription}
                            onToggle={() => setShowTranscription(!showTranscription)}
                            isRecording={isRecording}
                            isDarkTheme={isDarkTheme}
                        />
                        */}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
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

                        {/* Assistant Toggle Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-assistant-visibility'))}
                                    className={cn(
                                        "h-8 w-8 rounded-full transition-all duration-200",
                                        isAssistantVisible
                                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
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

                        {/* 
                        <LiveTranscriptionPanel
                            showTranscription={showTranscription}
                            isRecording={isRecording}
                            isPaused={isPaused}
                            transcriptionText={transcriptionText}
                            partialText={partialText}
                            isTranscribing={isTranscribing}
                            onClose={() => setShowTranscription(false)}
                            onClear={handleClearTranscription}
                            onPauseResume={isPaused ? resumeRecording : pauseRecording}
                            onAddTranscription={handleAddTranscription}
                            transcriptionContainerRef={transcriptionContainerRef}
                            isDarkTheme={isDarkTheme}
                            onTextChange={setTranscriptionText}
                        />
                        */}


                    </div>
                </div>
            )}
        </div>
    )
}
