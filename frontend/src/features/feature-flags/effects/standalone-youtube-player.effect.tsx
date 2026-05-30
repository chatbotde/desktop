import { useEffect, useRef } from "react"
import { useFeature } from "@/contexts/FeatureContext"

export const featureId = "standalone-youtube-player"

/** Re-open the floating player when the feature is toggled on in Settings. */
export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)
  const prevEnabled = useRef(enabled)

  useEffect(() => {
    if (!prevEnabled.current && enabled) {
      window.dispatchEvent(new CustomEvent("open-youtube-player"))
    }
    prevEnabled.current = enabled
  }, [enabled])

  return null
}
