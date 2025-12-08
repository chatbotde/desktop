import { useState, useRef, useEffect } from 'react'
import { Mic, Monitor, Layers, Square, Circle, X, GripVertical, AudioWaveform, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDraggable } from './output-window/hooks'

interface AudioRecorderPillProps {
    onClose: () => void
    isDarkTheme?: boolean
}

export function AudioRecorderPill({ onClose, isDarkTheme = true }: AudioRecorderPillProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [source, setSource] = useState<'mic' | 'system' | 'both'>('mic')

    // Initial position bottom-rightish
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 300 })
    const cardRef = useRef<HTMLDivElement>(null)
    const { handleDragMouseDown } = useDraggable(setPosition, cardRef)

    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    const handleToggleRecord = () => {
        setIsRecording(!isRecording)
    }

    // Adjust initial position on mount to be safe
    useEffect(() => {
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 350 })
    }, [])

    if (isCollapsed) {
        return (
            <div
                ref={cardRef}
                className={cn(
                    "relative flex items-center justify-center p-4 rounded-full border shadow-lg fixed z-50 cursor-move transition-all duration-300",
                    themeClasses.containerBorder
                )}
                style={{
                    backgroundColor: themeClasses.containerBg,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
                onMouseDown={handleDragMouseDown}
                onDoubleClick={() => setIsCollapsed(false)}
            >
                {/* Wave animation effect */}
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />

                <div className="relative z-10 animate-pulse">
                    <AudioWaveform className="size-6 text-blue-500" />
                </div>
            </div>
        )
    }

    return (
        <div
            ref={cardRef}
            className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-full border shadow-lg fixed z-50 transition-all duration-300",
                themeClasses.containerBorder
            )}
            style={{
                backgroundColor: themeClasses.containerBg,
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div
                className={cn("cursor-move p-1 rounded-full", hoverClass)}
                onMouseDown={handleDragMouseDown}
            >
                <GripVertical className={cn("size-4", themeClasses.icon)} />
            </div>

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setSource('mic')}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'mic' ? (isDarkTheme ? "bg-zinc-800" : "bg-zinc-100") : hoverClass
                        )}
                    >
                        <Mic className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Microphone</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setSource('system')}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'system' ? (isDarkTheme ? "bg-zinc-800" : "bg-zinc-100") : hoverClass
                        )}
                    >
                        <Monitor className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">System Audio</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setSource('both')}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            source === 'both' ? (isDarkTheme ? "bg-zinc-800" : "bg-zinc-100") : hoverClass
                        )}
                    >
                        <Layers className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Both</TooltipContent>
            </Tooltip>

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleToggleRecord}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        {isRecording ? (
                            <Square className="size-4 text-red-500 fill-current" />
                        ) : (
                            <Circle className="size-4 text-red-500" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">{isRecording ? "Stop Recording" : "Start Recording"}</TooltipContent>
            </Tooltip>

            <div className={cn("w-4 h-px my-0", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")} />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <Minus className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Minimize</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <X className={cn("size-4", themeClasses.icon)} />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">Close</TooltipContent>
            </Tooltip>
        </div>
    )
}
