import { Video, Settings2 } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface VideoSourceSelectorProps {
    onStartClick: () => void
    onSettingsClick: () => void
    isDarkTheme?: boolean
}

export function VideoSourceSelector({
    onStartClick,
    onSettingsClick,
    isDarkTheme = true
}: VideoSourceSelectorProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onStartClick}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500"
                        )}
                    >
                        <Video className={cn(
                            "size-3.5",
                            "text-blue-500"
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Start Recording
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onSettingsClick}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            hoverClass
                        )}
                    >
                        <Settings2 className={cn(
                            "size-3.5",
                            themeClasses.icon
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    className={cn(
                        isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                    )}
                >
                    Settings
                </TooltipContent>
            </Tooltip>
        </>
    )
}

