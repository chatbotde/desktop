import { Pause, Play, Square } from "lucide-react"
import { cn } from "@/shared/lib"
import { getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface AudioRecorderControlsProps {
    isPaused: boolean
    recordingDuration: number
    onPauseResume: () => void
    onStop: () => void
    formatDuration: (seconds: number) => string
    isDarkTheme?: boolean
}

export function AudioRecorderControls({
    isPaused,
    recordingDuration,
    onPauseResume,
    onStop,
    formatDuration,
    isDarkTheme = true
}: AudioRecorderControlsProps) {
    const hoverClass = getHoverClass(isDarkTheme)

    return (
        <>
            <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                isPaused 
                    ? (isDarkTheme ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                    : (isDarkTheme ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700")
            )}>
                {formatDuration(recordingDuration)}
            </div>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onPauseResume}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        {isPaused ? (
                            <Play className="size-3.5 text-yellow-500 fill-current" />
                        ) : (
                            <Pause className="size-3.5 text-yellow-500 fill-current" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    {isPaused ? 'Resume Recording' : 'Pause Recording'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onStop}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <Square className="size-3.5 text-red-500 fill-current" />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Stop Recording
                </TooltipContent>
            </Tooltip>
        </>
    )
}

