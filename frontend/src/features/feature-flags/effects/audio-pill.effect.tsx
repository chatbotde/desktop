import { useFeature } from "@/contexts/FeatureContext"
import { useIsDark } from "@/shared/providers"
import { AudioRecorderPill } from "@/features/audio/components/AudioRecorderPill"

export const featureId = "audio-pill"

export function FeatureEffect() {
  const { isFeatureEnabled, setFeatureEnabled } = useFeature()
  const isDarkTheme = useIsDark()
  const enabled = isFeatureEnabled(featureId)

  // Don't render anything if feature is disabled
  if (!enabled) return null

  const handleRecordingComplete = (blob: Blob) => {
    console.log('[AudioPill] Recording complete, size:', blob.size, 'bytes')
    // Convert blob to File and dispatch event to add to prompt
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
    try {
      window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
    } catch (error) {
      console.error('[AudioPill] Failed to dispatch prompt-add-files event:', error)
    }
  }

  const handleClose = () => {
    // Disable the feature flag when close button is clicked
    setFeatureEnabled(featureId, false)
  }

  return (
    <div data-no-clickthrough>
      <AudioRecorderPill
        onClose={handleClose}
        isDarkTheme={isDarkTheme}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  )
}

