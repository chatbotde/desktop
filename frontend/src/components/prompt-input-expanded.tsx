import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MediaUploadCard } from "./media-upload-card"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip, Square, X, Plus, Mic, ChevronUp, Image, Video, Music, FileText, WifiOff, Wifi } from "lucide-react"
import { useRef, useEffect, useMemo, useCallback } from "react"
import { ModelSelectorPopover } from "./model-selector-popover"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import { ClipboardPill } from "./clipboard"
import { useNetworkStatus } from "@/hooks/use-network-status"

interface PromptInputExpandedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  clipboardItems?: string[]
  onSubmit: () => void
  onCollapse: () => void
  onHide: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  isDarkTheme?: boolean
  onFilesAdded?: (files: File[]) => void
  onAudioClick?: () => void
  onMoreClick?: () => void
  onClipboardItemAdd?: (text: string) => void
  onRemoveClipboardItem?: (index: number) => void
}

const MAX_TEXTAREA_HEIGHT = 200

export function PromptInputExpanded({
  input,
  setInput,
  isLoading,
  files,
  clipboardItems,
  onSubmit,
  onCollapse,
  onHide,
  onRemoveFile,
  isDarkTheme = true,
  onFilesAdded,
  onAudioClick,
  onMoreClick,
  onClipboardItemAdd,
  onRemoveClipboardItem,
}: PromptInputExpandedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  const canSubmit = input.trim().length > 0 || files.length > 0 || (clipboardItems && clipboardItems.length > 0)
  const getFileIcon = (file: File) => {
    const fileType = file.type.toLowerCase()

    if (fileType.startsWith('image/')) {
      return <Image className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else if (fileType.startsWith('video/')) {
      return <Video className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else if (fileType.startsWith('audio/')) {
      return <Music className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else {
      return <Paperclip className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    }
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const pastedFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) {
          pastedFiles.push(file)
        }
      }
    }

    if (pastedFiles.length > 0 && onFilesAdded) {
      e.preventDefault()
      onFilesAdded(pastedFiles)
    }
  }, [onFilesAdded])

  return (
    <div className="relative flex items-start gap-3 mx-4 mb-0">
      {/* Network Status Icon - Outside and Centered */}
      {!isOnline && (
        <div
          className={cn(
            "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full mb-2",
            "flex h-8 w-8 items-center justify-center rounded-full shrink-0 z-50",
            "opacity-90"
          )}
          title="No Internet Connection"
          aria-label="No Internet Connection"
        >
          <WifiOff className={`size-5 ${themeClasses.icon} text-red-500`} />
        </div>
      )}

      <ClipboardPill
        onAdd={(text) => onClipboardItemAdd ? onClipboardItemAdd(text) : setInput(input + (input ? " " : "") + text)}
        isDarkTheme={isDarkTheme}
      />
      <button
        onClick={onHide}
        aria-label="Hide input"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0 mt-2 border",
          themeClasses.buttonBorder,
          themeClasses.buttonHover
        )}
        style={{ backgroundColor: themeClasses.buttonBg }}
      >
        <X className={`size-4 ${themeClasses.icon}`} />
      </button>

      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className={cn(
          "flex-1 rounded-2xl border px-3 py-2",
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <button
          onClick={onCollapse}
          aria-label="Collapse input"
          className={cn(
            "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors",
            hoverClass
          )}
        >
          <ChevronUp className={`size-4 ${themeClasses.icon} rotate-180`} />
        </button>

        {(files.length > 0 || (clipboardItems && clipboardItems.length > 0)) && (
          <div className="flex flex-wrap gap-2 pb-1 max-h-[80px] overflow-y-auto">
            {clipboardItems?.map((item, index) => (
              <div
                key={`clipboard-${index}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1 text-sm border max-w-[200px]",
                  themeClasses.fileItem
                )}
                onClick={e => e.stopPropagation()}
                title={item}
              >
                <FileText className={`size-4 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
                <button
                  onClick={() => onRemoveClipboardItem?.(index)}
                  aria-label={`Remove clipboard item`}
                  className={cn(
                    "rounded-full p-0.5 transition-colors shrink-0",
                    hoverClass
                  )}
                >
                  <X className={`size-3 ${themeClasses.icon}`} />
                </button>
              </div>
            ))}
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-1 py-1 text-sm border",
                  themeClasses.fileItem
                )}
                onClick={e => e.stopPropagation()}
              >
                {getFileIcon(file)}
                <button
                  onClick={() => onRemoveFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className={cn(
                    "rounded-full p-1 transition-colors",
                    hoverClass
                  )}
                >
                  <X className={`size-4 ${themeClasses.icon}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask me anything..."
          aria-label="Message input"
          className={cn(
            "w-full bg-transparent border-0 focus:outline-none focus:ring-0 min-h-[20px] max-h-[200px] overflow-y-auto resize-none px-0 py-0",
            themeClasses.textarea
          )}
          rows={1}
        />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-0">
          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Add action">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Add action"
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      hoverClass
                    )}
                  >
                    <Plus className={`size-5 ${themeClasses.icon}`} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none mb-2" align="start">
                  <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} />
                </PopoverContent>
              </Popover>
            </PromptInputAction>

            <PromptInputAction tooltip="Select model">
              <ModelSelectorPopover
                isDarkTheme={isDarkTheme}
                themeClasses={themeClasses}
              />
            </PromptInputAction>
          </div>

          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Voice input">
              <button
                aria-label="Voice input"
                onClick={onAudioClick}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  hoverClass
                )}
              >
                <Mic className={`size-5 ${themeClasses.icon}`} />
              </button>
            </PromptInputAction>

            <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-500/90"
                onClick={onSubmit}
                disabled={!canSubmit || isLoading}
                aria-label={isLoading ? "Stop generation" : "Send message"}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </div>
        </PromptInputActions>
      </PromptInput>
    </div>
  )
}
