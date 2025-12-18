import { useEffect } from 'react'

interface UseGlobalWindowAPIProps {
  outputWindowEnabled: boolean
  addMessage: (message: string, role?: 'user' | 'assistant') => void
  setIsOutputVisible: (visible: boolean) => void
  setAreaScreenshotCallback: (callback: ((area: { x: number; y: number; width: number; height: number }) => void) | null) => void
  setShowAreaScreenshot: (show: boolean) => void
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
  setShowAreaScreenshot
}: UseGlobalWindowAPIProps) => {
  useEffect(() => {
    window.addOutputMessage = (message: string, role: 'user' | 'assistant' = 'assistant') => {
      addMessage(message, role)
      if (outputWindowEnabled) setIsOutputVisible(true)
    }

    // Listen for area screenshot requests
    const handleShowAreaScreenshot = (event: CustomEvent) => {
      setAreaScreenshotCallback(() => event.detail.onCapture)
      setShowAreaScreenshot(true)
    }

    window.addEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)

    return () => {
      window.addOutputMessage = undefined
      window.removeEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
    }
  }, [outputWindowEnabled, addMessage, setIsOutputVisible, setAreaScreenshotCallback, setShowAreaScreenshot])
}
