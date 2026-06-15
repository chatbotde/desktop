import { VideoGeneration } from "./video-generation/video-generation"
import { useTypingLoop } from "./video-generation/use-typing-loop"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"
import { useDraggable, useResizable } from "@/features/output-window/hooks"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, GripVertical, VideoIcon, X } from "lucide-react"
import { GLOBAL_THEME } from '@/global/theme'

interface VideoGenerationWindowProps {
    videos: string[]
    isVisible: boolean
    isLoading?: boolean
    error?: string | null
    onClose: () => void
    isDarkTheme?: boolean
}

interface Size {
    width: number
    height: number
}

const DEFAULT_SIZE: Size = { width: 320, height: 480 }
const DEFAULT_LOADING_SIZE: Size = { width: 220, height: 44 }
const MAX_FIT_WIDTH = 500
const MAX_FIT_HEIGHT = 700
const MIN_WIDTH = 200
const MIN_HEIGHT = 280

const RESIZE_DIRECTIONS: ResizeDirection[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"]
const PLAYER_Z = GLOBAL_THEME.zIndex.modal
const CONTROLS_Z = PLAYER_Z + 10

function defaultPosition(width: number) {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024
    const h = typeof window !== "undefined" ? window.innerHeight : 768
    return {
        x: Math.max(16, w - width - 24),
        y: Math.max(16, Math.round(h * 0.08)),
    }
}

function calculateConstrainedSize(naturalWidth: number, naturalHeight: number): Size {
    if (naturalWidth === 0 || naturalHeight === 0) return DEFAULT_SIZE
    const ratio = naturalWidth / naturalHeight

    let width = Math.min(naturalWidth, MAX_FIT_WIDTH)
    let height = width / ratio

    if (height > MAX_FIT_HEIGHT) {
        height = MAX_FIT_HEIGHT
        width = height * ratio
    }

    return {
        width: Math.max(MIN_WIDTH, Math.round(width)),
        height: Math.max(MIN_HEIGHT, Math.round(height)),
    }
}

function formatElapsedTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function VideoGenerationWindow({
    videos,
    isVisible,
    isLoading = false,
    error = null,
    onClose,
    isDarkTheme = true,
}: VideoGenerationWindowProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoDimensionsCache = useRef<Map<string, Size>>(new Map())
    const [size, setSize] = useState<Size>(DEFAULT_SIZE)
    const [position, setPosition] = useState(() => defaultPosition(DEFAULT_SIZE.width))
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const typingText = useTypingLoop()

    const displayVideos = videos ?? []
    const hasVideos = displayVideos.length > 0
    const currentVideo = displayVideos[currentVideoIndex]

    const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
    const { handleResizeMouseDown, isResizing } = useResizable(
        size,
        setSize,
        position,
        setPosition,
        { minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }
    )

    const loadVideoDimensions = useCallback((videoUrl: string): Promise<Size> => {
        const cached = videoDimensionsCache.current.get(videoUrl)
        if (cached) return Promise.resolve(cached)

        return new Promise((resolve) => {
            const video = document.createElement("video")
            video.onloadedmetadata = () => {
                const dimensions = calculateConstrainedSize(video.videoWidth, video.videoHeight)
                videoDimensionsCache.current.set(videoUrl, dimensions)
                resolve(dimensions)
            }
            video.onerror = () => resolve(DEFAULT_SIZE)
            video.src = videoUrl
        })
    }, [])

    useEffect(() => {
        if (isVisible) {
            setCurrentVideoIndex(0)
            setPosition(defaultPosition(hasVideos ? size.width : DEFAULT_LOADING_SIZE.width))
            if (!hasVideos) {
                setSize(DEFAULT_LOADING_SIZE)
            }
            videoDimensionsCache.current.clear()
        }
    }, [isVisible])

    useEffect(() => {
        if (!isLoading && currentVideo) {
            loadVideoDimensions(currentVideo).then(setSize)
        } else if (isLoading && !hasVideos) {
            setSize(DEFAULT_LOADING_SIZE)
        }
    }, [currentVideo, currentVideoIndex, isLoading, hasVideos, loadVideoDimensions])

    useEffect(() => {
        if (!isVisible || !isLoading || hasVideos) {
            setElapsedSeconds(0)
            return
        }
        const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
        return () => clearInterval(id)
    }, [isVisible, isLoading, hasVideos])

    const handleVideoIndexChange = useCallback((index: number) => {
        setCurrentVideoIndex(index)
    }, [])

    const themeClasses = {
        shell: isDarkTheme
            ? "border-zinc-800 bg-zinc-950"
            : "border-zinc-200 bg-white",
        pill: isDarkTheme
            ? "border-zinc-700/80 bg-zinc-950/95 text-zinc-100"
            : "border-zinc-200 bg-white/95 text-zinc-900",
        textMuted: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
        dragHandle: isDarkTheme ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600",
    }

    const shellClass = cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl",
        themeClasses.shell
    )

    const showGeneratingPill = isLoading && !hasVideos && !error
    const showVideo = hasVideos && !error
    const showContent = showGeneratingPill || showVideo || error

    return (
        <div
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: PLAYER_Z }}
            aria-hidden={!isVisible}
        >
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="pointer-events-auto flex flex-col"
                        style={{
                            position: "fixed",
                            zIndex: PLAYER_Z,
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            width: showGeneratingPill ? "auto" : `${size.width}px`,
                            height: showGeneratingPill ? "auto" : `${size.height}px`,
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        data-no-clickthrough
                    >
                        {showGeneratingPill ? (
                            <div className="flex flex-col items-end gap-1">
                                {/* Drag bar above pill — visible on hover */}
                                <div
                                    className={cn(
                                        "flex h-7 w-full min-w-[220px] items-center justify-between rounded-full border px-2 transition-opacity duration-200",
                                        themeClasses.pill,
                                        isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    <div
                                        className="flex cursor-grab items-center gap-1 active:cursor-grabbing"
                                        onMouseDown={handleDragMouseDown}
                                        style={{ touchAction: "none" }}
                                    >
                                        <GripVertical className={cn("size-3.5", themeClasses.dragHandle)} />
                                        <span className={cn("text-[10px]", themeClasses.textMuted)}>Drag</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 transition-colors hover:bg-red-500/80 hover:text-white"
                                        onClick={onClose}
                                        aria-label="Close"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>

                                {/* Generating pill */}
                                <div
                                    className={cn(
                                        "flex min-w-[220px] items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-xl backdrop-blur-md",
                                        themeClasses.pill
                                    )}
                                >
                                    <span className="relative flex size-2 shrink-0">
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-purple-400 opacity-60" />
                                        <span className="relative inline-flex size-2 rounded-full bg-purple-500" />
                                    </span>
                                    <span className="min-w-[120px] text-xs font-medium">
                                        {typingText}
                                        <span className="ml-0.5 animate-pulse text-purple-400">|</span>
                                    </span>
                                    <span className={cn("ml-auto text-[10px] font-medium tabular-nums", themeClasses.textMuted)}>
                                        {formatElapsedTime(elapsedSeconds)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className={shellClass} style={{ width: size.width, height: size.height }}>
                                {RESIZE_DIRECTIONS.map((direction) => (
                                    <div
                                        key={direction}
                                        className={cn(
                                            "absolute z-20 bg-transparent",
                                            direction === "n" && "top-8 left-0 right-0 h-2 cursor-ns-resize",
                                            direction === "s" && "bottom-0 left-0 right-0 h-2 cursor-ns-resize",
                                            direction === "e" && "top-8 right-0 bottom-0 w-2 cursor-ew-resize",
                                            direction === "w" && "top-8 left-0 bottom-0 w-2 cursor-ew-resize",
                                            direction === "ne" && "top-8 right-28 h-3 w-3 cursor-nesw-resize",
                                            direction === "nw" && "top-8 left-0 h-3 w-3 cursor-nwse-resize",
                                            direction === "se" && "bottom-0 right-0 h-4 w-4 cursor-nwse-resize",
                                            direction === "sw" && "bottom-0 left-0 h-4 w-4 cursor-nesw-resize"
                                        )}
                                        onMouseDown={(e) => handleResizeMouseDown(e, direction)}
                                    />
                                ))}

                                {(isDragging || isResizing) && (
                                    <div className="absolute inset-0 z-30 cursor-grabbing bg-transparent" />
                                )}

                                {showContent && (
                                    <div
                                        className={cn(
                                            "pointer-events-none absolute top-0 left-0 right-0 flex h-8 items-center justify-between gap-1 px-1.5 transition-opacity duration-200",
                                            isHovered ? "opacity-100" : "opacity-0"
                                        )}
                                        style={{ zIndex: CONTROLS_Z - 1 }}
                                    >
                                        <div
                                            className={cn(
                                                "pointer-events-auto flex w-fit cursor-grab items-center gap-1.5 rounded-md px-1 active:cursor-grabbing",
                                                isHovered && "bg-gradient-to-b from-black/60 to-transparent"
                                            )}
                                            onMouseDown={handleDragMouseDown}
                                            style={{ touchAction: "none" }}
                                        >
                                            <GripVertical className={cn("size-3.5 shrink-0", themeClasses.dragHandle)} />
                                            <VideoIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300/80" />
                                        </div>

                                        {error && (
                                            <button
                                                type="button"
                                                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-red-500/90"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={onClose}
                                                aria-label="Close"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {error ? (
                                    <div className="flex flex-1 flex-col gap-3 p-4 pt-10">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span className="text-xs font-semibold uppercase tracking-widest">Video failed</span>
                                        </div>
                                        <p className={cn("text-xs leading-5", themeClasses.textMuted)}>{error}</p>
                                    </div>
                                ) : showVideo ? (
                                    <div className="relative min-h-0 flex-1 overflow-hidden pt-0">
                                        <VideoGeneration
                                            videos={displayVideos}
                                            onVideoIndexChange={handleVideoIndexChange}
                                            onClose={onClose}
                                            isHovered={isHovered}
                                        />
                                        {isLoading && (
                                            <div className="pointer-events-none absolute top-10 right-2 z-30">
                                                <div className="size-2 animate-pulse rounded-full bg-purple-400" title="Generating..." />
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
