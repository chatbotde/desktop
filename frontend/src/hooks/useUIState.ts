import { useState, useEffect, useCallback } from 'react'
import { useIsDark } from '@/shared/providers'

export const useUIState = (outputWindowEnabled: boolean) => {
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [isOutputVisible, setIsOutputVisible] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVideoScroll, setShowVideoScroll] = useState(false)
  const [showAreaScreenshot, setShowAreaScreenshot] = useState(false)
  const [areaScreenshotCallback, setAreaScreenshotCallback] = useState<((area: { x: number; y: number; width: number; height: number }) => void) | null>(null)
  const [showRectangleScreenshot, setShowRectangleScreenshot] = useState(false)
  const [rectangleScreenshotCallback, setRectangleScreenshotCallback] = useState<((area: { x: number; y: number; width: number; height: number }) => void) | null>(null)
  // Use global theme from ThemeProvider instead of local state
  const isDarkTheme = useIsDark()
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [explanation, setExplanation] = useState<string | undefined>(undefined)
  const [explanationPosition, setExplanationPosition] = useState<{ x: number; y: number } | undefined>(undefined)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isImageWindowVisible, setIsImageWindowVisible] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([])
  const [isVideoWindowVisible, setIsVideoWindowVisible] = useState(true)
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // If the user disables the Output Window feature, hide the window immediately.
  useEffect(() => {
    if (!outputWindowEnabled && isOutputVisible) {
      setIsOutputVisible(false)
    }
  }, [outputWindowEnabled, isOutputVisible])

  // Theme is now managed globally by ThemeProvider, no need for local theme management

  const clearExplanation = useCallback(() => {
    setExplanation(undefined)
    setExplanationPosition(undefined)
  }, [])

  return {
    isInputVisible,
    setIsInputVisible,
    isOutputVisible,
    setIsOutputVisible,
    showAudioRecorder,
    setShowAudioRecorder,
    showVideoScroll,
    setShowVideoScroll,
    showAreaScreenshot,
    setShowAreaScreenshot,
    areaScreenshotCallback,
    setAreaScreenshotCallback,
    showRectangleScreenshot,
    setShowRectangleScreenshot,
    rectangleScreenshotCallback,
    setRectangleScreenshotCallback,
    isDarkTheme,
    recordedAudio,
    setRecordedAudio,
    explanation,
    setExplanation,
    explanationPosition,
    setExplanationPosition,
    clearExplanation,
    generatedImages,
    setGeneratedImages,
    isImageWindowVisible,
    setIsImageWindowVisible,
    isGeneratingImages,
    setIsGeneratingImages,
    generatedVideos,
    setGeneratedVideos,
    isVideoWindowVisible,
    setIsVideoWindowVisible,
    isGeneratingVideos,
    setIsGeneratingVideos,
    showSettings,
    setShowSettings,
  }
}
