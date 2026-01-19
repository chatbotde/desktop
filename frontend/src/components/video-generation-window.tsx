import { VideoGeneration } from "./video-generation/video-generation"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"
import { ResizeHandle } from "@/features/output-window/components/ResizeHandle"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"

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
// Use a reliable public video for testing to avoid local asset loading issues
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
    const [position, setPosition] = useState({ x: 0, y: 60 })
    const [isDragging, setIsDragging] = useState(false)
    const [cardSize, setCardSize] = useState<CardDimensions>(DEFAULT_LOADING_SIZE)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const dragOffset = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const videoDimensionsCache = useRef<Map<string, CardDimensions>>(new Map())

    // Resizing state
    const [isResizing, setIsResizing] = useState(false)
    const resizeRef = useRef({
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startPosX: 0,
        startPosY: 0,
        direction: 'e' as ResizeDirection
    })

    // Use fallback if no videos provided (for testing)
    // Here we use the user's placeholder if available in list or just fallback
    const displayVideos = (videos && videos.length > 0) ? videos : [FALLBACK_VIDEO]

    // Reset position and size when window becomes visible
    useEffect(() => {
        if (isVisible) {
            setPosition({ x: 0, y: 60 })
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

    // Drag handlers - now for entire card
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Don't initiate drag if clicking on a button or resize handle or video controls (if custom)
        // We allow dragging from anywhere that isn't interactive
        if ((e.target as HTMLElement).closest('button') || isResizing || (e.target as HTMLElement).tagName === 'INPUT') {
            return
        }
        e.preventDefault()
        setIsDragging(true)
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left - rect.width / 2,
                y: e.clientY - rect.top,
            }
        }
    }, [isResizing])

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
            startPosX: position.x,
            startPosY: position.y,
            direction
        }
    }, [cardSize, position])

    const handleGlobalMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                const deltaX = e.clientX - resizeRef.current.startX
                const deltaY = e.clientY - resizeRef.current.startY
                const { startWidth, startHeight, startPosX, startPosY, direction } = resizeRef.current

                let newWidth = startWidth
                let newHeight = startHeight
                let newX = startPosX
                let newY = startPosY

                // Calculations for centered resizing
                // Since the window is centered using translateX(-50%), 
                // adjusting width requires shifting X by delta/2 to effectively expand/contract only one side visually relative to handles.

                if (direction.includes('e')) {
                    newWidth = Math.max(200, startWidth + deltaX)
                    newX = startPosX + deltaX / 2
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(200, startWidth - deltaX)
                    newX = startPosX + deltaX / 2
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(150, startHeight + deltaY)
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(150, startHeight - deltaY)
                    newY = startPosY + deltaY
                }

                setCardSize({ width: newWidth, height: newHeight })
                setPosition({ x: newX, y: newY })

            } else if (isDragging) {
                const newX = e.clientX - window.innerWidth / 2 - dragOffset.current.x
                const newY = e.clientY - dragOffset.current.y
                setPosition({ x: newX, y: newY })
            }
        },
        [isDragging, isResizing]
    )

    const handleGlobalMouseUp = useCallback(() => {
        setIsDragging(false)
        setIsResizing(false)
    }, [])

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener("mousemove", handleGlobalMouseMove)
            window.addEventListener("mouseup", handleGlobalMouseUp)
        }
        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging, isResizing, handleGlobalMouseMove, handleGlobalMouseUp])

    if (!isVisible) {
        return null
    }

    const themeClasses = {
        containerBg: isDarkTheme
            ? "bg-zinc-900/98 backdrop-blur-xl"
            : "bg-white/98 backdrop-blur-xl",
        border: isDarkTheme ? "border-zinc-700/50" : "border-zinc-200/80",
        text: isDarkTheme ? "text-zinc-100" : "text-zinc-900",
        textMuted: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
    }

    // Calculate total card dimensions (video size + padding)
    const totalCardWidth = cardSize.width + CARD_PADDING
    const totalCardHeight = cardSize.height + CARD_PADDING

    return (
        <div
            ref={containerRef}
            className={cn(
                "fixed left-1/2 z-[100]",
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
                transform: `translateX(calc(-50% + ${position.x}px))`,
                top: `${position.y}px`,
            }}
            data-no-clickthrough
            onMouseDown={handleMouseDown}
        >
            {isLoading && (!videos || videos.length === 0) ? (
                // Initial load - just show pulsing dot
                <div className="flex items-center justify-center">
                    <div
                        className="size-8 rounded-full bg-blue-500 animate-pulse"
                        title="Generating video..."
                    />
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
                    {/* Content area */}
                    <div className="absolute inset-0">
                        <VideoGeneration
                            videos={displayVideos}
                            onVideoIndexChange={handleVideoIndexChange}
                            onClose={onClose}
                        />
                    </div>

                    {/* Resize Handles - Placed AFTER content to be on top in stacking order */}
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
        </div>
    )
}
