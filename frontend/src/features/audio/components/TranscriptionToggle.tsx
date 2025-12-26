import { BookText } from "lucide-react"
import { cn } from "@/shared/lib"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import { isAssemblyAIConfigured } from '@/lib/audio'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface TranscriptionToggleProps {
    showTranscription: boolean
    onToggle: () => void
    isRecording: boolean
    isDarkTheme?: boolean
}

export function TranscriptionToggle({
    showTranscription,
    onToggle,
    isRecording,
    isDarkTheme = true
}: TranscriptionToggleProps) {
    const themeClasses = getThemeClasses(isDarkTheme)
    const hoverClass = getHoverClass(isDarkTheme)

    if (isRecording || !isAssemblyAIConfigured()) {
        return null
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onToggle}
                    className={cn(
                        "p-1.5 rounded-full transition-colors",
                        showTranscription
                            ? (isDarkTheme ? "bg-blue-600/30 border-2 border-blue-500" : "bg-blue-100 border-2 border-blue-500")
                            : hoverClass
                    )}
                >
                    <BookText className={cn(
                        "size-3.5",
                        showTranscription ? "text-blue-500" : themeClasses.icon
                    )} />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className={cn(
                    isDarkTheme ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-300"
                )}
            >
                {showTranscription ? '✓ Real-time Transcription' : 'Enable Real-time Transcription'}
            </TooltipContent>
        </Tooltip>
    )
}

