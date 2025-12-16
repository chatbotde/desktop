import { Button } from "@/components/ui/button"
import { ArrowUp, Plus, Mic, Square, X, ChevronsUp, Paperclip, Image, Video, Music, FileText, WifiOff } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MediaUploadCard } from "./media-upload-card"
import { useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import { ClipboardPill } from "./clipboard"
import { useNetworkStatus } from "@/hooks/use-network-status"

interface PromptInputCollapsedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  clipboardItems?: string[]
  onSubmit: () => void
  onExpand: () => void
  onHide: () => void
  isDarkTheme?: boolean
  onFilesAdded?: (files: File[]) => void
  onAudioClick?: () => void
  onMoreClick?: () => void
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile?: (index: number) => void
  onClipboardItemAdd?: (text: string) => void
  onRemoveClipboardItem?: (index: number) => void
}

export function PromptInputCollapsed({
  input,
  setInput,
  isLoading,
  files,
  clipboardItems,
  onSubmit,
  onExpand,
  onHide,
  isDarkTheme = true,
  onFilesAdded,
  onAudioClick,
  onMoreClick,
  onRemoveFile,
  onClipboardItemAdd,
  onRemoveClipboardItem,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])
  const { isOnline } = useNetworkStatus()

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="relative flex items-center gap-3 mx-8 mb-0">
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
        onAdd={(content) => {
          // Handle string content (text, html text preview)
          if (typeof content === 'string') {
            onClipboardItemAdd ? onClipboardItemAdd(content) : setInput(input + (input ? " " : "") + content)
          } else if (content.text) {
            // Handle ClipboardContent object with text
            onClipboardItemAdd ? onClipboardItemAdd(content.text) : setInput(input + (input ? " " : "") + content.text)
          }
        }}
        onAddImage={(dataUrl) => {
          if (onFilesAdded) {
            // Convert data URL to File
            fetch(dataUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type: 'image/png' })
                onFilesAdded([file])
              })
              .catch(err => console.error('Failed to convert clipboard image:', err))
          }
        }}
        isDarkTheme={isDarkTheme}
      />
      <button
        onClick={onHide}
        aria-label="Hide input"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
          themeClasses.buttonBorder,
          themeClasses.buttonHover
        )}
        style={{ backgroundColor: themeClasses.buttonBg }}
        data-no-clickthrough
      >
        <X className={`size-4 ${themeClasses.icon}`} />
      </button>

      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-1 border flex-1",
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Add media"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0",
                hoverClass
              )}
            >
              <Plus className={`size-4 ${themeClasses.icon}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none mb-2" align="start">
            <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} />
          </PopoverContent>
        </Popover>



        {(files.length > 0 || (clipboardItems && clipboardItems.length > 0)) && (
          <div className="flex items-center gap-1 overflow-x-auto max-w-[100px] scrollbar-hide">
            {clipboardItems?.map((item, index) => (
              <div
                key={`clipboard-${index}`}
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
                  themeClasses.fileItem
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveClipboardItem?.(index)
                }}
                title={item}
              >
                <FileText className={`size-4 ${themeClasses.icon}`} />
              </div>
            ))}
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
                  themeClasses.fileItem
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFile?.(index)
                }}
                title={file.name}
              >
                {getFileIcon(file)}
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask anything..."
          aria-label="Message input"
          className={cn(
            "flex-1 bg-transparent text-base outline-none border-0 py-2 min-w-0",
            themeClasses.input
          )}
        />

        <button
          aria-label="Voice input"
          onClick={onAudioClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0",
            hoverClass
          )}
        >
          <Mic className={`size-4 ${themeClasses.icon}`} />
        </button>

        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-500/90 ml-2 shrink-0"
          onClick={canSubmit ? onSubmit : onExpand}
          disabled={isLoading}
          aria-label={isLoading ? "Stop generation" : canSubmit ? "Send message" : "Expand input"}
        >
          {isLoading ? (
            <Square className="size-4 fill-current" />
          ) : canSubmit ? (
            <ArrowUp className="size-4" />
          ) : (
            <ChevronsUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
