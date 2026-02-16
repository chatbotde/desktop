import { useRef } from "react"
import { ChevronLeft, ChevronRight, X, GripVertical } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { motion, useDragControls } from "framer-motion"
import { GLOBAL_THEME } from '@/global/theme'

const videos = [
    // ... (rest of videos)
    { id: 1, thumbnail: "1.png" },
    { id: 2, thumbnail: "2.png" },
    { id: 3, thumbnail: "3.png" },
    { id: 4, thumbnail: "4.png" },
    { id: 5, thumbnail: "5.png" },
    { id: 6, thumbnail: "6.png" },
    { id: 7, thumbnail: "7.png" },
    { id: 8, thumbnail: "8.png" },
    { id: 9, thumbnail: "9.png" },
    { id: 10, thumbnail: "10.png" },
]

interface VideoScrollProps {
    onClose?: () => void
}

export function VideoScroll({ onClose }: VideoScrollProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const dragControls = useDragControls()

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 340
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            })
        }
    }

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            className="fixed top-1/2 left-1/2"
            style={{ zIndex: GLOBAL_THEME.zIndex.content }}
        >
            <Card className="w-[90vw] max-w-5xl p-0 overflow-hidden bg-background shadow-2xl relative border-zinc-800">
                {/* Drag handle */}
                <button
                    onPointerDown={(e) => dragControls.start(e)}
                    className="absolute left-2 top-2 z-[60] p-1 rounded-md transition-colors cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300"
                    aria-label="Drag window"
                >
                    <GripVertical className="size-4" />
                </button>

                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-20 rounded-full hover:bg-muted bg-red-400"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>

                {/* Left Arrow */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg opacity-90 hover:opacity-100 bg-white"
                    onClick={() => scroll("left")}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Scrollable Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-0 px-0"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {videos.map((video) => (
                        <div key={video.id} className="flex-shrink-0 cursor-pointer group">
                            <div className="relative w-[280px] aspect-video rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={video.thumbnail || "/placeholder.svg"}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg opacity-90 hover:opacity-100 bg-white"
                    onClick={() => scroll("right")}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </Card>
        </motion.div>
    )
}
