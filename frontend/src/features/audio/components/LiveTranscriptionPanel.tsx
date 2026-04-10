import { useState, useSyncExternalStore, useRef, useCallback } from "react"
import { X, Pause, Play, Copy, Check } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import { useDraggable } from '@/features/output-window/hooks/useDraggable'
import { useResizable } from '@/features/output-window/hooks/useResizable'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface LiveTranscriptionPanelProps {
    showTranscription: boolean
    isRecording: boolean
    isPaused?: boolean
    transcriptionText: string
    partialText: string
    isTranscribing: boolean
    onClose: () => void
    onClear: () => void
    onPauseResume?: () => void
    onAddTranscription: () => void
    transcriptionContainerRef: React.RefObject<HTMLDivElement | null>
    isDarkTheme?: boolean
    onTextChange?: (text: string) => void
}

export function LiveTranscriptionPanel({
    showTranscription,
    isRecording,
    isPaused = false,
    transcriptionText,
    partialText,
    isTranscribing,
    onClose,
    onClear,
    onPauseResume,
    onAddTranscription,
    transcriptionContainerRef,
    isDarkTheme = true,
    onTextChange
}: LiveTranscriptionPanelProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    // State for window position and size
    const [position, setPosition] = useState({
        x: window.innerWidth / 2 - 300,
        y: window.innerHeight - 450
    })
    // Default height roughly matches 3 lines of text
    const [size, setSize] = useState({ width: 600, height: 60 })
    const [isCopied, setIsCopied] = useState(false)

    const { handleDragMouseDown, isDragging } = useDraggable(setPosition, transcriptionContainerRef)
    const { handleResizeMouseDown } = useResizable(size, setSize, position, setPosition)

    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll when text changes - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
            return () => {}
        }, [transcriptionText, partialText]),
        () => null,
        () => null
    )

    // Reset position if window resizes significantly or on first mount - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (position.y > window.innerHeight - 100) {
                setPosition(p => ({ ...p, y: window.innerHeight - 450 }))
            }
            return () => {}
        }, []),
        () => null,
        () => null
    )

    const handleCopy = () => {
        const textToCopy = `${transcriptionText} ${partialText} `.trim()
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        }
    }

    if (!showTranscription) {
        return null
    }

    return (
        <div
            ref={transcriptionContainerRef}
            className={cn(
                "fixed z-[50] flex flex-col group",
                isDragging && "cursor-grabbing"
            )}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                // Height is auto to allow footer expansion
                // Max constraints
                maxWidth: '95vw',
                maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* External Close Badge */}
            <div className="absolute -top-3 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onClose}
                            className={cn(
                                "p-1.5 rounded-full shadow-md border transition-colors",
                                isDarkTheme ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            <X className="size-3" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Close</TooltipContent>
                </Tooltip>
            </div>

            {/* Main Content Box */}
            <div className={cn(
                "relative flex flex-col shadow-2xl rounded-lg backdrop-blur-sm overflow-hidden",
                themeClasses.containerBorder,
            )}
                style={{
                    backgroundColor: themeClasses.containerBg,
                }}>

                {/* Resize Handles */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    {/* Sides */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'n')} className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto hover:bg-blue-500/20" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 's')} className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto hover:bg-blue-500/20" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'w')} className="absolute top-2 bottom-2 left-0 w-1 cursor-ew-resize pointer-events-auto hover:bg-blue-500/20" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'e')} className="absolute top-2 bottom-2 right-0 w-1 cursor-ew-resize pointer-events-auto hover:bg-blue-500/20" />

                    {/* Corners */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize pointer-events-auto hover:bg-blue-500/20 rounded-tl-lg" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize pointer-events-auto hover:bg-blue-500/20 rounded-tr-lg" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize pointer-events-auto hover:bg-blue-500/20 rounded-bl-lg" />
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize pointer-events-auto hover:bg-blue-500/20 rounded-br-lg" />
                </div>

                <div className={cn(
                    "flex-1 flex flex-col",
                    "bg-opacity-0"
                )}>
                    {/* Header - Extended Drag Area */}
                    <div
                        className="p-3 pb-2 cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={handleDragMouseDown}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Status */}
                                <div title={isPaused ? "Paused" : isTranscribing ? "Connected" : isRecording ? "Starting..." : "Not started"}>
                                    {isPaused ? (
                                        <div className="size-2 rounded-full bg-yellow-500" />
                                    ) : isTranscribing ? (
                                        <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                                    ) : isRecording ? (
                                        <div className="size-2 rounded-full bg-yellow-500 animate-pulse" />
                                    ) : (
                                        <div className="size-2 rounded-full bg-zinc-500" />
                                    )}
                                </div>
                                <div className={cn("text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity", themeClasses.input)}>
                                    Live Transcription
                                </div>
                            </div>

                            {/* Audio Controls (Pause/Resume) */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onMouseDown={(e) => e.stopPropagation()}>
                                {onPauseResume && isRecording && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={onPauseResume}
                                                className={cn(
                                                    "p-1 rounded transition-colors",
                                                    hoverClass
                                                )}
                                            >
                                                {isPaused ? (
                                                    <Play className={cn("size-3", themeClasses.icon)} />
                                                ) : (
                                                    <Pause className={cn("size-3", themeClasses.icon)} />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            {isPaused ? "Resume" : "Pause"}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content & Footer Wrapper */}
                    <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
                        {/* Content Area - Flex Column */}
                        <div
                            ref={scrollRef}
                            className={cn(
                                "flex flex-col w-full overflow-y-auto",
                                "scrollbar-thin",
                                isDarkTheme
                                    ? "scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
                                    : "scrollbar-thumb-zinc-400 scrollbar-track-zinc-200",
                            )}
                            style={{
                                height: size.height,
                                minHeight: '2rem'
                            }}
                        >
                            <textarea
                                value={transcriptionText}
                                onChange={(e) => onTextChange?.(e.target.value)}
                                placeholder={isTranscribing ? "" : "Transcription will appear here..."}
                                className={cn(
                                    "w-full resize-none bg-transparent border-none p-0 focus:ring-0 leading-relaxed text-sm outline-none px-0.5",
                                    themeClasses.input,
                                    "placeholder:text-zinc-500/50"
                                )}
                                style={{
                                    minHeight: '1.5em'
                                }}
                            />

                            {partialText && partialText.trim() && (
                                <div className={cn(
                                    "leading-relaxed text-sm px-0.5",
                                    transcriptionText ? "text-zinc-400 italic" : themeClasses.input
                                )}>
                                    {partialText}
                                    <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
                                </div>
                            )}

                            {!transcriptionText && !partialText && isTranscribing && (
                                <div className={cn("text-xs text-center py-2 opacity-50", themeClasses.icon)}>
                                    Listening...
                                </div>
                            )}
                        </div>

                        {/* Footer Controls - Expand Down on Hover */}
                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                            <div className="overflow-hidden">
                                <div className={cn("pt-2 mt-2 border-t flex items-center justify-end gap-2", isDarkTheme ? "border-zinc-800" : "border-zinc-200")}>
                                    <button
                                        onClick={onClear}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded transition-colors opacity-70 hover:opacity-100",
                                            hoverClass
                                        )}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded transition-colors opacity-70 hover:opacity-100 flex items-center gap-1",
                                            hoverClass,
                                            isCopied && "text-green-500 hover:text-green-600"
                                        )}
                                    >
                                        {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                        {isCopied ? "Copied!" : "Copy"}
                                    </button>
                                    <button
                                        onClick={onAddTranscription}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded transition-colors",
                                            isDarkTheme ? "bg-blue-600/80 hover:bg-blue-600 text-white" : "bg-blue-500/80 hover:bg-blue-500 text-white"
                                        )}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
