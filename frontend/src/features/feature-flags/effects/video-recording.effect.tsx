import { useState, useSyncExternalStore, useCallback } from "react"
import { useFeature } from "@/contexts/FeatureContext"
import { VideoRecorderPill, VideoPreview } from "@/features/capture/components"
import type { VideoData } from "@/hooks/useVideoRecording"

export const featureId = "video-recording"

export function FeatureEffect() {
    const { isFeatureEnabled } = useFeature()
    const [isVisible, setIsVisible] = useState(false)
    const [recordedVideo, setRecordedVideo] = useState<VideoData | null>(null)
    const enabled = isFeatureEnabled(featureId)

    useSyncExternalStore(
        useCallback((_callback) => {
            if (!enabled) {
                setIsVisible(false)
                return () => {}
            }

            const handler = () => setIsVisible(true)
            window.addEventListener('trigger-video-recording', handler)
            return () => window.removeEventListener('trigger-video-recording', handler)
        }, [enabled]),
        () => null,
        () => null
    )

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

    const handleAddVideo = useCallback(async (video: VideoData) => {
        try {
            // Convert VideoData to File object, similar to audio-pill
            let videoFile: File
            
            if (video.blob) {
                // Use the blob directly if available
                videoFile = new File([video.blob], video.name, { type: video.type })
            } else {
                // Convert from data URL if blob is not available
                const response = await fetch(video.data)
                const blob = await response.blob()
                videoFile = new File([blob], video.name, { type: video.type })
            }
            
            // Dispatch event to add video to prompt, just like audio does
            window.dispatchEvent(new CustomEvent('prompt-add-files', {
                detail: { files: [videoFile] }
            }))
            setRecordedVideo(null)
        } catch (error) {
            console.error('[VideoRecording] Failed to dispatch prompt-add-files event:', error)
        }
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
