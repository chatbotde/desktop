import { useState, useEffect, useCallback } from 'react'

export const useUIState = (outputWindowEnabled: boolean) => {
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [isOutputVisible, setIsOutputVisible] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVideoScroll, setShowVideoScroll] = useState(false)
  const [showAreaScreenshot, setShowAreaScreenshot] = useState(false)
  const [areaScreenshotCallback, setAreaScreenshotCallback] = useState<((area: { x: number; y: number; width: number; height: number }) => void) | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [explanation, setExplanation] = useState<string | undefined>(undefined)
  const [explanationPosition, setExplanationPosition] = useState<{ x: number; y: number } | undefined>(undefined)

  // If the user disables the Output Window feature, hide the window immediately.
  useEffect(() => {
    if (!outputWindowEnabled && isOutputVisible) {
      setIsOutputVisible(false)
    }
  }, [outputWindowEnabled, isOutputVisible])

  // Keep shadcn/tailwind theme tokens consistent globally.
  // Many UI components (Select/Popover/Dialog) rely on `.dark` + CSS variables for correct colors.
  useEffect(() => {
    const root = document.documentElement
    if (isDarkTheme) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDarkTheme])

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
    isDarkTheme,
    setIsDarkTheme,
    recordedAudio,
    setRecordedAudio,
    explanation,
    setExplanation,
    explanationPosition,
    setExplanationPosition,
    clearExplanation
  }
}
