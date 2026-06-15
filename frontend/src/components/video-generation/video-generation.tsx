"use client"

import { useState, useRef, useSyncExternalStore, useCallback, useEffect } from "react"
import { Copy, Download, Check, X, Play, Pause, Volume2, VolumeX } from "lucide-react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/shared/components/ui/carousel"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { GLOBAL_THEME } from "@/global/theme"

const CONTROLS_Z = GLOBAL_THEME.zIndex.modal + 10

interface VideoGenerationProps {
    videos: string[]
    className?: string
    onVideoIndexChange?: (index: number) => void
    onClose: () => void
    isHovered?: boolean
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
    const total = Math.floor(seconds)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

async function fetchVideoBlob(videoUrl: string): Promise<Blob> {
    const response = await fetch(videoUrl)
    if (!response.ok) {
        throw new Error(`Failed to fetch video (${response.status})`)
    }
    const blob = await response.blob()
    if (blob.size === 0) {
        throw new Error("Video file is empty")
    }
    return blob.type ? blob : new Blob([blob], { type: "video/mp4" })
}

export async function copyVideoToClipboard(videoUrl: string): Promise<void> {
    const blob = await fetchVideoBlob(videoUrl)
    const mimeType = blob.type || "video/mp4"

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ [mimeType]: blob }),
            ])
            return
        } catch (err) {
            console.warn("[VideoGeneration] ClipboardItem copy failed, trying native buffer:", err)
        }
    }

    const writeBuffer = window.electronAPI?.clipboard?.writeBuffer
    if (typeof writeBuffer === "function") {
        const bytes = new Uint8Array(await blob.arrayBuffer())
        await writeBuffer(mimeType, bytes)
        return
    }

    throw new Error("Video clipboard is not supported in this environment")
}

