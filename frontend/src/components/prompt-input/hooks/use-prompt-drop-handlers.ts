import { useCallback } from "react"
import type { DroppedFileInfo } from "@/components/drop-zone"

interface UsePromptDropHandlersProps {
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setIsExpanded: (expanded: boolean) => void
}

export function usePromptDropHandlers({
  setFiles,
  setClipboardItems,
  setInput,
  setIsExpanded,
}: UsePromptDropHandlersProps) {
  const handleFilesDropped = useCallback((droppedFiles: File[], fileInfos?: DroppedFileInfo[]) => {
    // Process files with their content information
    if (fileInfos && fileInfos.length > 0) {
      for (const fileInfo of fileInfos) {
        // If we have file content, add it as formatted text
        if (fileInfo.content) {
          // Format the content with file info for AI context
          const language = fileInfo.language || ''
          const formattedContent = `📄 **${fileInfo.file.name}**${language ? ` (${language})` : ''}\n\`\`\`${language}\n${fileInfo.content}\n\`\`\``
          setClipboardItems((prev) => [...prev, formattedContent])
        }
        // If it's an image file, add as attachment
        else if (fileInfo.isImageFile || fileInfo.file.type.startsWith('image/')) {
          setFiles((prev) => [...prev, fileInfo.file])
        }
        // Fallback: add as file attachment if no content was read
        else {
          setFiles((prev) => [...prev, fileInfo.file])
        }
      }
    } else {
      // Fallback for when fileInfos isn't available (web browser without Electron)
      setFiles((prev) => [...prev, ...droppedFiles])
    }
    setIsExpanded(true)
  }, [setFiles, setClipboardItems, setIsExpanded])

  const handleTextDropped = useCallback((text: string) => {
    if (text.length > 200) {
      setClipboardItems((prev) => [...prev, text])
    } else {
      setInput((prev) => prev ? `${prev} ${text}` : text)
    }
    setIsExpanded(true)
  }, [setClipboardItems, setInput, setIsExpanded])

  const handleUrlDropped = useCallback((url: string) => {
    setClipboardItems((prev) => [...prev, url])
    setIsExpanded(true)
  }, [setClipboardItems, setIsExpanded])

  return {
    handleFilesDropped,
    handleTextDropped,
    handleUrlDropped,
  }
}

