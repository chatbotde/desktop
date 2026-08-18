import { useState, useRef, useCallback, useSyncExternalStore, useMemo } from 'react'
import { Video, Camera, Square, Circle, Timer, Focus, Loader2, Smartphone, Crop } from 'lucide-react'
import { cn } from "@/shared/lib"
import { Button } from '@/shared/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { getThemeClasses } from "@/features/prompt"
import { useVideoRecording, type VideoData } from '@/hooks/useVideoRecording'
import { useFeature } from '@/contexts/FeatureContext'
import { triggerRectangleScreenshot } from '@/features/capture/lib/trigger-rectangle-screenshot'
import { triggerRectangleAreaRecording } from '@/features/capture/lib/trigger-rectangle-area-recording'
import { CaptureAreaStore } from '@/features/capture/capture-area-store'
import {
    sendFileToPhone,
    sendFileToPhoneErrorMessage,
} from '@/lib/remote-pad/send-file-to-phone'

// Constants for configuration
const HOVER_DELAY_MS = 150
const HIDE_DELAY_MS = 300
const SET_AREA_MOUNT_DELAY_MS = 50

interface VideoHoverCapturePillProps {
    isDarkTheme?: boolean
    className?: string
    onVideoAdded?: (video: VideoData) => void
    onScreenshotAdded?: (file: File) => void
}

type CaptureAction = 'video' | 'area-video' | 'area-screenshot' | 'rectangle-screenshot' | 'quick-screenshot' | 'auto-screenshot' | 'set-area' | 'send-to-phone'

interface ActionButtonProps {
    onClick: () => void
    isActive?: boolean
    activeColor?: 'red' | 'blue' | 'green'
    disabled?: boolean
    ariaLabel: string
    title: string
    children: React.ReactNode
    className: string
    isDarkTheme?: boolean
}

/** Reusable action button with active state styling */
function ActionButton({
    onClick,
    isActive,
    activeColor = 'blue',
    disabled,
    ariaLabel,
    title,
    children,
    className,
    isDarkTheme = true
}: ActionButtonProps) {
    const activeColors = {
        red: 'bg-red-500 hover:bg-red-600 text-white rounded-full',
        blue: 'bg-blue-500 hover:bg-blue-600 text-white rounded-full',
        green: 'bg-green-500 hover:bg-green-600 text-white rounded-full',
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(className, isActive && activeColors[activeColor])}
                    aria-label={ariaLabel}
                    disabled={disabled}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className={cn(
                    isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                )}
            >
                {title}
            </TooltipContent>
        </Tooltip>
    )
}

/** Fast base64 to blob conversion (much faster than fetch) */
function dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',')
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(parts[1])
    const n = bstr.length
    const u8arr = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i)
    }
    return new Blob([u8arr], { type: mime })
}

/**
 * A video button that shows capture options on hover.
 * The pill appears above the video button and shows:
 * - Video Recording
 * - Area Screenshot
 * - Quick Screenshot
 * - Auto Screenshot toggle
 * - Set Area Capture
 */
