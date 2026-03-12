import { GripVertical } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface AudioRecorderDragHandleProps {
    onDragMouseDown: (e: React.MouseEvent) => void
    isDarkTheme?: boolean
}

export function AudioRecorderDragHandle({
    onDragMouseDown,
    isDarkTheme = true
}: AudioRecorderDragHandleProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "p-1.5 rounded-full border shadow-lg transition-colors flex items-center justify-center",
                        themeClasses.containerBorder,
                        hoverClass
                    )}
                    style={{
                        backgroundColor: themeClasses.containerBg,
                    }}
                    onMouseDown={onDragMouseDown}
                >
                    <GripVertical className={cn("size-3.5", themeClasses.icon)} />
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className={cn(
                    isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                )}
            >
                Drag to move
            </TooltipContent>
        </Tooltip>
    )
}

