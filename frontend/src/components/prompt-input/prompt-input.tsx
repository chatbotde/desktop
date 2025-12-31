
import { useState, useCallback, useEffect, useRef } from "react"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"
import { toast } from "sonner"
import { validateMessage } from '@/lib/ai/capabilities'
import { getSelectedModel } from '@/lib/ai/model-config'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { CaptureAreaStore } from '@/features/capture/capture-area-store'
import { useFeature } from "@/contexts/FeatureContext"
import { DropZone, type DroppedFileInfo } from "@/components/drop-zone"

import type { MediaAttachment } from '@/features/chat'

interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  isDarkTheme?: boolean;
  onSendMessage?: (message: string, attachments?: MediaAttachment[]) => void | Promise<void>;
  onStop?: () => void;
  onAudioClick?: () => void;
  onMoreClick?: () => void;
  onThemeChange?: (isDark: boolean) => void;
  isOutputVisible?: boolean;
  onToggleOutput?: () => void;
}

export function PromptInputWithActions({
  isVisible: controlledVisible,
  onVisibilityChange,
  isDarkTheme = true,
  onSendMessage,
  onStop,
  onAudioClick,
  onMoreClick,
  onThemeChange,
  isOutputVisible,
  onToggleOutput
}: PromptInputWithActionsProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)
  const [clipboardItems, setClipboardItems] = useState<string[]>([])
  const prevInputLengthRef = useRef<number>(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  const { isFeatureEnabled } = useFeature()

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

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }

    // Emit typing start event when user starts typing (first character)
    if (value.length === 1 && prevLength === 0) {
      console.log('[PromptInput] Typing started, dispatching prompt-typing-start event')
      window.dispatchEvent(new CustomEvent('prompt-typing-start', {
        detail: { inputValue: value }
      }))
    }
  }, [validationError])

  const handleSubmit = useCallback(async () => {
    // Check if we should auto-capture area
    let autoCapturedFile: File | null = null
    const isSetAreaEnabled = isFeatureEnabled('set-capture-area')

    if (isSetAreaEnabled && CaptureAreaStore.isAutoCaptureEnabled()) {
      const area = CaptureAreaStore.getArea()
      if (area && window.CaptureAPI?.takeAreaScreenshot) {
        try {
          const result = await window.CaptureAPI.takeAreaScreenshot(area)
          if (result.success && result.screenshot) {
            const response = await fetch(result.screenshot.data)
            const blob = await response.blob()
            autoCapturedFile = new File([blob], result.screenshot.name, { type: result.screenshot.type })
          }
        } catch (e) {
          console.error("Failed to auto-capture area on submit", e)
        }
      }
    }

    if (!(input.trim() || files.length > 0 || clipboardItems.length > 0 || autoCapturedFile)) return

    // Prepare message and files
    const messageParts = [...clipboardItems, input].filter(Boolean)
    const messageToSend = messageParts.join("\n\n")
    const filesToSend = [...files]

    if (autoCapturedFile) {
      filesToSend.push(autoCapturedFile)
    }

    const clipboardItemsToSend = [...clipboardItems]

    // Convert files to MediaAttachment format for validation
    const attachments = filesToSend.length > 0 ? await convertFilesToAttachments(filesToSend) : undefined

    // Check if local model is selected
    const localModel = unifiedLocalLLMService.getCurrentModel()
    const cloudModel = getSelectedModel()

    // Use cloud model for validation (local models typically don't support images)
    const modelToValidate = cloudModel || null

    // Validate message and attachments before sending
    // If local model is selected and attachments are present, it likely doesn't support images
    if (attachments && attachments.length > 0 && localModel) {
      // Show simple popup above input
      setValidationError(`${localModel.displayName} doesn't support images`)
      return // Don't send the message
    }

    // Validate message (this also checks if model is selected)
    const validation = validateMessage(messageToSend, attachments, modelToValidate)

    if (!validation.isValid) {
      // Get the first error message for simplicity
      const firstError = validation.errors[0]
      const errorMessage = firstError?.message || "This model doesn't support the requested capability"

      // Show simple popup above input
      setValidationError(errorMessage)
      return // Don't send the message
    }

    // Clear validation error if validation passes
    setValidationError(null)

    // Clear input state only after validation passes
    setInput("")
    prevInputLengthRef.current = 0
    setFiles([])
    setClipboardItems([])

    // Emit input cleared event to reset auto-screenshot
    window.dispatchEvent(new CustomEvent('prompt-input-cleared'))

    setIsLoading(true)

    try {
      if ((messageToSend.trim() || clipboardItemsToSend.length > 0 || attachments) && onSendMessage) {
        const message = messageToSend || (attachments ? "See attached images" : "")
        await onSendMessage(message, attachments)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Show error toast if sending fails
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      toast.error('Failed to send message', {
        description: errorMessage,
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
      setIsExpanded(false)
    }
  }, [input, files, clipboardItems, onSendMessage, convertFilesToAttachments, isFeatureEnabled])

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
    // Clear validation error when files are removed
    if (validationError) {
      setValidationError(null)
    }
  }, [validationError])

  const handleClipboardItemAdd = useCallback((text: string) => {
    setClipboardItems((prev) => [...prev, text])
    setIsExpanded(true)
  }, [])

  const handleRemoveClipboardItem = useCallback((index: number) => {
    setClipboardItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Drag and drop handlers for DropZone
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
  }, [])

  const handleTextDropped = useCallback((text: string) => {
    if (text.length > 200) {
      setClipboardItems((prev) => [...prev, text])
    } else {
      setInput((prev) => prev ? `${prev} ${text}` : text)
    }
    setIsExpanded(true)
  }, [setInput])

  const handleUrlDropped = useCallback((url: string) => {
    setClipboardItems((prev) => [...prev, url])
    setIsExpanded(true)
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

  // Auto-dismiss validation error after 8 seconds
  useEffect(() => {
    if (!validationError) return

    const timer = setTimeout(() => {
      setValidationError(null)
    }, 8000)

    return () => clearTimeout(timer)
  }, [validationError])

  // Hidden state - return null (RightTransparent will show the input)
  if (!isVisible) {
    return null
  }

  return (
    <DropZone
      onFilesDropped={handleFilesDropped}
      onTextDropped={handleTextDropped}
      onUrlDropped={handleUrlDropped}
      readCodeFileContents={true}
      isDarkTheme={isDarkTheme}
      className="relative w-full transition-all duration-300 ease-in-out"
    >
      <div
        ref={inputContainerRef}
        style={{ zIndex: 49 }}
      >
        {/* Validation Error Popup - appears above the input */}
        {validationError && (
          <div
            className={cn(
              "fixed z-[60] max-w-sm mx-auto left-1/2 -translate-x-1/2",
              "animate-in fade-in slide-in-from-bottom-2 duration-200",
              isExpanded ? "bottom-32" : "bottom-24"
            )}
            data-no-clickthrough
          >
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border",
                "text-sm",
                isDarkTheme
                  ? "bg-red-950/95 border-red-800 backdrop-blur-sm text-red-200"
                  : "bg-red-50/95 border-red-300 backdrop-blur-sm text-red-800"
              )}
            >
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="flex-1 text-xs leading-tight">{validationError}</p>
              <button
                onClick={() => setValidationError(null)}
                className={cn(
                  "p-0.5 rounded transition-colors shrink-0",
                  isDarkTheme
                    ? "hover:bg-red-900/50 text-red-400"
                    : "hover:bg-red-100 text-red-600"
                )}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {!isExpanded ? (
          <PromptInputCollapsed
            input={input}
            setInput={handleInputChange}
            isLoading={isLoading}
            files={files}
            clipboardItems={clipboardItems}
            onSubmit={handleSubmit}
            onStop={onStop}
            onExpand={() => setIsExpanded(true)}
            onHide={() => setIsVisible(false)}
            isDarkTheme={isDarkTheme}
            onFilesAdded={handleFilesAdded}
            onMoreClick={onMoreClick}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onClipboardItemAdd={handleClipboardItemAdd}
            onRemoveClipboardItem={handleRemoveClipboardItem}
            onThemeChange={onThemeChange}
            isOutputVisible={isOutputVisible}
            onToggleOutput={onToggleOutput}
          />
        ) : (
          <PromptInputExpanded
            input={input}
            setInput={handleInputChange}
            isLoading={isLoading}
            files={files}
            clipboardItems={clipboardItems}
            onSubmit={handleSubmit}
            onStop={onStop}
            onCollapse={() => setIsExpanded(false)}
            onHide={() => setIsVisible(false)}
            onFileChange={handleFileChange}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={handleRemoveFile}
            isDarkTheme={isDarkTheme}
            onMoreClick={onMoreClick}
            onClipboardItemAdd={handleClipboardItemAdd}
            onRemoveClipboardItem={handleRemoveClipboardItem}
            onThemeChange={onThemeChange}
            isOutputVisible={isOutputVisible}
            onToggleOutput={onToggleOutput}
          />
        )}
      </div>
    </DropZone>
  )
}
