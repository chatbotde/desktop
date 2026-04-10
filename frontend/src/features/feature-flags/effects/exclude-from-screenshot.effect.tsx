import { useSyncExternalStore, useCallback } from "react"
import { useFeature } from "@/contexts/FeatureContext"

export const featureId = "exclude-from-screenshot"

export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)

  useSyncExternalStore(
    useCallback((_callback) => {
      if (typeof window !== "undefined" && window.interfaceAPI?.setContentProtection) {
        window.interfaceAPI.setContentProtection(enabled)
      }
      return () => {}
    }, [enabled]),
    () => null,
    () => null
  )

  return null
}

