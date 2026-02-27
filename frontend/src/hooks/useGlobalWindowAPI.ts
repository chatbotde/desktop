import { useEffect } from 'react'

interface UseGlobalWindowAPIProps {
  outputWindowEnabled: boolean
  addMessage: (message: string, role?: 'user' | 'assistant') => void
  setIsOutputVisible: (visible: boolean) => void
  setAreaScreenshotCallback: (callback: ((area: { x: number; y: number; width: number; height: number }) => void) | null) => void
  setShowAreaScreenshot: (show: boolean) => void
  setRectangleScreenshotCallback: (callback: ((area: { x: number; y: number; width: number; height: number }) => void) | null) => void
  setShowRectangleScreenshot: (show: boolean) => void
}

declare global {
  interface Window {
    addOutputMessage?: (message: string, role?: 'user' | 'assistant') => void;
  }
}

export const useGlobalWindowAPI = ({
  outputWindowEnabled,
  addMessage,
  setIsOutputVisible,
  setAreaScreenshotCallback,
  setShowAreaScreenshot,
  setRectangleScreenshotCallback,
  setShowRectangleScreenshot
}: UseGlobalWindowAPIProps) => {
  useEffect(() => {
    window.addOutputMessage = (message: string, role: 'user' | 'assistant' = 'assistant') => {
      addMessage(message, role)
      if (outputWindowEnabled) setIsOutputVisible(true)
    }

    const handleShowAreaScreenshot = (event: CustomEvent) => {
      setAreaScreenshotCallback(() => event.detail.onCapture)
      setShowAreaScreenshot(true)
    }
    const handleShowRectangleScreenshot = (event: CustomEvent) => {
      setRectangleScreenshotCallback(() => event.detail.onCapture)
      setShowRectangleScreenshot(true)
    }

    window.addEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
    window.addEventListener('show-rectangle-screenshot', handleShowRectangleScreenshot as EventListener)

    return () => {
      window.addOutputMessage = undefined
      window.removeEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
      window.removeEventListener('show-rectangle-screenshot', handleShowRectangleScreenshot as EventListener)
    }
  }, [outputWindowEnabled, addMessage, setIsOutputVisible, setAreaScreenshotCallback, setShowAreaScreenshot, setRectangleScreenshotCallback, setShowRectangleScreenshot])
}
