import { useCallback } from "react"

interface UsePromptFileHandlersProps {
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setIsExpanded: (expanded: boolean) => void
  setValidationError: React.Dispatch<React.SetStateAction<string | null>>
  validationError: string | null
}

export function usePromptFileHandlers({
  setFiles,
  setClipboardItems,
  setIsExpanded,
  setValidationError,
  validationError,
}: UsePromptFileHandlersProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)
      setFiles((prev) => [...prev, ...newFiles])
      setIsExpanded(true)
    }
    // Reset input to allow selecting the same file again
    if (event.target) {
      event.target.value = ""
    }
  }, [setFiles, setIsExpanded])

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return
    setFiles((prev) => [...prev, ...newFiles])
    setIsExpanded(true)
  }, [setFiles, setIsExpanded])

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    // Clear validation error when files are removed
    if (validationError) {
      setValidationError(null)
    }
  }, [setFiles, validationError, setValidationError])

  const handleClipboardItemAdd = useCallback((text: string) => {
    setClipboardItems((prev) => [...prev, text])
    setIsExpanded(true)
  }, [setClipboardItems, setIsExpanded])

  const handleRemoveClipboardItem = useCallback((index: number) => {
    setClipboardItems((prev) => prev.filter((_, i) => i !== index))
  }, [setClipboardItems])

  return {
    handleFileChange,
    handleFilesAdded,
    handleRemoveFile,
    handleClipboardItemAdd,
    handleRemoveClipboardItem,
  }
}

