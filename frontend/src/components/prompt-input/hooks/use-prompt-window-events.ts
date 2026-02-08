import { useEffect } from "react"
import { toast } from "sonner"
import type { VideoData } from '@/hooks/useVideoRecording'

interface UsePromptWindowEventsProps {
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  setIsExpanded: (expanded: boolean) => void
  setIsVisible: (visible: boolean) => void
  handleFilesAdded: (files: File[]) => void
  handleSubmit: () => void
}

export function usePromptWindowEvents({
  setClipboardItems,
  setIsExpanded,
  setIsVisible,
  handleFilesAdded,
  handleSubmit,
}: UsePromptWindowEventsProps) {
  // Allow other parts of the app (e.g. Output window selection) to add text to the prompt.
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ text?: string }>
      const text = custom.detail?.text?.trim()
      if (!text) return

      setClipboardItems((prev) => [...prev, text])
      setIsExpanded(true)
      setIsVisible(true)
    }

    window.addEventListener('prompt-add-text', handler as EventListener)
    return () => window.removeEventListener('prompt-add-text', handler as EventListener)
  }, [setClipboardItems, setIsExpanded, setIsVisible])

  // Allow other parts of the app to trigger sending the current prompt
  useEffect(() => {
    const handler = () => {
      // Fire-and-forget; internal state + loading is handled in handleSubmit
      handleSubmit()
    }

    window.addEventListener('prompt-send-now', handler as EventListener)
    return () => window.removeEventListener('prompt-send-now', handler as EventListener)
  }, [handleSubmit])

  // Allow other parts of the app to add files to the prompt (e.g. auto-screenshot)
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ files?: File[] }>
      const files = custom.detail?.files
      if (!files || files.length === 0) return

      handleFilesAdded(files)
      setIsExpanded(true)
      setIsVisible(true)
    }

    window.addEventListener('prompt-add-files', handler as EventListener)
    return () => window.removeEventListener('prompt-add-files', handler as EventListener)
  }, [handleFilesAdded, setIsExpanded, setIsVisible])

  // Allow other parts of the app to add video to the prompt (e.g. video recording)
  useEffect(() => {
    const handler = async (event: Event) => {
      const custom = event as CustomEvent<{ video?: VideoData }>
      const video = custom.detail?.video
      if (!video) return

      try {
        // Convert VideoData to File object
        // VideoData.data is a base64 data URL, so we need to fetch it and create a File
        const response = await fetch(video.data)
        const blob = await response.blob()

        // Create a File object from the blob
        const videoFile = new File([blob], video.name, { type: video.type })

        handleFilesAdded([videoFile])
        setIsExpanded(true)
        setIsVisible(true)
      } catch (error) {
        console.error('Failed to add video to prompt:', error)
        toast.error('Failed to add video', {
          description: error instanceof Error ? error.message : 'Unknown error',
          duration: 4000,
        })
      }
    }

    window.addEventListener('add-video-to-prompt', handler as EventListener)
    return () => window.removeEventListener('add-video-to-prompt', handler as EventListener)
  }, [handleFilesAdded, setIsExpanded, setIsVisible])
}