export function VideoHoverCapturePill({
    isDarkTheme = true,
    className,
    onVideoAdded,
    onScreenshotAdded
}: VideoHoverCapturePillProps) {
    // UI State
    const [isPillActive, setIsPillActive] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [isSendingToPhone, setIsSendingToPhone] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Memoize theme classes to prevent re-renders
    const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])

    // Feature toggles for toggleable pill actions
    const { isFeatureEnabled, setFeatureEnabled } = useFeature()
    const autoScreenshotEnabled = isFeatureEnabled('auto-screenshot')
    const setCaptureAreaEnabled = isFeatureEnabled('set-capture-area')

    // Video recording hook
    const {
        recordingState,
        error,
        startRecording,
        stopRecording,
    } = useVideoRecording()

    const isRecording = recordingState === 'recording' || recordingState === 'paused'

    // Keep the pill open while recording
    const shouldShowPill = isPillActive || isRecording

    // Cleanup timeout on unmount - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            return () => {
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                }
            }
        }, []),
        () => null,
        () => null
    )

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
        }, HOVER_DELAY_MS)
    }, [clearHoverTimeout])

    // Handle mouse leave - only hide if not recording
    const handleMouseLeave = useCallback(() => {
        clearHoverTimeout()
        if (!isRecording) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPillActive(false)
            }, HIDE_DELAY_MS)
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
            }, HIDE_DELAY_MS)
        }
    }, [isRecording])

    // Handle recording complete
    const handleRecordingComplete = useCallback(async (video: VideoData) => {
        try {
            const videoFile = video.blob
                ? new File([video.blob], video.name, { type: video.type })
                : new File([dataUrlToBlob(video.data)], video.name, { type: video.type })

            window.dispatchEvent(new CustomEvent('prompt-add-files', {
                detail: { files: [videoFile] }
            }))

            onVideoAdded?.(video)
        } catch (err) {
            console.error('[VideoHoverCapturePill] Failed to add video to prompt:', err)
        }
        setIsPillActive(false)
    }, [onVideoAdded])

    // Handle video button click - start/stop recording
    const handleVideoClick = useCallback(async () => {
        if (isRecording) {
            const video = await stopRecording()
            if (video) {
                await handleRecordingComplete(video)
            }
        } else {
            setIsPillActive(true)
            try {
                await startRecording({ fps: 30, audioEnabled: true })
            } catch (err) {
                alert(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`)
            }
        }
    }, [isRecording, startRecording, stopRecording, handleRecordingComplete])

    const startAreaVideoRecording = useCallback(async (area: { x: number; y: number; width: number; height: number }) => {
        setIsPillActive(true)
        try {
            const started = await startRecording({ fps: 30, audioEnabled: true, area })
            if (!started) {
                alert('Failed to start area recording')
            }
        } catch (err) {
            alert(`Failed to start area recording: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [startRecording])

    const handleAreaVideoRecording = useCallback(() => {
        if (isRecording) {
            void handleVideoClick()
            return
        }

        setIsPillActive(false)

        const savedArea = setCaptureAreaEnabled ? CaptureAreaStore.getArea() : null
        if (savedArea) {
            void startAreaVideoRecording(savedArea)
            return
        }

        setIsCapturing(true)
        triggerRectangleAreaRecording({
            onAreaSelected: startAreaVideoRecording,
            onComplete: () => setIsCapturing(false),
        })
    }, [isRecording, handleVideoClick, setCaptureAreaEnabled, startAreaVideoRecording])

    // Handle quick screenshot
    const handleQuickScreenshot = useCallback(async () => {
        if (!window.CaptureAPI) {
            console.error('CaptureAPI is not available')
            return
        }

        setIsCapturing(true)
        try {
            const result = await window.CaptureAPI.quickScreenshot()
            if (result.success && result.screenshot) {
                const blob = dataUrlToBlob(result.screenshot.data)
                const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })

                window.dispatchEvent(new CustomEvent('prompt-add-files', {
                    detail: { files: [file] }
                }))

                onScreenshotAdded?.(file)
            }
        } catch (err) {
            console.error('Error taking screenshot:', err)
        } finally {
            setIsCapturing(false)
            setIsPillActive(false)
        }
    }, [onScreenshotAdded])

    const handleSendScreenshotToPhone = useCallback(async () => {
        if (!window.CaptureAPI) {
            console.error('CaptureAPI is not available')
            return
        }

        setIsSendingToPhone(true)
        try {
            const result = await window.CaptureAPI.quickScreenshot()
            if (!result.success || !result.screenshot) {
                alert('Screenshot failed')
                return
            }

            const blob = dataUrlToBlob(result.screenshot.data)
            const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
            const sendResult = await sendFileToPhone(file)
            if (!sendResult.ok) {
                alert(sendFileToPhoneErrorMessage(sendResult.reason))
            }
        } catch (err) {
            console.error('Send to phone failed:', err)
            alert(err instanceof Error ? err.message : 'Send to phone failed')
        } finally {
            setIsSendingToPhone(false)
            setIsPillActive(false)
        }
    }, [])

    // Handle area screenshot (freehand draw) - trigger area selection overlay
    const handleAreaScreenshot = useCallback(() => {
        setIsPillActive(false)
        setIsCapturing(true)
        const event = new CustomEvent('show-area-screenshot', {
            detail: {
                onCapture: async (area: { x: number; y: number; width: number; height: number }) => {
                    try {
                        if (!window.CaptureAPI) {
                            console.error('CaptureAPI is not available')
                            return
                        }
                        const result = await (window.CaptureAPI as any).takeAreaScreenshot(area)
                        if (result.success && result.screenshot) {
                            const blob = dataUrlToBlob(result.screenshot.data)
                            const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
                            const centerX = area.x + area.width / 2
                            const centerY = area.y + area.height / 2
                            window.dispatchEvent(new CustomEvent('screenshot-selection-captured', {
                                detail: { file, position: { x: centerX, y: centerY } }
                            }))
                        } else {
                            console.error('Area screenshot failed:', result.error)
                        }
                    } catch (err) {
                        console.error('Error taking area screenshot:', err)
                    } finally {
                        setIsCapturing(false)
                    }
                },
            },
        })
        window.dispatchEvent(event)
    }, [])

    // Handle rectangle screenshot - drag rectangle, then popup (Add to prompt / Expand to ask)
    const handleRectangleScreenshot = useCallback(() => {
        setIsPillActive(false)
        setIsCapturing(true)
        triggerRectangleScreenshot({ onComplete: () => setIsCapturing(false) })
    }, [])

    // Handle set area capture - toggle feature
    const handleSetAreaCapture = useCallback(() => {
        setIsPillActive(false)

        if (setCaptureAreaEnabled) {
            setFeatureEnabled('set-capture-area', false)
        } else {
            setFeatureEnabled('set-capture-area', true)
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('trigger-set-capture-area'))
            }, SET_AREA_MOUNT_DELAY_MS)
        }
    }, [setFeatureEnabled, setCaptureAreaEnabled])

    // Toggle auto-screenshot
    const handleToggleAutoScreenshot = useCallback(() => {
        setFeatureEnabled('auto-screenshot', !autoScreenshotEnabled)
    }, [autoScreenshotEnabled, setFeatureEnabled])

    // Handle action click - dispatch to appropriate handler
    const handleActionClick = useCallback((action: CaptureAction) => {
        const handlers: Record<CaptureAction, () => void> = {
            'video': handleVideoClick,
            'area-video': handleAreaVideoRecording,
            'quick-screenshot': handleQuickScreenshot,
            'area-screenshot': handleAreaScreenshot,
            'rectangle-screenshot': handleRectangleScreenshot,
            'auto-screenshot': handleToggleAutoScreenshot,
            'set-area': handleSetAreaCapture,
            'send-to-phone': handleSendScreenshotToPhone,
        }
        handlers[action]()
    }, [handleVideoClick, handleAreaVideoRecording, handleQuickScreenshot, handleAreaScreenshot, handleRectangleScreenshot, handleToggleAutoScreenshot, handleSetAreaCapture, handleSendScreenshotToPhone])

    // Toggle pill on click (in addition to hover) for easier access
    const handleCameraButtonClick = useCallback(() => {
        if (isRecording) {
            void handleVideoClick()
            return
        }
        setIsPillActive((prev) => !prev)
    }, [isRecording, handleVideoClick])

    // Memoize button class
    const actionButtonClass = useMemo(() => cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 shrink-0",
        isDarkTheme
            ? "hover:bg-zinc-700 text-zinc-100"
            : "hover:bg-zinc-200 text-zinc-900"
    ), [isDarkTheme])

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Capture Button - Click to start/stop recording */}
            <Button
                onClick={handleCameraButtonClick}
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
                aria-label={isRecording ? "Stop recording" : "Capture options"}
                aria-expanded={shouldShowPill}
                disabled={!!error}
            >
                {isRecording ? (
                    <Square className="h-4 w-4" />
                ) : isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Camera className="h-4 w-4" />
                )}
            </Button>

            {/* Capture Options Pill - appears on hover */}
            {shouldShowPill && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onMouseEnter={handlePillMouseEnter}
                    onMouseLeave={handlePillMouseLeave}
                    data-no-clickthrough
                >
                    <div
                        className={cn(
                            "flex flex-row items-center gap-1 px-2 py-1.5 rounded-full border shadow-lg",
                            themeClasses.containerBorder
                        )}
                        style={{ backgroundColor: themeClasses.containerBg }}
                    >
                        <ActionButton
                            onClick={() => handleActionClick('video')}
                            isActive={isRecording}
                            activeColor="red"
                            ariaLabel={isRecording ? "Stop recording" : "Video recording"}
                            title={isRecording ? "Stop recording" : "Video recording"}
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            {isRecording ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('area-video')}
                            isActive={isRecording}
                            activeColor="red"
                            disabled={isCapturing}
                            ariaLabel={isRecording ? "Stop area recording" : "Record selected area"}
                            title={
                                isRecording
                                    ? "Stop recording"
                                    : setCaptureAreaEnabled && CaptureAreaStore.getArea()
                                        ? "Record capture area"
                                        : "Record area — drag to select region"
                            }
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            {isRecording ? <Square className="h-4 w-4" /> : <Crop className="h-4 w-4" />}
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('quick-screenshot')}
                            disabled={isCapturing}
                            ariaLabel="Screenshot"
                            title="Screenshot"
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            <Camera className="h-4 w-4" />
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('area-screenshot')}
                            disabled={isCapturing}
                            ariaLabel="Draw shape to capture"
                            title="Circle to ask — draw shape to capture area"
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            <Circle className="h-4 w-4" />
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('rectangle-screenshot')}
                            disabled={isCapturing}
                            ariaLabel="Select to ask"
                            title="Select to ask — drag rectangle, then add to prompt or ask AI"
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            <Square className="h-4 w-4 shrink-0" />
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('auto-screenshot')}
                            isActive={autoScreenshotEnabled}
                            activeColor="blue"
                            ariaLabel={autoScreenshotEnabled ? "Disable auto-screenshot" : "Enable auto-screenshot"}
                            title={autoScreenshotEnabled ? "Auto-screenshot ON" : "Auto-screenshot OFF"}
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            <Timer className="h-4 w-4" />
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('set-area')}
                            isActive={setCaptureAreaEnabled}
                            activeColor="green"
                            ariaLabel={setCaptureAreaEnabled ? "Disable capture area" : "Set capture area"}
                            title={setCaptureAreaEnabled ? "Capture area ON (click to disable)" : "Set capture area"}
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            <Focus className="h-4 w-4" />
                        </ActionButton>

                        <ActionButton
                            onClick={() => handleActionClick('send-to-phone')}
                            disabled={isCapturing || isSendingToPhone}
                            ariaLabel="Send screenshot to phone"
                            title="Send screenshot to phone"
                            className={actionButtonClass}
                            isDarkTheme={isDarkTheme}
                        >
                            {isSendingToPhone ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Smartphone className="h-4 w-4" />
                            )}
                        </ActionButton>
                    </div>
                </div>
            )}
        </div>
    )
}
