import { useCallback } from "react"
import { toast } from "sonner"

declare global {
  interface Window {
    youtubeTranscriptAPI?: {
      getTranscript?: (url: string, options?: any) => Promise<any>;
      validateUrl?: (url: string) => Promise<any>;
    };
  }
}

const YOUTUBE_URL_REGEX = /(youtube\.com|youtu\.be)\//i

interface UseYoutubeTranscriptProps {
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  setIsExpanded: (expanded: boolean) => void
}

export function useYoutubeTranscript({
  setClipboardItems,
  setIsExpanded,
}: UseYoutubeTranscriptProps) {
  const addTranscriptFromUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url || !YOUTUBE_URL_REGEX.test(url)) return false

    if (!window.youtubeTranscriptAPI?.getTranscript) {
      console.warn('[PromptInput] youtubeTranscriptAPI is not available in renderer')
      return false
    }

    try {
      if (!window.youtubeTranscriptAPI?.validateUrl) {
        toast.error('YouTube transcript API validation is not available')
        return false
      }
      const validation = await window.youtubeTranscriptAPI.validateUrl(url)
      if (!validation?.valid) {
        toast.error('Invalid YouTube link', { description: validation?.error || undefined })
        return false
      }

      const result = await window.youtubeTranscriptAPI.getTranscript(url, { includeTimestamps: false })

      if (result?.success && result.transcript) {
        const languageLabel = result.language?.name || result.language?.code
        const formattedTranscript = `${result.transcript}`

        setClipboardItems((prev) => [...prev, formattedTranscript])
        setIsExpanded(true)
        toast.success('YouTube transcript added', {
          description: languageLabel ? `Language: ${languageLabel}` : undefined,
          duration: 2500,
        })
        return true
      }

      const errorMessage = result?.error || 'Failed to fetch transcript'
      toast.error('YouTube transcript failed', { description: errorMessage })
      return false
    } catch (error) {
      console.error('[PromptInput] Error fetching YouTube transcript', error)
      const description = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('YouTube transcript failed', { description })
      return false
    }
  }, [setClipboardItems, setIsExpanded])

  return {
    addTranscriptFromUrl,
    isYoutubeUrl: (url: string) => YOUTUBE_URL_REGEX.test(url),
  }
}
