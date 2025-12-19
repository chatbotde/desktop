import { useState } from "react"
import { Mic } from "lucide-react"
import { useFeature } from "@/contexts/FeatureContext"
import { VoiceToPromptQuickInsert } from "@/components/audio/voice-to-prompt"
import { cn } from "@/lib/utils"

export const featureId = "voice-to-prompt"

export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const [isVisible, setIsVisible] = useState(false)
  const enabled = isFeatureEnabled(featureId)

  // Don't render anything if feature is disabled
  if (!enabled) return null

  return (
    <>
      {/* Floating trigger button - appears when feature is enabled */}
      {!isVisible && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]",
            "flex items-center justify-center"
          )}
          data-no-clickthrough
        >
          <button
            onClick={() => setIsVisible(true)}
            className={cn(
              "px-4 py-2 rounded-full shadow-lg border transition-all",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-700",
              "hover:bg-neutral-50 dark:hover:bg-neutral-800",
              "text-sm font-medium text-neutral-700 dark:text-neutral-300",
              "flex items-center gap-2"
            )}
            aria-label="Open Voice to Prompt"
          >
            <Mic className="w-4 h-4" />
            Voice to Prompt
          </button>
        </div>
      )}

      {/* VoiceToPromptQuickInsert component */}
      {isVisible && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2",
            "w-full max-w-2xl px-4",
            "z-[120]"
          )}
          data-no-clickthrough
          onClick={(e) => e.stopPropagation()}
        >
          <VoiceToPromptQuickInsert onCancel={() => setIsVisible(false)} />
        </div>
      )}
    </>
  )
}
