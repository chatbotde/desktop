import { ImageGenerationWindow } from '@/components'
import { useAppState } from '../context/AppContext'

export function ImageGenerationOverlay() {
    const { uiState } = useAppState()

    return (
        <ImageGenerationWindow
            images={uiState.generatedImages}
            isVisible={uiState.isImageWindowVisible}
            isLoading={uiState.isGeneratingImages}
            onClose={() => {
                uiState.setIsImageWindowVisible(false)
                uiState.setIsGeneratingImages(false)
                uiState.setGeneratedImages([])
            }}
            isDarkTheme={uiState.isDarkTheme}
        />
    )
}
