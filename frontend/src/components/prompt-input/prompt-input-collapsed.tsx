import { Button } from "@/shared/components/ui/button"
import { ArrowUp, Plus, Mic, Square, ChevronsUp, FileText } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard } from "../media-upload-card"
import { useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import { NetworkOfflineIndicator, SmartClipboardPill, getFileIcon, usePasteHandler, WindowActionControls } from "./prompt-shared"


interface PromptInputCollapsedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  clipboardItems?: string[]
  onSubmit: () => void
  onStop?: () => void
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
  onThemeChange?: (isDark: boolean) => void
  isOutputVisible?: boolean
  onToggleOutput?: () => void
}

export function PromptInputCollapsed({
  input,
  setInput,
  isLoading,
  files,
  clipboardItems,
  onSubmit,
  onStop,
  onExpand,
  onHide,
  isDarkTheme = true,
  onFilesAdded,
  onAudioClick,
  onMoreClick,
  onRemoveFile,
  onClipboardItemAdd,
  onRemoveClipboardItem,
  onThemeChange,
  isOutputVisible,
  onToggleOutput,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  const canSubmit = input.trim().length > 0 || files.length > 0 || (clipboardItems && clipboardItems.length > 0)



  const handlePaste = usePasteHandler(onFilesAdded)

  return (
    <div className="relative flex items-center gap-2 mx-0 mb-0 transition-all duration-300 ease-in-out" style={{ zIndex: 49 }}>
      {/* Network Status Icon - Outside and Centered */}
      <NetworkOfflineIndicator themeClasses={themeClasses} />

      <SmartClipboardPill
        onClipboardItemAdd={onClipboardItemAdd}
        setInput={setInput}
        input={input}
        onFilesAdded={onFilesAdded}
        isDarkTheme={isDarkTheme}
      />
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-1 border flex-1 transition-all duration-300 ease-in-out",
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
            <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} onThemeChange={onThemeChange} />
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
                {getFileIcon(file, themeClasses)}
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
          onClick={
            isLoading && onStop
              ? onStop
              : canSubmit
                ? onSubmit
                : () => {
                  if (typeof onExpand === "function") {
                    onExpand();
                  }
                }
          }
          disabled={!isLoading && !canSubmit && !onExpand}
          aria-label={
            isLoading
              ? "Stop generation"
              : canSubmit
                ? "Send message"
                : "Expand input"
          }
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
      <WindowActionControls
        onHide={onHide}
        onToggleOutput={onToggleOutput}
        isOutputVisible={isOutputVisible}
        themeClasses={themeClasses}
      />
    </div>
  )
}
