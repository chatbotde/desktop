import { ImageGenerationWindow } from '@/components'
import { useFeature } from '@/shared/providers'
import { useAppState } from '../context/AppContext'
import { useEffect, useRef, useState } from 'react'

export function ImageGenerationOverlay() {
    const { uiState, messageManager } = useAppState()
    const { isFeatureEnabled } = useFeature()
    const imageWindowEnabled = isFeatureEnabled('image-generation-window')

    const {
        generatedImages,
        isGeneratingImages,
        imageGenerationError,
        imageLoadingPhrases,
        isDarkTheme,
        setIsImageWindowVisible,
        setIsGeneratingImages,
        setImageGenerationError,
    } = uiState

    // The window stays hidden after the user explicitly closes it, until the
    // next generation starts or a new image arrives.
    const [userClosed, setUserClosed] = useState(false)
    const prevImageCountRef = useRef(generatedImages.length)

    useEffect(() => {
        if (isGeneratingImages) setUserClosed(false)
    }, [isGeneratingImages])

    useEffect(() => {
        const count = generatedImages.length
        if (count > prevImageCountRef.current) {
            setUserClosed(false)
        }
        prevImageCountRef.current = count
    }, [generatedImages.length])

    if (!imageWindowEnabled) {
        return null
    }

    const hasContent =
        isGeneratingImages ||
        generatedImages.length > 0 ||
        imageGenerationError != null

    const isVisible = !userClosed && hasContent

    const handleClose = () => {
        setUserClosed(true)
        setIsImageWindowVisible(false)
        setIsGeneratingImages(false)
        setImageGenerationError(null)
        uiState.setImageLoadingPhrases(undefined)
    }

    const handleStop = () => {
        messageManager.handleStop()
        setIsGeneratingImages(false)
    }

    return (
        <ImageGenerationWindow
            images={generatedImages}
            isVisible={isVisible}
            isLoading={isGeneratingImages}
            loadingPhrases={imageLoadingPhrases}
            error={imageGenerationError}
            onClose={handleClose}
            onStop={handleStop}
            isDarkTheme={isDarkTheme}
        />
    )
}
