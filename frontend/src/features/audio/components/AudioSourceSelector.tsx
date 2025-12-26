import { Mic, Monitor, Layers } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface AudioSourceSelectorProps {
    source: 'mic' | 'system' | 'both'
    onSourceClick: (source: 'mic' | 'system' | 'both') => void
    isDarkTheme?: boolean
}

export function AudioSourceSelector({
    source,
    onSourceClick,
    isDarkTheme = true
}: AudioSourceSelectorProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => onSourceClick('mic')}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            source === 'mic'
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass
                        )}
                    >
                        <Mic className={cn(
                            "size-3.5",
                            source === 'mic' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Start Recording with Microphone
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => onSourceClick('system')}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            source === 'system'
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass
                        )}
                    >
                        <Monitor className={cn(
                            "size-3.5",
                            source === 'system' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Start Recording with System Audio
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => onSourceClick('both')}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            source === 'both'
                                ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                                : hoverClass
                        )}
                    >
                        <Layers className={cn(
                            "size-3.5",
                            source === 'both' ? "text-blue-500" : themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Start Recording with Both (Mic + System)
                </TooltipContent>
            </Tooltip>
        </>
    )
}

