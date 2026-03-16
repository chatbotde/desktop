import * as React from "react"
import { Trash2, Check } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { VoiceRecorder } from "./VoiceRecorder"
import { useVoiceContext } from "../VoiceProvider"

interface VoiceManagerProps {
    isDarkTheme?: boolean
}

export function VoiceManager({ isDarkTheme = true }: VoiceManagerProps) {
    const {
        clonedVoices,
        activeVoiceId,
        addVoice,
        removeVoice,
        selectVoice,
        presetVoices
    } = useVoiceContext()
    const [showRecorder, setShowRecorder] = React.useState(false)

    const handleVoiceAdded = async (blob: Blob, name: string) => {
        if (!name.trim()) return
        try {
            const success = await addVoice(blob, name.trim())
            if (success) {
                setShowRecorder(false)
            }
        } catch (err: any) {
            console.error("Failed to add voice:", err)
            alert(`Failed to save voice clone: ${err.message || 'Unknown error'}`)
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className={cn("text-sm font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                        Assistant Personalities
                    </h2>
                </div>

            </div>

            {showRecorder && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <VoiceRecorder
                        onVoiceCaptured={handleVoiceAdded}
                        isDarkTheme={isDarkTheme}
                    />
                    <div className="flex justify-center mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRecorder(false)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300"
                        >
                            Cancel Recording
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Render Cloned Voices First */}
                    {clonedVoices.map((voice) => (
                        <div
                            key={voice.id}
                            onClick={() => selectVoice(voice.id)}
                            className={cn(
                                "relative group cursor-pointer px-4 py-2.5 rounded-xl border transition-all duration-300",
                                activeVoiceId === voice.id
                                    ? "bg-blue-600/5 border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                                    : isDarkTheme
                                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                        : "bg-white border-zinc-200 hover:border-zinc-300"
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className={cn("text-xs font-semibold truncate flex-1", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                                    {voice.name}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeVoice(voice.id)
                                    }}
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-opacity"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            {activeVoiceId === voice.id && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Render Preset Voices */}
                    {presetVoices.map((voice) => (
                        <div
                            key={voice.id}
                            onClick={() => selectVoice(voice.id)}
                            className={cn(
                                "relative group cursor-pointer px-4 py-2.5 rounded-xl border transition-all duration-300",
                                activeVoiceId === voice.id
                                    ? "bg-blue-600/5 border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                                    : isDarkTheme
                                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                        : "bg-white border-zinc-200 hover:border-zinc-300"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("text-xs font-semibold truncate flex-1", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                                    {voice.name}
                                </div>
                            </div>
                            {activeVoiceId === voice.id && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
