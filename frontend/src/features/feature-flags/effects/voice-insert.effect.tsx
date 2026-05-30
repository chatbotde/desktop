import { useCallback, useEffect } from "react"
import { AnimatePresence } from "motion/react"
import { useFeature } from "@/contexts/FeatureContext"
import { InsertTranscriptOverlay } from "@/features/audio"

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
      className="pointer-events-none absolute left-1/2 top-1/2 z-[2001] -translate-x-1/2 translate-y-[160px]"
      data-no-clickthrough
    >
      <AnimatePresence>
        {enabled && (
          <InsertTranscriptOverlay key="voice-insert" onDismiss={handleDismiss} />
        )}
      </AnimatePresence>
    </div>
  )
}
