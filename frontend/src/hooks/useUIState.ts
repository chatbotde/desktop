import { useState, useSyncExternalStore, useCallback } from 'react'
import { useIsDark } from '@/shared/providers'
import type { FactCheckResult } from '@/lib/search/fact-check-types'

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
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null)
  const [imageLoadingPhrases, setImageLoadingPhrases] = useState<string[] | undefined>(undefined)
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([])
  const [isVideoWindowVisible, setIsVideoWindowVisible] = useState(false)
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false)
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResult | null>(null)
  const [isFactCheckWindowVisible, setIsFactCheckWindowVisible] = useState(false)

  // If the user disables the Output Window feature, hide the window immediately - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (!outputWindowEnabled && isOutputVisible) {
        setIsOutputVisible(false)
      }
      return () => {}
    }, [outputWindowEnabled, isOutputVisible]),
    () => null,
    () => null
  )

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
    imageGenerationError,
    setImageGenerationError,
    imageLoadingPhrases,
    setImageLoadingPhrases,
    generatedVideos,
    setGeneratedVideos,
    isVideoWindowVisible,
    setIsVideoWindowVisible,
    isGeneratingVideos,
    setIsGeneratingVideos,
    videoGenerationError,
    setVideoGenerationError,
    showSettings,
    setShowSettings,
    factCheckResult,
    setFactCheckResult,
    isFactCheckWindowVisible,
    setIsFactCheckWindowVisible,
  }
}
