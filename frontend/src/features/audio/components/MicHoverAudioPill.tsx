import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, CircleEllipsis, Bot } from 'lucide-react'
import { cn } from "@/shared/lib"
import { Button } from '@/shared/components/ui/button'
import { getThemeClasses } from "@/features/prompt"
import { AudioSourceSelector } from './AudioSourceSelector'
import { AudioRecorderControls } from './AudioRecorderControls'
import { TranscriptionToggle } from './TranscriptionToggle'
import { LiveTranscriptionPanel } from './LiveTranscriptionPanel'

import { formatDuration } from './audio-utils'

import { useAudioRecorder, type AudioSourceType } from '../hooks/useAudioRecorder'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

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
    const [, setIsHovered] = useState(false)
    const [isPillActive, setIsPillActive] = useState(false)
    const [source, setSource] = useState<AudioSourceType>('mic')
    const [showTranscription, setShowTranscription] = useState(false)
    const transcriptionContainerRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const creditSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Refs to track latest transcription values (like LiveTranscriptionButton)
    const transcriptionTextRef = useRef('')
    const partialTextRef = useRef('')
    const showTranscriptionRef = useRef(false)

    const themeClasses = getThemeClasses(isDarkTheme)

    // Handle recording complete - only add audio file if transcription was NOT active
    const handleRecordingComplete = useCallback((blob: Blob) => {
        console.log('[MicHoverAudioPill] Recording complete, size:', blob.size, 'bytes')
        console.log('[MicHoverAudioPill] showTranscription was:', showTranscriptionRef.current)

        // If transcription was active, don't add audio file (transcription text will be added in handleStopRecording)
        if (!showTranscriptionRef.current) {
            // Convert blob to File and dispatch event to add to prompt
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
            try {
                window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
                console.log('[MicHoverAudioPill] Dispatched audio file to prompt')
            } catch (error) {
                console.error('[MicHoverAudioPill] Failed to dispatch prompt-add-files event:', error)
            }
        }

        // Call the optional callback
        onRecordingComplete?.(blob)

        // Hide the pill after recording is complete
        setIsPillActive(false)
    }, [onRecordingComplete])

    const {
        isRecording,
        isPaused,
        duration,
        activeStream,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        cleanup: cleanupRecorder
    } = useAudioRecorder({ onRecordingComplete: handleRecordingComplete })

    const {
        transcriptionText,
        partialText,
        isTranscribing,
        startTranscription,
        stopTranscription,
        setTranscriptionText,
        setPartialText,
        clearTranscription
    } = useLiveTranscription({
        onTranscriptionUpdate,
        isEnabled: showTranscription
    })

    // Keep refs in sync with state (for use in callbacks)
    useEffect(() => {
        transcriptionTextRef.current = transcriptionText
    }, [transcriptionText])

    useEffect(() => {
        partialTextRef.current = partialText
    }, [partialText])

    useEffect(() => {
        showTranscriptionRef.current = showTranscription
    }, [showTranscription])

    // Keep the pill open while recording
    const shouldShowPill = isPillActive || isRecording

    // Handle mouse enter with a small delay to prevent accidental triggers
    const handleMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(true)
            setIsPillActive(true)
        }, 150)
    }, [])

    // Handle mouse leave - only hide if not recording
    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setIsHovered(false)

        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, 300)
        }
    }, [isRecording])

    // Handle pill mouse enter - keep it visible
    const handlePillMouseEnter = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setIsHovered(true)
    }, [])

    // Handle pill mouse leave
    const handlePillMouseLeave = useCallback(() => {
        setIsHovered(false)
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, 300)
        }
    }, [isRecording])

    // Custom stop handler that auto-adds transcription to prompt
    const handleStopRecording = useCallback(async () => {
        console.log('[MicHoverAudioPill] Stopping recording, showTranscription:', showTranscriptionRef.current)

        // If transcription is active, handle it specially
        if (showTranscriptionRef.current) {
            // Stop transcription first
            await stopTranscription()

            // Wait a brief moment for any final transcription chunks to arrive
            await new Promise(resolve => setTimeout(resolve, 500))

            // Get the full transcribed text using refs
            const fullText = `${transcriptionTextRef.current} ${partialTextRef.current}`.trim()
            console.log('[MicHoverAudioPill] Full transcription text:', fullText)

            if (fullText) {
                // Auto-add transcription to prompt
                try {
                    window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: fullText } }))
                    console.log('[MicHoverAudioPill] Dispatched transcription text to prompt')
                } catch (error) {
                    console.error('[MicHoverAudioPill] Failed to dispatch prompt-add-text event:', error)
                }
            }

            // Clear transcription for next use
            clearTranscription()
        }

        // Stop recording (this will trigger handleRecordingComplete)
        stopRecording()
    }, [stopTranscription, stopRecording, clearTranscription])

    // Sync transcription start/stop with recording state
    useEffect(() => {
        // Toggle track enablement based on paused state
        if (activeStream) {
            activeStream.getAudioTracks().forEach(track => {
                track.enabled = !isPaused
            })
        }

        const shouldTranscribe = isRecording && showTranscription && activeStream

        if (!shouldTranscribe) {
            if (isTranscribing) stopTranscription()
            if (creditSaveTimeoutRef.current) {
                clearTimeout(creditSaveTimeoutRef.current)
                creditSaveTimeoutRef.current = null
            }
            return
        }

        if (isPaused) {
            if (isTranscribing && !creditSaveTimeoutRef.current) {
                creditSaveTimeoutRef.current = setTimeout(() => {
                    stopTranscription()
                    creditSaveTimeoutRef.current = null
                }, 10000)
            }
        } else {
            if (creditSaveTimeoutRef.current) {
                clearTimeout(creditSaveTimeoutRef.current)
                creditSaveTimeoutRef.current = null
            }
            if (!isTranscribing) {
                startTranscription(activeStream!)
            }
        }
    }, [isRecording, showTranscription, activeStream, isTranscribing, startTranscription, stopTranscription, isPaused])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (creditSaveTimeoutRef.current) {
                clearTimeout(creditSaveTimeoutRef.current)
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupRecorder().catch(console.error)
        }
    }, [cleanupRecorder])

    // Handle mic button click - start/stop recording with selected source
    const handleMicClick = useCallback(async () => {
        if (isRecording) {
            // If already recording, stop it
            handleStopRecording()
        } else {
            // Start recording with the selected source
            setIsPillActive(true)
            try {
                await startRecording(source)
            } catch (error) {
                alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
            }
        }
    }, [isRecording, source, startRecording, handleStopRecording])

    const handleSourceClick = useCallback(async (selectedSource: AudioSourceType) => {
        if (isRecording) return
        setSource(selectedSource)
        try {
            await startRecording(selectedSource)
        } catch (error) {
            alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
        }
    }, [isRecording, startRecording])

    const handleAddTranscription = useCallback(() => {
        const fullText = `${transcriptionText} ${partialText}`.trim()
        if (!fullText) return
        try {
            window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: fullText } }))
        } catch (error) {
            console.error('[MicHoverAudioPill] Failed to dispatch prompt-add-text event:', error)
        }
    }, [transcriptionText, partialText])

    const handleClearTranscription = useCallback(() => {
        setTranscriptionText('')
        setPartialText('')
    }, [setTranscriptionText, setPartialText])



    // Auto-scroll transcription
    useEffect(() => {
        if (transcriptionContainerRef.current && (transcriptionText || partialText)) {
            const container = transcriptionContainerRef.current
            const scrollElement = container.querySelector('[style*="overflow-y"]') as HTMLElement
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight
            }
        }
    }, [transcriptionText, partialText])

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Mic Button - Click to start/stop recording */}
            <Button
                onClick={handleMicClick}
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
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
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

                        <TranscriptionToggle
                            showTranscription={showTranscription}
                            onToggle={() => setShowTranscription(!showTranscription)}
                            isRecording={isRecording}
                            isDarkTheme={isDarkTheme}
                        />

                        {/* Assistant Toggle Button */}
                        <Button
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-assistant-visibility'))}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                isDarkTheme
                                    ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                    : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900"
                            )}
                            variant="ghost"
                            size="icon"
                            title="Toggle Live Assistant"
                        >
                            <CircleEllipsis className="h-4 w-4" />
                        </Button>

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


                    </div>
                </div>
            )}
        </div>
    )
}
