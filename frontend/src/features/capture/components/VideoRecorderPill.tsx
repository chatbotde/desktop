/**
 * Video Recorder Pill Component
 * A floating pill UI for screen video recording with FPS control
 */

import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { cn } from "@/shared/lib"
import { getThemeClasses } from "@/features/prompt"
import { useDraggable } from '@/features/output-window'
import { useVideoRecording, type VideoRecordingOptions, type VideoData } from '@/hooks/useVideoRecording'
import { VideoRecorderDragHandle } from './VideoRecorderDragHandle'
import { VideoRecorderControls } from './VideoRecorderControls'
import { VideoSourceSelector } from './VideoSourceSelector'
import { VideoRecorderCloseButton } from './VideoRecorderCloseButton'

interface VideoRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
    onRecordingComplete?: (video: VideoData) => void
    defaultFps?: number
}

// Helper to format duration in mm:ss
function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// FPS Presets
const FPS_PRESETS = [15, 24, 30, 60]

// Quality Presets
const QUALITY_PRESETS = [
    { label: '720p', width: 1280, height: 720, bitrate: 1500000 },
    { label: '1080p', width: 1920, height: 1080, bitrate: 2500000 },
    { label: '1440p', width: 2560, height: 1440, bitrate: 5000000 },
    { label: '4K', width: 3840, height: 2160, bitrate: 8000000 },
]

export function VideoRecorderPill({
    onClose,
    isDarkTheme = true,
    onRecordingComplete,
    defaultFps = 30
}: VideoRecorderPillProps) {
    // Settings state
    const [fps, setFps] = useState(defaultFps)
    const [quality, setQuality] = useState(QUALITY_PRESETS[1]) // 1080p default
    const [showSettings, setShowSettings] = useState(false)

    // Position state
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight / 2 - 50 })
    const containerRef = useRef<HTMLDivElement>(null)
    const settingsRef = useRef<HTMLDivElement>(null)

    const { handleDragMouseDown } = useDraggable(setPosition, containerRef)
    const themeClasses = getThemeClasses(isDarkTheme)

    // Video recording hook
    const {
        isPaused,
        recordingState,
        duration,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
    } = useVideoRecording()

    // Close settings when clicking outside - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const handleClickOutside = (e: MouseEvent) => {
                if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                    setShowSettings(false)
                }
            }

            if (showSettings) {
                document.addEventListener('mousedown', handleClickOutside)
            }
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [showSettings]),
        () => null,
        () => null
    )

    // Handle start recording
    const handleStartRecording = useCallback(async () => {
        const options: VideoRecordingOptions = {
            fps,
            width: quality.width,
            height: quality.height,
            videoBitsPerSecond: quality.bitrate,
            audioEnabled: true  // Enable system audio capture
        }

        const success = await startRecording(options)
        if (success) {
            setShowSettings(false)
        }
    }, [fps, quality, startRecording])

    // Handle stop recording
    const handleStopRecording = useCallback(async () => {
        const video = await stopRecording()
        if (video) {
            onRecordingComplete?.(video)
        }
    }, [stopRecording, onRecordingComplete])

    return (
        <div
            ref={containerRef}
            className="fixed z-[50] flex flex-row items-center gap-2"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            data-no-clickthrough
        >
            <VideoRecorderDragHandle
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
                {recordingState === 'idle' ? (
                    <VideoSourceSelector
                        onStartClick={handleStartRecording}
                        onSettingsClick={() => setShowSettings(!showSettings)}
                        isDarkTheme={isDarkTheme}
                    />
                ) : (
                    <VideoRecorderControls
                        isPaused={isPaused}
                        recordingDuration={duration}
                        onPauseResume={isPaused ? resumeRecording : pauseRecording}
                        onStop={handleStopRecording}
                        formatDuration={formatDuration}
                        fps={fps}
                        isDarkTheme={isDarkTheme}
                    />
                )}

                {/* Error Display */}
                {error && (
                    <div className={cn(
                        "text-xs max-w-[150px] truncate",
                        isDarkTheme ? "text-red-400" : "text-red-600"
                    )}>
                        {error}
                    </div>
                )}

                {/* Close Button (on hover, when not recording) */}
                {recordingState === 'idle' && (
                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto z-50">
                        <div
                            className={cn("rounded-full border shadow-sm", themeClasses.containerBorder)}
                            style={{ backgroundColor: themeClasses.containerBg }}
                        >
                            <VideoRecorderCloseButton
                                onClose={onClose}
                                isDarkTheme={isDarkTheme}
                            />
                        </div>
                    </div>
                )}

                {/* Settings Popover */}
                {showSettings && (
                    <div
                        ref={settingsRef}
                        className={cn(
                            "absolute top-full left-0 mt-2 p-4 rounded-xl border shadow-xl min-w-[240px] z-50",
                            themeClasses.containerBorder
                        )}
                        style={{ backgroundColor: themeClasses.containerBg }}
                    >
                        {/* FPS Selection - compact */}
                        <div className="mb-3">
                            <label className={cn(
                                "block text-[11px] font-semibold mb-1 uppercase tracking-tight",
                                isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                            )}>
                                FPS
                            </label>
                            <div className="flex gap-1">
                                {FPS_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setFps(preset)}
                                        className={cn(
                                            "px-2 py-1 rounded text-xs font-medium transition-all",
                                            fps === preset
                                                ? "bg-blue-500/30 text-blue-600 border border-blue-500/40"
                                                : isDarkTheme
                                                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality Selection */}
                        <div>
                            <label className={cn(
                                "block text-[11px] font-semibold mb-1 uppercase tracking-tight",
                                isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                            )}>
                                Quality
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                                {QUALITY_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setQuality(preset)}
                                        className={cn(
                                            "px-2 py-1 rounded text-xs font-medium transition-all",
                                            quality.label === preset.label
                                                ? "bg-blue-500/30 text-blue-600 border border-blue-500/40"
                                                : isDarkTheme
                                                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                        )}
                                    >
                                        <div>{preset.label}</div>
                                        <div className={cn(
                                            "text-[11px]",
                                            isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                                        )}>
                                            {preset.width}×{preset.height}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>


                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoRecorderPill
