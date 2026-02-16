import { VideoGeneration } from "./video-generation/video-generation"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"
import { ResizeHandle } from "@/features/output-window/components/ResizeHandle"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { GripVertical } from "lucide-react"
import { GLOBAL_THEME } from '@/global/theme'

interface VideoGenerationWindowProps {
    videos: string[]
    isVisible: boolean
    isLoading?: boolean
    onClose: () => void
    isDarkTheme?: boolean
}

interface CardDimensions {
    width: number
    height: number
}

// Default compact size for loading state
const DEFAULT_LOADING_SIZE: CardDimensions = { width: 300, height: 200 }
// Maximum constraints
const MAX_WIDTH = 500
const MAX_HEIGHT = 700
// Padding around video inside card
const CARD_PADDING = 0

// Fallback video for testing/failure
const FALLBACK_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

/**
 * Calculate constrained dimensions while preserving aspect ratio
 */
function calculateConstrainedSize(
    naturalWidth: number,
    naturalHeight: number,
    maxWidth: number = MAX_WIDTH,
    maxHeight: number = MAX_HEIGHT
): CardDimensions {
    if (naturalWidth === 0 || naturalHeight === 0) return DEFAULT_LOADING_SIZE
    const ratio = naturalWidth / naturalHeight

    let width = Math.min(naturalWidth, maxWidth)
    let height = width / ratio

    if (height > maxHeight) {
        height = maxHeight
        width = height * ratio
    }

    return {
        width: Math.round(width),
        height: Math.round(height),
    }
}

export function VideoGenerationWindow({
    videos,
    isVisible,
    isLoading = false,
    onClose,
    isDarkTheme = true,
}: VideoGenerationWindowProps) {
    const [cardSize, setCardSize] = useState<CardDimensions>(DEFAULT_LOADING_SIZE)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const videoDimensionsCache = useRef<Map<string, CardDimensions>>(new Map())
    const dragControls = useDragControls()

    // Resizing state
    const [isResizing, setIsResizing] = useState(false)
    const resizeRef = useRef({
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        direction: 'e' as ResizeDirection
    })

    // Use fallback if no videos provided (for testing)
    const displayVideos = (videos && videos.length > 0) ? videos : [FALLBACK_VIDEO]

    // Reset position and size when window becomes visible
    useEffect(() => {
        if (isVisible) {
            setCardSize(DEFAULT_LOADING_SIZE)
            setCurrentVideoIndex(0)
            videoDimensionsCache.current.clear()
        }
    }, [isVisible])

    // Load and cache video dimensions
    const loadVideoDimensions = useCallback((videoUrl: string): Promise<CardDimensions> => {
        // Check cache first
        const cached = videoDimensionsCache.current.get(videoUrl)
        if (cached) {
            return Promise.resolve(cached)
        }

        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.onloadedmetadata = () => {
                const dimensions = calculateConstrainedSize(video.videoWidth, video.videoHeight)
                videoDimensionsCache.current.set(videoUrl, dimensions)
                resolve(dimensions)
            }
            video.onerror = () => {
                // Fallback to default size on error
                resolve(DEFAULT_LOADING_SIZE)
            }
            video.src = videoUrl
        })
    }, [])

    // Update card size when videos change or current index changes
    useEffect(() => {
        if (!isLoading) {
            const currentVideo = displayVideos[currentVideoIndex]
            if (currentVideo) {
                loadVideoDimensions(currentVideo).then(setCardSize)
            }
        } else if (isLoading) {
            setCardSize(DEFAULT_LOADING_SIZE)
        }
    }, [displayVideos, currentVideoIndex, isLoading, loadVideoDimensions])

    // Handle video index change from carousel
    const handleVideoIndexChange = useCallback((index: number) => {
        setCurrentVideoIndex(index)
    }, [])

    // Resize Handlers
    const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: cardSize.width,
            startHeight: cardSize.height,
            direction
        }
    }, [cardSize])

    const handleGlobalMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                const deltaX = e.clientX - resizeRef.current.startX
                const deltaY = e.clientY - resizeRef.current.startY
                const { startWidth, startHeight, direction } = resizeRef.current

                let newWidth = startWidth
                let newHeight = startHeight

                if (direction.includes('e')) {
                    newWidth = Math.max(200, startWidth + deltaX)
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(200, startWidth - deltaX)
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(150, startHeight + deltaY)
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(150, startHeight - deltaY)
                }

                setCardSize({ width: newWidth, height: newHeight })
            }
        },
        [isResizing]
    )

    const handleGlobalMouseUp = useCallback(() => {
        setIsResizing(false)
    }, [])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleGlobalMouseMove)
            window.addEventListener("mouseup", handleGlobalMouseUp)
        }
        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isResizing, handleGlobalMouseMove, handleGlobalMouseUp])


    const themeClasses = {
        containerBg: isDarkTheme ? GLOBAL_THEME.colors.dark.background : GLOBAL_THEME.colors.light.background,
        border: isDarkTheme ? GLOBAL_THEME.colors.dark.border : GLOBAL_THEME.colors.light.border,
        text: isDarkTheme ? GLOBAL_THEME.colors.dark.text : GLOBAL_THEME.colors.light.text,
        textMuted: isDarkTheme ? GLOBAL_THEME.colors.dark.textMuted : GLOBAL_THEME.colors.light.textMuted,
        dragHandle: isDarkTheme ? `text-zinc-500 hover:text-zinc-300` : `text-zinc-400 hover:text-zinc-600`,
    }

    // Calculate total card dimensions (video size + padding)
    const totalCardWidth = cardSize.width + CARD_PADDING
    const totalCardHeight = cardSize.height + CARD_PADDING

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    drag
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed left-1/2 top-1/2 z-[1000]"
                    style={{ x: "-50%", y: "-50%" }}
                    data-no-clickthrough
                >
                    {isLoading && (!videos || videos.length === 0) ? (
                        // Initial load - show premium loading state
                        <div className={cn(
                            "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border shadow-2xl",
                            themeClasses.containerBg,
                            themeClasses.border
                        )}>
                            <div className="relative">
                                <div className="size-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                                <div className="absolute inset-0 size-12 rounded-full bg-purple-500/10 animate-pulse" />
                            </div>
                            <span className="text-xs font-medium text-purple-500 animate-pulse uppercase tracking-widest">
                                Animating...
                            </span>
                        </div>
                    ) : (
                        // Show full card with video when loaded
                        <Card
                            className={cn(
                                "relative overflow-hidden shadow-2xl p-0",
                                "ring-1 ring-black/5",
                                "transition-all duration-300 ease-out",
                                themeClasses.containerBg,
                                themeClasses.border
                            )}
                            style={{
                                width: `${totalCardWidth}px`,
                                height: `${totalCardHeight}px`,
                                minHeight: `${totalCardHeight}px`,
                            }}
                        >
                            {/* Drag Handle - Vertical dots */}
                            <button
                                onPointerDown={(e) => dragControls.start(e)}
                                className={cn(
                                    "absolute top-2 left-2 z-[60] p-1 rounded-md transition-colors cursor-grab active:cursor-grabbing",
                                    themeClasses.dragHandle
                                )}
                                aria-label="Drag window"
                            >
                                <GripVertical className="size-4" />
                            </button>

                            {/* Content area */}
                            <div className="absolute inset-0">
                                <VideoGeneration
                                    videos={displayVideos}
                                    onVideoIndexChange={handleVideoIndexChange}
                                    onClose={onClose}
                                />
                            </div>

                            {/* Resize Handles */}
                            {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
                                <ResizeHandle
                                    key={dir}
                                    direction={dir as ResizeDirection}
                                    onMouseDown={handleResizeMouseDown}
                                />
                            ))}

                            {/* Loading indicator - small dot in top-right when generating additional videos */}
                            {isLoading && (
                                <div className="absolute top-2 right-2 z-30 pointer-events-none">
                                    <div
                                        className="size-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg"
                                        title="Generating next video..."
                                    />
                                </div>
                            )}
                        </Card>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
