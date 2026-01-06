import { useCallback } from "react"
import { useYoutubeTranscript } from "./use-youtube-transcript"
import { toast } from "sonner"

interface UsePasteHandlerProps {
  onFilesAdded?: (files: File[]) => void
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  setIsExpanded: (expanded: boolean) => void
}

export function usePasteHandler({
  onFilesAdded,
  setClipboardItems,
  setIsExpanded,
}: UsePasteHandlerProps) {
  const { addTranscriptFromUrl, isYoutubeUrl } = useYoutubeTranscript({
    setClipboardItems,
    setIsExpanded,
  })

  return useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      const pastedFiles: File[] = []
      let pastedText = ""

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile()
          if (file) {
            pastedFiles.push(file)
          }
        } else if (items[i].kind === "string" && items[i].type === "text/plain") {
          pastedText = e.clipboardData.getData("text/plain")
        }
      }

      // Handle file pastes
      if (pastedFiles.length > 0 && onFilesAdded) {
        e.preventDefault()
        onFilesAdded(pastedFiles)
        return
      }

      // Check if pasted text is a YouTube URL - must preventDefault synchronously!
      if (pastedText && isYoutubeUrl(pastedText.trim())) {
        const url = pastedText.trim()
        e.preventDefault() // Prevent URL from being typed into input
        
        // Show loading toast
        toast.loading('Fetching YouTube transcript...', { id: 'youtube-transcript' })
        
        // Attempt to fetch transcript asynchronously
        addTranscriptFromUrl(url).then((success) => {
          toast.dismiss('youtube-transcript')
          
          // If transcript fetch failed, still add the URL as text
          if (!success) {
            setClipboardItems((prev) => [...prev, url])
            setIsExpanded(true)
          }
        }).catch((error) => {
          toast.dismiss('youtube-transcript')
          console.error('[usePasteHandler] Error fetching transcript:', error)
          setClipboardItems((prev) => [...prev, url])
          setIsExpanded(true)
        })
      }
    },
    [onFilesAdded, isYoutubeUrl, addTranscriptFromUrl, setClipboardItems, setIsExpanded]
  )
}

