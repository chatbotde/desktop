import { useEffect } from "react"
import { useFeature } from "@/contexts/FeatureContext"

export const featureId = "exclude-from-screenshot"

export function FeatureEffect() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled(featureId)

  useEffect(() => {
    if (typeof window !== "undefined" && window.interfaceAPI?.setContentProtection) {
      window.interfaceAPI.setContentProtection(enabled)
    }
  }, [enabled])

  return null
}

