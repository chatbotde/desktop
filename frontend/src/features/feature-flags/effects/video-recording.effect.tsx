import { useState, useEffect, useCallback } from "react"
import { useFeature } from "@/contexts/FeatureContext"
import { VideoRecorderPill, VideoPreview } from "@/features/capture/components"
import type { VideoData } from "@/hooks/useVideoRecording"

export const featureId = "video-recording"

export function FeatureEffect() {
    const { isFeatureEnabled } = useFeature()
    const [isVisible, setIsVisible] = useState(false)
    const [recordedVideo, setRecordedVideo] = useState<VideoData | null>(null)
    const enabled = isFeatureEnabled(featureId)

    useEffect(() => {
        if (!enabled) {
            setIsVisible(false)
            return
        }

        const handler = () => setIsVisible(true)
        window.addEventListener('trigger-video-recording', handler)
        return () => window.removeEventListener('trigger-video-recording', handler)
    }, [enabled])

    const handleRecordingComplete = useCallback((video: VideoData) => {
        console.log('[VideoRecording] Recording complete:', video.name, video.duration, 'ms')
        setRecordedVideo(video)
        
        // Dispatch event with video data for other components to consume
        window.dispatchEvent(new CustomEvent('video-recording-complete', {
            detail: { video }
        }))
    }, [])

    const handleClose = useCallback(() => {
        setIsVisible(false)
    }, [])

    const handleClosePreview = useCallback(() => {
        setRecordedVideo(null)
    }, [])

    const handleDeletePreview = useCallback(() => {
        setRecordedVideo(null)
    }, [])

    const handleAddVideo = useCallback((video: VideoData) => {
        // Dispatch event to add video to prompt or wherever it should go
        window.dispatchEvent(new CustomEvent('add-video-to-prompt', {
            detail: { video }
        }))
        setRecordedVideo(null)
    }, [])

    if (!enabled) return null

    return (
        <>
            {isVisible && (
                <VideoRecorderPill
                    onClose={handleClose}
                    isDarkTheme={true}
                    defaultFps={30}
                    onRecordingComplete={handleRecordingComplete}
                />
            )}

            {recordedVideo && (
                <VideoPreview
                    video={recordedVideo}
                    onClose={handleClosePreview}
                    onDelete={handleDeletePreview}
                    onAdd={handleAddVideo}
                    isDarkTheme={true}
                />
            )}
        </>
    )
}
