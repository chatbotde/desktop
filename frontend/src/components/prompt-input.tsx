import { useState, useCallback } from "react"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"


interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  isDarkTheme?: boolean;
  onSendMessage?: (message: string) => void | Promise<void>;
  onAudioClick?: () => void;
  onMoreClick?: () => void;
}

export function PromptInputWithActions({
  isVisible: controlledVisible,
  onVisibilityChange,
  isDarkTheme = true,
  onSendMessage,
  onAudioClick,
  onMoreClick
}: PromptInputWithActionsProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)
  const [clipboardItems, setClipboardItems] = useState<string[]>([])

  const handleSubmit = useCallback(async () => {
    if (!(input.trim() || files.length > 0 || clipboardItems.length > 0)) return

    setIsLoading(true)

    try {
      if ((input.trim() || clipboardItems.length > 0) && onSendMessage) {
        const messageParts = [...clipboardItems, input].filter(Boolean)
        await onSendMessage(messageParts.join("\n\n"))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could add user-facing error notification here
    } finally {
      setIsLoading(false)
      setInput("")
      setFiles([])
      setClipboardItems([])
      setIsExpanded(false)
    }
  }, [input, files.length, clipboardItems, onSendMessage])

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

  const handleClipboardItemAdd = useCallback((text: string) => {
    setClipboardItems((prev) => [...prev, text])
    setIsExpanded(true)
  }, [])

  const handleRemoveClipboardItem = useCallback((index: number) => {
    setClipboardItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...droppedFiles])
      setIsExpanded(true)
    }
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

  return (
    <div
      className="relative w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >

      {!isExpanded ? (
        <PromptInputCollapsed
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          files={files}
          clipboardItems={clipboardItems}
          onSubmit={handleSubmit}
          onExpand={() => setIsExpanded(true)}
          onHide={() => setIsVisible(false)}
          isDarkTheme={isDarkTheme}
          onFilesAdded={handleFilesAdded}
          onAudioClick={onAudioClick}
          onMoreClick={onMoreClick}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          onClipboardItemAdd={handleClipboardItemAdd}
          onRemoveClipboardItem={handleRemoveClipboardItem}
        />
      ) : (
        <PromptInputExpanded
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          files={files}
          clipboardItems={clipboardItems}
          onSubmit={handleSubmit}
          onCollapse={() => setIsExpanded(false)}
          onHide={() => setIsVisible(false)}
          onFileChange={handleFileChange}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveFile}
          isDarkTheme={isDarkTheme}
          onAudioClick={onAudioClick}
          onMoreClick={onMoreClick}
          onClipboardItemAdd={handleClipboardItemAdd}
          onRemoveClipboardItem={handleRemoveClipboardItem}
        />
      )}
    </div>
  )
}

