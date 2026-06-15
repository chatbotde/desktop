import { useEffect, useRef } from "react"
import { useFeature } from "@/contexts/FeatureContext"
import { openYoutubePlayer } from "@/lib/open-youtube-player"

export const featureId = "standalone-youtube-player"

/** Re-open the floating player when the feature is toggled on in Settings. */
export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)
  const prevEnabled = useRef(enabled)

  useEffect(() => {
    if (!prevEnabled.current && enabled) {
      openYoutubePlayer()
    }
    prevEnabled.current = enabled
  }, [enabled])

  return null
}
