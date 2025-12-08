import { useState, useCallback } from "react"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"

interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  isDarkTheme?: boolean;
  onSendMessage?: (message: string) => void | Promise<void>;
}

export function PromptInputWithActions({
  isVisible: controlledVisible,
  onVisibilityChange,
  isDarkTheme = true,
  onSendMessage
}: PromptInputWithActionsProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)

  const handleSubmit = useCallback(async () => {
    if (!(input.trim() || files.length > 0)) return

    setIsLoading(true)

    try {
      if (input.trim() && onSendMessage) {
        await onSendMessage(input)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could add user-facing error notification here
    } finally {
      setIsLoading(false)
      setInput("")
      setFiles([])
      setIsExpanded(false)
    }
  }, [input, files.length, onSendMessage])

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
  }, [])

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setIsExpanded(true)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Use controlled or internal visibility
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible
  const setIsVisible = useCallback((visible: boolean) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible)
    } else {
      setInternalVisible(visible)
    }
  }, [onVisibilityChange])

  // Hidden state - return null (RightTransparent will show the input)
  if (!isVisible) {
    return null
  }

  // Collapsed state - functional input bar
  if (!isExpanded) {
    return (
      <PromptInputCollapsed
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        files={files}
        onSubmit={handleSubmit}
        onExpand={() => setIsExpanded(true)}
        onHide={() => setIsVisible(false)}
        isDarkTheme={isDarkTheme}
        onFilesAdded={handleFilesAdded}
      />
    )
  }

  // Expanded state - full input with actions
  return (
    <PromptInputExpanded
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      files={files}
      onSubmit={handleSubmit}
      onCollapse={() => setIsExpanded(false)}
      onHide={() => setIsVisible(false)}
      onFileChange={handleFileChange}
      onFilesAdded={handleFilesAdded}
      onRemoveFile={handleRemoveFile}
      isDarkTheme={isDarkTheme}
    />
  )
}