export function VideoGeneration({
    videos,
    className,
    onVideoIndexChange,
    onClose,
    isHovered = false,
}: VideoGenerationProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [api, setApi] = useState<CarouselApi>()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(true)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const progressRef = useRef<HTMLDivElement>(null)

    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
    const showControls = isHovered

    useEffect(() => {
        setCurrentTime(0)
        setDuration(0)
        const video = videoRefs.current[currentIndex]
        if (video && Number.isFinite(video.duration)) {
            setDuration(video.duration)
            setCurrentTime(video.currentTime)
            setIsPlaying(!video.paused)
            setIsMuted(video.muted)
        }
    }, [currentIndex, videos])

    const handleTimeUpdate = useCallback((index: number) => {
        const video = videoRefs.current[index]
        if (!video || index !== currentIndex) return
        setCurrentTime(video.currentTime)
        if (Number.isFinite(video.duration)) {
            setDuration(video.duration)
        }
    }, [currentIndex])

    const handleLoadedMetadata = useCallback((index: number) => {
        const video = videoRefs.current[index]
        if (!video || index !== currentIndex) return
        if (Number.isFinite(video.duration)) {
            setDuration(video.duration)
        }
        setCurrentTime(video.currentTime)
    }, [currentIndex])

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
        e.stopPropagation()
        const video = videoRefs.current[index]
        const bar = progressRef.current
        if (!video || !bar || !Number.isFinite(video.duration)) return

        const rect = bar.getBoundingClientRect()
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
        video.currentTime = ratio * video.duration
        setCurrentTime(video.currentTime)
    }, [])

    useSyncExternalStore(
        useCallback(() => {
            if (!api) return () => {}

            const onSelect = () => {
                const index = api.selectedScrollSnap()
                setCurrentIndex(index)
                onVideoIndexChange?.(index)

                videoRefs.current.forEach((ref, i) => {
                    if (ref) {
                        if (i === index) {
                            if (isPlaying) ref.play().catch(() => { })
                        } else {
                            ref.pause()
                            ref.currentTime = 0
                        }
                    }
                })
            }

            api.on("select", onSelect)
            onSelect()

            return () => {
                api.off("select", onSelect)
            }
        }, [api, onVideoIndexChange, isPlaying]),
        () => null,
        () => null
    )

    const togglePlay = (index: number) => {
        const video = videoRefs.current[index]
        if (video) {
            if (video.paused) {
                video.play()
                setIsPlaying(true)
            } else {
                video.pause()
                setIsPlaying(false)
            }
        }
    }

    const toggleMute = (index: number) => {
        const video = videoRefs.current[index]
        if (video) {
            video.muted = !video.muted
            setIsMuted(video.muted)
        }
    }

    const handleCopy = async (videoUrl: string, index: number) => {
        try {
            await copyVideoToClipboard(videoUrl)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (error) {
            console.error("Failed to copy video:", error)
        }
    }

    const handleDownload = async (videoUrl: string) => {
        try {
            const response = await fetch(videoUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `video-${Date.now()}.mp4`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Failed to download video:", error)
        }
    }

    if (!videos || videos.length === 0) {
        return null
    }

    return (
        <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
            <Carousel setApi={setApi} className="h-full w-full" opts={{ watchDrag: false }}>
                <CarouselContent className="h-full">
                    {videos.map((videoUrl, index) => (
                        <CarouselItem key={index} className="h-full">
                            <div
                                className="group relative h-full w-full overflow-hidden select-none bg-black"
                                onClick={() => togglePlay(index)}
                            >
                                <video
                                    ref={(el) => { videoRefs.current[index] = el }}
                                    src={videoUrl}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loop
                                    muted={isMuted}
                                    autoPlay={index === 0}
                                    playsInline
                                    onTimeUpdate={() => handleTimeUpdate(index)}
                                    onLoadedMetadata={() => handleLoadedMetadata(index)}
                                    onPlay={() => index === currentIndex && setIsPlaying(true)}
                                    onPause={() => index === currentIndex && setIsPlaying(false)}
                                    onError={(e) => {
                                        console.error("Video playback error", e)
                                        e.currentTarget.style.display = "none"
                                        e.currentTarget.parentElement?.querySelector(".error-message")?.classList.remove("hidden")
                                    }}
                                />

                                <div className="error-message hidden absolute inset-0 flex items-center justify-center bg-black/80 font-mono text-sm text-red-500">
                                    Failed to load video
                                </div>

                                {/* Center play icon on hover when paused */}
                                <div
                                    className={cn(
                                        "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                                        showControls && !isPlaying ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    <div className="rounded-full border border-white/20 bg-black/40 p-4 backdrop-blur-sm">
                                        <Play className="size-8 fill-white text-white" />
                                    </div>
                                </div>

                                {/* Top-right action buttons on hover */}
                                {index === currentIndex && (
                                    <div
                                        className={cn(
                                            "absolute right-2 top-2 flex items-center gap-1.5 transition-opacity duration-200",
                                            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                                        )}
                                        style={{ zIndex: CONTROLS_Z }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {videos.length > 1 && (
                                            <span className="pointer-events-none rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white/70 backdrop-blur-sm">
                                                {currentIndex + 1} / {videos.length}
                                            </span>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors",
                                                copiedIndex === index
                                                    ? "bg-green-500/25 hover:bg-green-500/35"
                                                    : "hover:border-blue-400/60 hover:bg-blue-500"
                                            )}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                void handleCopy(videoUrl, index)
                                            }}
                                            title={copiedIndex === index ? "Video copied!" : "Copy video"}
                                        >
                                            {copiedIndex === index ? (
                                                <Check className="size-3.5 text-green-400" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                void handleDownload(videoUrl)
                                            }}
                                            title="Download"
                                        >
                                            <Download className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm hover:bg-red-500/80"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onClose()
                                            }}
                                            title="Close"
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    </div>
                                )}

                                {/* Bottom: progress bar + playback controls (right) */}
                                {index === currentIndex && (
                                    <div
                                        className={cn(
                                            "absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 transition-opacity duration-200",
                                            "bg-gradient-to-t from-black/85 via-black/50 to-transparent",
                                            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                                        )}
                                        style={{ zIndex: CONTROLS_Z }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            ref={progressRef}
                                            className="group/progress mb-2.5 h-1.5 w-full cursor-pointer rounded-full bg-white/20"
                                            onClick={(e) => handleSeek(e, index)}
                                            role="slider"
                                            aria-label="Video progress"
                                            aria-valuemin={0}
                                            aria-valuemax={duration}
                                            aria-valuenow={currentTime}
                                        >
                                            <div
                                                className="relative h-full rounded-full bg-purple-500 transition-[width] duration-75 ease-linear"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover/progress:opacity-100" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-7 w-7 rounded-full border-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    togglePlay(index)
                                                }}
                                                title={isPlaying ? "Pause" : "Play"}
                                            >
                                                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-7 w-7 rounded-full border-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleMute(index)
                                                }}
                                                title={isMuted ? "Unmute" : "Mute"}
                                            >
                                                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                                            </Button>
                                            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium tabular-nums text-white/90 backdrop-blur-sm">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {videos.length > 1 && (
                    <>
                        <CarouselPrevious
                            className={cn(
                                "absolute left-2 top-1/2 z-30 h-8 w-8 -translate-y-1/2 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-opacity duration-200",
                                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <CarouselNext
                            className={cn(
                                "absolute right-2 top-1/2 z-30 h-8 w-8 -translate-y-1/2 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-opacity duration-200",
                                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </>
                )}
            </Carousel>
        </div>
    )
}
