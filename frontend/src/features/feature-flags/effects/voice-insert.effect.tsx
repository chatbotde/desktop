import { useCallback, useEffect } from "react"
import { useFeature } from "@/contexts/FeatureContext"
import { InsertTranscriptOverlay } from "@/features/audio"
import { cn } from "@/shared/lib"

export const featureId = "voice-insert"

export function FeatureEffect() {
  const { isFeatureEnabled, setFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)

  const dispatchVoiceInsertToggle = useCallback(() => {
    window.dispatchEvent(new CustomEvent("toggle-insert-transcript-overlay"))
  }, [])

  const handleToggleRequest = useCallback(() => {
    if (!enabled) {
      setFeatureEnabled(featureId, true)
    }

    dispatchVoiceInsertToggle()
  }, [dispatchVoiceInsertToggle, enabled, setFeatureEnabled])

  const handleDismiss = useCallback(() => {
    setFeatureEnabled(featureId, false)
  }, [setFeatureEnabled])

  useEffect(() => {
    const handleMainProcessToggle = () => {
      handleToggleRequest()
    }

    if (window.interfaceAPI?.onMessage) {
      window.interfaceAPI.onMessage("toggle-voice-insert", handleMainProcessToggle)
    }

    return () => {
      if (window.interfaceAPI?.removeMessageListener) {
        window.interfaceAPI.removeMessageListener("toggle-voice-insert", handleMainProcessToggle)
      }
    }
  }, [handleToggleRequest])

  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 z-[2001] -translate-x-1/2 translate-y-[160px] pointer-events-none",
        !enabled && "invisible opacity-0"
      )}
      data-no-clickthrough
    >
      <InsertTranscriptOverlay onDismiss={handleDismiss} />
    </div>
  )
}
