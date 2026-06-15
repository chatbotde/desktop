import { VideoGenerationWindow } from '@/components'
import { useFeature } from '@/shared/providers'
import { useAppState } from '../context/AppContext'
import { useEffect, useRef, useState } from 'react'

export function VideoGenerationOverlay() {
    const { uiState } = useAppState()
    const { isFeatureEnabled } = useFeature()
    const videoWindowEnabled = isFeatureEnabled('video-generation-window')

    const {
        generatedVideos,
        isGeneratingVideos,
        videoGenerationError,
        isDarkTheme,
        setIsVideoWindowVisible,
        setIsGeneratingVideos,
        setVideoGenerationError,
    } = uiState

    const [userClosed, setUserClosed] = useState(false)
    const prevVideoCountRef = useRef(generatedVideos.length)

    useEffect(() => {
        if (isGeneratingVideos) setUserClosed(false)
    }, [isGeneratingVideos])

    useEffect(() => {
        const count = generatedVideos.length
        if (count > prevVideoCountRef.current) {
            setUserClosed(false)
        }
        prevVideoCountRef.current = count
    }, [generatedVideos.length])

    if (!videoWindowEnabled) {
        return null
    }

    const hasContent =
        isGeneratingVideos ||
        generatedVideos.length > 0 ||
        videoGenerationError != null

    const isVisible = !userClosed && hasContent

    const handleClose = () => {
        setUserClosed(true)
        setIsVideoWindowVisible(false)
        setIsGeneratingVideos(false)
        setVideoGenerationError(null)
    }

    return (
        <VideoGenerationWindow
            videos={generatedVideos}
            isVisible={isVisible}
            isLoading={isGeneratingVideos}
            error={videoGenerationError}
            onClose={handleClose}
            isDarkTheme={isDarkTheme}
        />
    )
}
