import { useState, useCallback, useEffect, useRef } from "react"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"


import type { MediaAttachment } from './output-window/types'

interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  isDarkTheme?: boolean;
  onSendMessage?: (message: string, attachments?: MediaAttachment[]) => void | Promise<void>;
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
  const prevInputLengthRef = useRef<number>(0)

  // Convert files to MediaAttachment format
  const convertFilesToAttachments = useCallback(async (filesToConvert: File[]): Promise<MediaAttachment[]> => {
    const attachments: MediaAttachment[] = []
    
    for (const file of filesToConvert) {
      // Only process image files for now
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          // Get image dimensions
          const dimensions = await new Promise<{ width: number; height: number } | undefined>((resolve) => {
            const img = new Image()
            img.onload = () => {
              resolve({ width: img.width, height: img.height })
            }
            img.onerror = () => resolve(undefined)
            img.src = dataUrl
          })

          attachments.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
            source: 'upload',
            mediaType: 'image',
            dimensions
          })
        } catch (error) {
          console.error('Error converting file to attachment:', error)
        }
      }
    }
    
    return attachments
  }, [])

  const handleInputChange = useCallback((value: string) => {
    const prevLength = prevInputLengthRef.current
    prevInputLengthRef.current = value.length
    
    setInput(value)
    
    // Emit typing start event when user starts typing (first character)
    if (value.length === 1 && prevLength === 0) {
      console.log('[PromptInput] Typing started, dispatching prompt-typing-start event')
      window.dispatchEvent(new CustomEvent('prompt-typing-start', { 
        detail: { inputValue: value } 
      }))
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!(input.trim() || files.length > 0 || clipboardItems.length > 0)) return

    setIsLoading(true)

    try {
      // Convert files to MediaAttachment format
      const attachments = files.length > 0 ? await convertFilesToAttachments(files) : undefined

      if ((input.trim() || clipboardItems.length > 0 || attachments) && onSendMessage) {
        const messageParts = [...clipboardItems, input].filter(Boolean)
        const message = messageParts.join("\n\n") || (attachments ? "See attached images" : "")
        await onSendMessage(message, attachments)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could add user-facing error notification here
    } finally {
      setIsLoading(false)
      setInput("")
      prevInputLengthRef.current = 0
      setFiles([])
      setClipboardItems([])
      setIsExpanded(false)
      
      // Emit input cleared event to reset auto-screenshot
      window.dispatchEvent(new CustomEvent('prompt-input-cleared'))
    }
  }, [input, files, clipboardItems, onSendMessage, convertFilesToAttachments])

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

  // Sync ref with input state when input changes externally
  useEffect(() => {
    prevInputLengthRef.current = input.length
  }, [input])

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
  }, [setIsVisible])

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
  }, [handleFilesAdded, setIsVisible])

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
          setInput={handleInputChange}
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
          setInput={handleInputChange}
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

