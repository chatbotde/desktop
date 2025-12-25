import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard } from "../media-upload-card"
import { Button } from "@/shared/components/ui/button"
import { ArrowUp, Square, X, Plus, Mic, ChevronUp, Image, FileText, Cpu, Power } from "lucide-react"
import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { ModelSelectorPopover } from "../model-selector-popover"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"
import { NetworkOfflineIndicator, SmartClipboardPill, getFileIcon, usePasteHandler, WindowActionControls } from "./prompt-shared"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { useFeature } from "@/contexts/FeatureContext"
import { ollamaService, isOllamaConfigured } from "@/lib/ai/local-llm/ollama"
import { getShowLocalModelControl, subscribeShowLocalModelControl } from "@/lib/settings/prompt-controls"

interface PromptInputExpandedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  clipboardItems?: string[]
  onSubmit: () => void
  onStop?: () => void
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
  onThemeChange?: (isDark: boolean) => void
  isOutputVisible?: boolean
  onToggleOutput?: () => void
}

const MAX_TEXTAREA_HEIGHT = 200

export function PromptInputExpanded({
  input,
  setInput,
  isLoading,
  files,
  clipboardItems,
  onSubmit,
  onStop,
  onCollapse,
  onHide,
  onRemoveFile,
  isDarkTheme = true,
  onFilesAdded,
  onAudioClick,
  onMoreClick,
  onClipboardItemAdd,
  onRemoveClipboardItem,
  onThemeChange,
  isOutputVisible,
  onToggleOutput,
}: PromptInputExpandedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])
  const { setFeatureEnabled } = useFeature()
  const imageUrlsRef = useRef<Map<File, string>>(new Map())

  // Check if a file is an auto-screenshot
  const isAutoScreenshot = (file: File): boolean => {
    return !!(file as any).__isAutoScreenshot
  }

  // Handle disabling auto-screenshot from preview
  const handleDisableAutoScreenshot = useCallback(() => {
    setFeatureEnabled('auto-screenshot', false)
  }, [setFeatureEnabled])

  // Get or create object URL for image files

  // Cleanup object URLs when files are removed
  useEffect(() => {
    const currentFiles = new Set(files)
    const urlsToCleanup: string[] = []

    imageUrlsRef.current.forEach((url, file) => {
      if (!currentFiles.has(file)) {
        urlsToCleanup.push(url)
        imageUrlsRef.current.delete(file)
      }
    })

    urlsToCleanup.forEach(url => URL.revokeObjectURL(url))

    return () => {
      // Cleanup all URLs on unmount
      imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      imageUrlsRef.current.clear()
    }
  }, [files])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  // --- Local LLM selection (Ollama) ---
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [selectedLocalModelName, setSelectedLocalModelName] = useState<string | null>(
    () => unifiedLocalLLMService.getCurrentModel()?.name ?? null
  )
  const [showLocalControlInPrompt, setShowLocalControlInPrompt] = useState<boolean>(() => getShowLocalModelControl())

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        const running = await isOllamaConfigured()
        if (cancelled) return
        setOllamaRunning(running)
        if (running) {
          const models = await ollamaService.listModels()
          if (cancelled) return
          setOllamaModels(models)
        } else {
          setOllamaModels([])
        }
      })()
    return () => {
      cancelled = true
    }
  }, [setOllamaRunning, setOllamaModels])

  useEffect(() => {
    return subscribeShowLocalModelControl((value) => setShowLocalControlInPrompt(value))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  const canSubmit = input.trim().length > 0 || files.length > 0 || (clipboardItems && clipboardItems.length > 0)


  const handlePaste = usePasteHandler(onFilesAdded)

  return (
    <div className="relative flex items-start gap-3 mx-8 mb-0 transition-all duration-300 ease-in-out" style={{ zIndex: 49 }}>
      {/* Network Status Icon - Outside and Centered */}
      <NetworkOfflineIndicator themeClasses={themeClasses} />

      <SmartClipboardPill
        onClipboardItemAdd={onClipboardItemAdd}
        setInput={setInput}
        input={input}
        onFilesAdded={onFilesAdded}
        isDarkTheme={isDarkTheme}
      />
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className={cn(
          "flex-1 rounded-2xl border px-3 py-2 transition-all duration-300 ease-in-out",
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        {files.length === 0 && (
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
        )}

        {(!!selectedLocalModelName || files.length > 0 || (clipboardItems && clipboardItems.length > 0)) && (
          <div className="flex flex-wrap gap-2 pb-1 max-h-[80px] overflow-y-auto">
            {selectedLocalModelName && (
              <div
                key={`selected-local-${selectedLocalModelName}`}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 py-1 text-xs border max-w-[260px]",
                  themeClasses.fileItem,
                  isDarkTheme ? "border-green-600" : "border-green-400"
                )}
                onClick={(e) => e.stopPropagation()}
                title={`Chat using local model: ${selectedLocalModelName}`}
              >
                <Cpu className={`size-3 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
                <span className={cn("truncate", themeClasses.fileText)}>{selectedLocalModelName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    unifiedLocalLLMService.clearModel()
                    setSelectedLocalModelName(null)
                  }}
                  aria-label="Clear local model selection"
                  className={cn("rounded-full p-0.5 transition-colors shrink-0", hoverClass)}
                  type="button"
                >
                  <X className={`size-3 ${themeClasses.icon}`} />
                </button>
              </div>
            )}

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
            {files.map((file, index) => {
              const isAuto = isAutoScreenshot(file)

              // For auto-screenshots, show expanded horizontal layout with preview
              if (isAuto) {
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-2",
                      themeClasses.fileItem
                    )}
                    onClick={e => e.stopPropagation()}
                  >
                    <Image className={`size-4 ${themeClasses.icon} shrink-0`} />

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDisableAutoScreenshot()
                        }}
                        aria-label="Disable auto-screenshot"
                        className={cn(
                          "rounded-full p-1.5 transition-colors",
                          isDarkTheme ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                        )}
                        title="Disable auto-screenshot"
                      >
                        <Power className="size-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFile(index)
                        }}
                        aria-label={`Remove ${file.name}`}
                        className={cn(
                          "rounded-full p-1 transition-colors",
                          hoverClass
                        )}
                      >
                        <X className={`size-4 ${themeClasses.icon}`} />
                      </button>
                    </div>
                  </div>
                )
              }

              // For regular files, show compact icon form
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-1 py-1 text-sm border",
                    themeClasses.fileItem
                  )}
                  onClick={e => e.stopPropagation()}
                >
                  {getFileIcon(file, themeClasses)}
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
              )
            })}
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
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none mb-2 z-[1002]" align="start">
                  <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} onThemeChange={onThemeChange} />
                </PopoverContent>
              </Popover>
            </PromptInputAction>

            <PromptInputAction tooltip="Select model">
              <ModelSelectorPopover
                isDarkTheme={isDarkTheme}
                themeClasses={themeClasses}
              />
            </PromptInputAction>

            {showLocalControlInPrompt && (
              <PromptInputAction tooltip="Local model (Ollama)">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                        hoverClass
                      )}
                      aria-label="Local model (Ollama)"
                      type="button"
                    >
                      <Cpu className={`size-5 ${themeClasses.icon}`} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(
                      "w-60 p-0 border z-[1002]",
                      isDarkTheme ? "border-zinc-700" : "border-zinc-200"
                    )}
                    style={{ backgroundColor: themeClasses.containerBg }}
                    align="start"
                    data-no-clickthrough
                  >
                    <div className="max-h-[400px] overflow-y-auto">
                      <div className="p-2">
                        {ollamaRunning === false || ollamaModels.length === 0 ? (
                          <div className={cn(
                            "px-2 py-4 text-xs text-center",
                            isDarkTheme ? "text-zinc-500" : "text-zinc-400"
                          )}>
                            {ollamaRunning === false
                              ? "Ollama is not running"
                              : "No models available"}
                          </div>
                        ) : (
                          ollamaModels.map((modelName) => {
                            const isSelected = selectedLocalModelName === modelName
                            return (
                              <button
                                key={modelName}
                                className={cn(
                                  "w-full p-1 text-left transition-colors rounded-lg mt-1",
                                  isDarkTheme
                                    ? "hover:bg-zinc-800"
                                    : "hover:bg-zinc-50",
                                  isSelected && (
                                    isDarkTheme
                                      ? "bg-green-900/30 border border-green-700"
                                      : "bg-green-50 border border-green-200"
                                  )
                                )}
                                onClick={() => {
                                  unifiedLocalLLMService.setModel(modelName)
                                  setSelectedLocalModelName(modelName)
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Cpu className={`size-3 ${themeClasses.icon}`} />
                                    <div className={cn(
                                      "font-medium text-sm truncate",
                                      themeClasses.fileText
                                    )}>
                                      {modelName}
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className={cn(
                                      "h-2 w-2 rounded-full mt-1 shrink-0",
                                      isDarkTheme ? "bg-green-400" : "bg-green-500"
                                    )} />
                                  )}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </PromptInputAction>
            )}
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
                onClick={isLoading && onStop ? onStop : onSubmit}
                disabled={!isLoading && !canSubmit}
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
      <WindowActionControls
        onHide={onHide}
        onToggleOutput={onToggleOutput}
        isOutputVisible={isOutputVisible}
        themeClasses={themeClasses}
      />
    </div>
  )
}
