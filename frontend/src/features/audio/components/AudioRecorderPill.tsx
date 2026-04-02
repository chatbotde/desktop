import { useState, useRef, useSyncExternalStore, useCallback } from 'react'
import { cn } from "@/shared/lib"
import { getThemeClasses } from "@/features/prompt"
import { useDraggable } from '@/features/output-window'
import { AudioSourceSelector } from './AudioSourceSelector'
import { AudioRecorderControls } from './AudioRecorderControls'
import { AudioRecorderDragHandle } from './AudioRecorderDragHandle'
import { TranscriptionToggle } from './TranscriptionToggle'
import { LiveTranscriptionPanel } from './LiveTranscriptionPanel'
import { AudioRecorderCloseButton } from './AudioRecorderCloseButton'
import { formatDuration } from './audio-utils'

import { useAudioRecorder, type AudioSourceType } from '../hooks/useAudioRecorder'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

interface AudioRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
    onRecordingComplete?: (audioBlob: Blob) => void
    onTranscriptionUpdate?: (text: string, isFinal: boolean) => void
}

export function AudioRecorderPill({ onClose, isDarkTheme = true, onRecordingComplete, onTranscriptionUpdate }: AudioRecorderPillProps) {
    // UI State
    const [source, setSource] = useState<AudioSourceType>('mic')
    const [showTranscription, setShowTranscription] = useState(false)
    const transcriptionContainerRef = useRef<HTMLDivElement>(null)

    // Position State
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight / 2 - 100 })
    const containerRef = useRef<HTMLDivElement>(null)

    const { handleDragMouseDown } = useDraggable(setPosition, containerRef)
    const themeClasses = getThemeClasses(isDarkTheme)

    // Hooks
    const handleRecordingComplete = useCallback((blob: Blob) => {
        // If live transcription was active, skip the preview
        if (showTranscription) {
            return
        }
        onRecordingComplete?.(blob)
    }, [showTranscription, onRecordingComplete])

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

    } = useLiveTranscription({
        onTranscriptionUpdate,
        isEnabled: showTranscription
    })

    // Refs for state access in callbacks
    const creditSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Sync transcription start/stop - use syncExternalStore for lifecycle
    useSyncExternalStore(
        useCallback((callback) => {
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
                return () => {}
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
            return () => {}
        }, [isRecording, showTranscription, activeStream, isTranscribing, startTranscription, stopTranscription, isPaused]),
        () => null,
        () => null
    )

    // Cleanup timeout on unmount
    useSyncExternalStore(
        useCallback((callback) => {
            return () => {
                if (creditSaveTimeoutRef.current) {
                    clearTimeout(creditSaveTimeoutRef.current)
                }
            }
        }, []),
        () => null,
        () => null
    )

    // Cleanup on unmount
    useSyncExternalStore(
        useCallback((callback) => {
            return () => {
                cleanupRecorder().catch(console.error)
            }
        }, [cleanupRecorder]),
        () => null,
        () => null
    )

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
            console.error('[AudioRecorderPill] Failed to dispatch prompt-add-text event:', error)
        }
    }, [transcriptionText, partialText])

    const handleClearTranscription = useCallback(() => {
        setTranscriptionText('')
        setPartialText('')
    }, [setTranscriptionText, setPartialText])

    // Auto-scroll transcription - use syncExternalStore for lifecycle
    useSyncExternalStore(
        useCallback((callback) => {
            if (transcriptionContainerRef.current && (transcriptionText || partialText)) {
                const container = transcriptionContainerRef.current
                const scrollElement = container.querySelector('[style*="overflow-y"]') as HTMLElement
                if (scrollElement) {
                    scrollElement.scrollTop = scrollElement.scrollHeight
                }
            }
            return () => {}
        }, [transcriptionText, partialText]),
        () => null,
        () => null
    )

    return (
        <div
            ref={containerRef}
            className="fixed z-[50] flex flex-row items-center gap-2"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <AudioRecorderDragHandle
                onDragMouseDown={handleDragMouseDown}
                isDarkTheme={isDarkTheme}
            />

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
                        onStop={stopRecording}
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

                {!isRecording && (
                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto z-50">
                        <div
                            className={cn("rounded-full border shadow-sm", themeClasses.containerBorder)}
                            style={{ backgroundColor: themeClasses.containerBg }}
                        >
                            <AudioRecorderCloseButton
                                onClose={() => {
                                    if (!transcriptionText && !partialText) {
                                        onClose()
                                    } else {
                                        stopRecording()
                                    }
                                }}
                                hasTranscription={!!(transcriptionText || partialText)}
                                isDarkTheme={isDarkTheme}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
