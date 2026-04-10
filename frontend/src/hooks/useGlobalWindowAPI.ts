import { useSyncExternalStore, useCallback } from 'react'

interface UseGlobalWindowAPIProps {
  outputWindowEnabled: boolean
  addMessage: (message: string, role?: 'user' | 'assistant') => void
  setIsInputVisible: (visible: boolean) => void
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
  setIsInputVisible,
  setIsOutputVisible,
  setAreaScreenshotCallback,
  setShowAreaScreenshot,
  setRectangleScreenshotCallback,
  setShowRectangleScreenshot
}: UseGlobalWindowAPIProps) => {
  useSyncExternalStore(
    useCallback((_callback) => {
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

      const handleShowPromptInput = () => {
        console.log('[useGlobalWindowAPI] Received show-prompt-input message')
        setIsInputVisible(true)
        if (window.interfaceAPI?.setIgnoreMouseEvents) {
          window.interfaceAPI.setIgnoreMouseEvents(false)
        }
      }

      window.addEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
      window.addEventListener('show-rectangle-screenshot', handleShowRectangleScreenshot as EventListener)

      if (window.interfaceAPI?.onMessage) {
        window.interfaceAPI.onMessage('show-prompt-input', handleShowPromptInput)
      }

      return () => {
        window.addOutputMessage = undefined
        window.removeEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
        window.removeEventListener('show-rectangle-screenshot', handleShowRectangleScreenshot as EventListener)
        if (window.interfaceAPI?.removeMessageListener) {
          window.interfaceAPI.removeMessageListener('show-prompt-input', handleShowPromptInput)
        }
      }
    }, [outputWindowEnabled, addMessage, setIsInputVisible, setIsOutputVisible, setAreaScreenshotCallback, setShowAreaScreenshot, setRectangleScreenshotCallback, setShowRectangleScreenshot]),
    () => null,
    () => null
  )
}

