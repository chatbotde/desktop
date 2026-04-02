"use client"

import { useState, useRef, useSyncExternalStore, useCallback } from "react"
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

// Import the placeholder video if possible or just use the path as string
// Since testd is in src, we might be able to import it if configured, but safe to use relative path or exact path if it's in public. 
// However, the user pointed to src/testd. importing non-code assets from src usually requires a loader. 
// For now, I'll accept 'videos' as string[] of URLs. The parent will pass the placeholder.

interface VideoGenerationProps {
    videos: string[]
    className?: string
    onVideoIndexChange?: (index: number) => void
    onClose: () => void
}

export function VideoGeneration({
    videos,
    className,
    onVideoIndexChange,
    onClose,
}: VideoGenerationProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [api, setApi] = useState<CarouselApi>()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(true)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

    // Listen to carousel changes - using syncExternalStore
    useSyncExternalStore(
        useCallback(() => {
            if (!api) return () => {}

            const onSelect = () => {
                const index = api.selectedScrollSnap()
                setCurrentIndex(index)
                onVideoIndexChange?.(index)

                // Pause all other videos, play current if it was playing
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
            // Call once to set initial index
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
            // For video, we probably just copy the URL if it's external, or try to copy blob if local?
            // Let's stick to copying URL for now as video blobs are large.
            await navigator.clipboard.writeText(videoUrl)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (error) {
            console.error("Failed to copy video URL:", error)
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
        <div
            className={cn("relative w-full h-full bg-black", className)}
        >
            <Carousel
                setApi={setApi}
                className="w-full h-full"
                opts={{ watchDrag: false }}
            >
                <CarouselContent className="h-full">
                    {videos.map((videoUrl, index) => {
                        return (
                            <CarouselItem key={index} className="h-full">
                                <div
                                    className="relative group h-full w-full overflow-hidden select-none flex items-center justify-center bg-black"
                                    onClick={() => togglePlay(index)}
                                >
                                    <video
                                        ref={el => { videoRefs.current[index] = el }}
                                        src={videoUrl}
                                        className="w-full h-full object-contain"
                                        loop
                                        muted={isMuted}
                                        autoPlay={index === 0}
                                        playsInline
                                        onError={(e) => {
                                            console.error("Video playback error", e)
                                            // Could set a state to show error UI
                                            e.currentTarget.style.display = 'none'
                                            e.currentTarget.parentElement?.querySelector('.error-message')?.classList.remove('hidden')
                                        }}
                                    />

                                    {/* Error Message */}
                                    <div className="error-message hidden absolute inset-0 flex items-center justify-center text-red-500 font-mono text-sm bg-black/80">
                                        Failed to load video
                                    </div>

                                    {/* Custom Controls Overlay - Visible on Hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        {!isPlaying && (
                                            <div className="rounded-full bg-black/40 p-4 border border-white/20 backdrop-blur-sm">
                                                <Play className="size-8 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Controls */}
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                                            onClick={() => togglePlay(index)}
                                        >
                                            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                                            onClick={() => toggleMute(index)}
                                        >
                                            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                                        </Button>
                                    </div>


                                    {/* Action buttons - appear on hover, top right corner */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCopy(videoUrl, index)
                                            }}
                                            title={copiedIndex === index ? "Copied Link!" : "Copy Video Link"}
                                        >
                                            {copiedIndex === index ? (
                                                <Check className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownload(videoUrl)
                                            }}
                                            title="Download video"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onClose()
                                            }}
                                            title="Close"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>

                {/* Navigation arrows and indicator - Overlaid */}
                {videos.length > 1 && (
                    <>
                        <CarouselPrevious
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm z-20"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <CarouselNext
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm z-20"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                            <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <span className="text-[10px] font-medium text-white tabular-nums block shadow-sm">
                                    {currentIndex + 1} / {videos.length}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </Carousel>
        </div>
    )
}
