import { X } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface VideoRecorderCloseButtonProps {
    onClose: () => void
    isDarkTheme?: boolean
}

export function VideoRecorderCloseButton({
    onClose,
    isDarkTheme = true
}: VideoRecorderCloseButtonProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClose}
                    className={cn(
                        "p-1.5 rounded-full transition-colors",
                        hoverClass
                    )}
                >
                    <X className={cn("size-3.5", themeClasses.icon)} />
                </button>
            </TooltipTrigger>
            <TooltipContent 
                side="top"
                className={cn(
                    isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                )}
            >
                Close
            </TooltipContent>
        </Tooltip>
    )
}

