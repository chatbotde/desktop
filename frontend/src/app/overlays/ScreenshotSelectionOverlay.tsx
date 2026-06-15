import { ScreenshotSelectionPopup } from '@/features/capture'
import { useFeature } from '@/shared/providers'
import { useAppState } from '../context/AppContext'

export function ScreenshotSelectionOverlay() {
  const { uiState } = useAppState()
  const { isFeatureEnabled } = useFeature()
  const imageWindowEnabled = isFeatureEnabled('image-generation-window')

  return (
    <ScreenshotSelectionPopup
      isDarkTheme={uiState.isDarkTheme}
      imageWindowEnabled={imageWindowEnabled}
      onTryOnStart={() => {
        if (!imageWindowEnabled) return
        uiState.setImageLoadingPhrases([
          'Fitting garment',
          'Aligning fabric',
          'Rendering try-on',
          'Polishing look',
        ])
        uiState.setGeneratedImages([])
        uiState.setIsImageWindowVisible(true)
        uiState.setIsGeneratingImages(true)
        uiState.setImageGenerationError(null)
      }}
      onTryOnSuccess={(images) => {
        uiState.setGeneratedImages(images)
        uiState.setIsGeneratingImages(false)
        uiState.setImageGenerationError(null)
        uiState.setImageLoadingPhrases(undefined)
      }}
      onTryOnError={(message) => {
        uiState.setIsGeneratingImages(false)
        uiState.setImageGenerationError(message)
        uiState.setImageLoadingPhrases(undefined)
      }}
    />
  )
}
