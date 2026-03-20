import { Mic2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceManager } from "@/features/voice"
import { useFeature } from "@/shared/providers"
import { Switch } from "@/shared/components/ui/switch"

interface VoiceSectionProps {
    isDarkTheme?: boolean
}

export function VoiceSection({ isDarkTheme = true }: VoiceSectionProps) {
    const { isFeatureEnabled, toggleFeature } = useFeature()

    return (
        <div className="space-y-6">
            <div>
                <div className={cn(
                    "flex items-center gap-2 text-sm font-medium mb-1",
                    isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                )}>
                    <Mic2 className="h-4 w-4" />
                    Text-to-Speech Personality
                </div>
                <p className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-500")}>
                    Customize how the assistant sounds
                </p>
            </div>

            <div className={cn(
                "p-4 rounded-xl border",
                isDarkTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-slate-200"
            )}>
                <VoiceManager isDarkTheme={isDarkTheme} />
            </div>

            <div className={cn(
                "p-4 rounded-xl border",
                isDarkTheme ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
            )}>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-200" : "text-zinc-900")}>
                            Auto Mode (Hide Text Card)
                        </div>
                        <div className={cn("text-[10px]", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
                            Automatically insert text and hide the results UI for a cleaner experience
                        </div>
                    </div>
                    <Switch
                        checked={isFeatureEnabled('transcription')}
                        onCheckedChange={() => toggleFeature('transcription')}
                    />
                </div>
            </div>

            <div className={cn(
                "p-3 rounded-lg flex gap-3",
                isDarkTheme ? "bg-blue-500/5 border border-blue-500/10" : "bg-blue-50 border border-blue-200"
            )}>
                <Info className={cn("h-4 w-4 shrink-0 mt-0.5", isDarkTheme ? "text-blue-400" : "text-blue-600")} />
                <div className="space-y-1">
                    <p className={cn("text-xs font-medium", isDarkTheme ? "text-blue-300" : "text-blue-700")}>
                        Local Processing
                    </p>
                    <p className={cn("text-[10px]", isDarkTheme ? "text-zinc-500" : "text-zinc-600")}>
                        All transcription and voice processing happens on your device.
                    </p>
                </div>
            </div>
        </div>
    )
}
