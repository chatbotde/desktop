/**
 * Screenshot Selection Popup
 *
 * When user captures an area screenshot, this popup appears (like text selection)
 * with expand-to-ask so they can ask AI about the screenshot in place.
 */

import { useState, useSyncExternalStore, useCallback, useRef, useMemo } from 'react'

import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from '@/features/text-selection/components/TextSelection'
import { TextSelectionOutput } from '@/features/text-selection/components/TextSelectionOutput'
import { ExpandButton } from '@/components/expand-button'
import { useFileToAttachment } from '@/components/prompt-input/hooks/use-file-to-attachment'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { triggerRectangleScreenshot } from '@/features/capture/lib/trigger-rectangle-screenshot'
import { cn } from '@/lib/utils'

const DIRECT_OUTPUT_INSTRUCTIONS = `
IMPORTANT: Provide DIRECT OUTPUT ONLY.
- NO conversational fillers.
- Provide ONLY the requested content itself.
- The user has shared a screenshot; answer based on the image content.
`.trim()

function AddScreenshotSlot({
  onClick,
  isDarkTheme,
  className,
}: {
  onClick: () => void
  isDarkTheme: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'shrink-0 rounded-md border border-dashed flex items-center justify-center transition-colors',
        isDarkTheme
          ? 'border-zinc-600 hover:border-blue-500/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-blue-300'
          : 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50/50 text-zinc-500 hover:text-blue-600',
        className
      )}
      title="Add another screenshot"
    >
      <Plus className="w-4 h-4" />
    </button>
  )
}

function wrapWithImageContext(prompt: string, imageCount: number): string {
  const trimmed = prompt.trim()
  const imageContext =
    imageCount > 1
      ? `The user has shared ${imageCount} screenshots (images attached).`
      : 'The user has shared a screenshot (image attached).'
  if (!trimmed) {
    return `${DIRECT_OUTPUT_INSTRUCTIONS}\n\n${imageContext}\n\nPlease describe or analyze the screenshot${imageCount > 1 ? 's' : ''}.`
  }
  return `${DIRECT_OUTPUT_INSTRUCTIONS}\n\n${imageContext}\n\nUSER REQUEST:\n${trimmed}`
}

function ScreenshotThumbnail({
  src,
  alt,
  isDarkTheme,
  className,
  onRemove,
  compact = false,
}: {
  src: string
  alt: string
  isDarkTheme: boolean
  className?: string
  onRemove?: () => void
  compact?: boolean
}) {
  return (
    <div className={cn('relative shrink-0 group', className)}>
      <div
        className={cn(
          'w-full h-full rounded overflow-hidden border',
          isDarkTheme ? 'border-zinc-700 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'
        )}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onRemove()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            'absolute top-0.5 right-0.5 z-10 flex items-center justify-center rounded-full',
            compact ? 'w-3 h-3' : 'w-3.5 h-3.5',
            'bg-black/70 text-white shadow-sm backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 active:scale-95'
          )}
          title="Remove image"
        >
          <X className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

export interface ScreenshotSelectionPopupProps {
  isDarkTheme?: boolean
}

export function ScreenshotSelectionPopup({
  isDarkTheme = true,
}: ScreenshotSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRef = useRef(false)
  const { convertFilesToAttachments } = useFileToAttachment()

  const imagePreviewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  )

  const stopAutoHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoHide = useCallback(() => {
    stopAutoHide()
    if (!isExpanded && !isGenerating) {
      timerRef.current = setTimeout(() => setIsVisible(false), 6000)
    }
  }, [isExpanded, isGenerating, stopAutoHide])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setIsExpanded(false)
    setFiles([])
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

  const handleAddMoreScreenshot = useCallback(() => {
    stopAutoHide()
    setIsVisible(false)
    triggerRectangleScreenshot({
      append: true,
      onComplete: () => {
        setIsVisible(true)
        startAutoHide()
      },
    })
  }, [stopAutoHide, startAutoHide])

  const handleRemoveImage = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index)
      if (next.length === 0) {
        handleClose()
        return
      }
      setFiles(next)
      setGeneratedOutput(null)
    },
    [files, handleClose]
  )

  const handleGenerateInline = useCallback(async () => {
    if (!prompt.trim() || isGenerating || files.length === 0) return

    const wrappedMessage = wrapWithImageContext(prompt.trim(), files.length)
    setIsGenerating(true)
    setGeneratedOutput(null)
    stopRef.current = false
    stopAutoHide()

    try {
      const attachments = await convertFilesToAttachments(files)
      const localModel = unifiedLocalLLMService.getCurrentModel()
      let responseStream: AsyncGenerator<string, void, unknown>

      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) throw new Error(init.message)
        responseStream = await unifiedLocalLLMService.sendMessage(
          wrappedMessage,
          attachments,
          localModel.name
        )
      } else {
        responseStream = await sendCloudMessage(wrappedMessage, attachments)
      }

      let fullResponse = ''
      for await (const chunk of responseStream) {
        if (stopRef.current) break
        fullResponse += chunk
        setGeneratedOutput(fullResponse)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setGeneratedOutput(`Sorry, I could not generate a response. (${errorMessage})`)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, files, isGenerating, convertFilesToAttachments, stopAutoHide])

  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

  const handleCopyOutput = useCallback(() => {
    if (generatedOutput) navigator.clipboard.writeText(generatedOutput)
  }, [generatedOutput])

  // Listen for screenshot selection captured event - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      const handler = (
        e: CustomEvent<{
          file: File
          position: { x: number; y: number }
          append?: boolean
        }>
      ) => {
        const { file: f, position: pos, append } = e.detail || {}
        if (!f || !pos) return

        if (append) {
          setFiles((prev) => [...prev, f])
          setIsExpanded(false)
          setGeneratedOutput(null)
          setIsVisible(true)
          stopAutoHide()
          timerRef.current = setTimeout(() => setIsVisible(false), 6000)
          return
        }

        const PILL_HEIGHT = 56
        const PILL_WIDTH = 220
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const padding = 20
        const offset = 15
        let top = pos.y + offset
        let left = pos.x
        if (top + PILL_HEIGHT > viewportHeight - padding) top = pos.y - PILL_HEIGHT - offset
        if (top < padding) top = padding
        if (left + PILL_WIDTH > viewportWidth - padding) left = viewportWidth - PILL_WIDTH - padding
        if (left < padding) left = padding
        setFiles([f])
        setPosition({ top, left })
        setIsExpanded(false)
        setPrompt('')
        setGeneratedOutput(null)
        setIsVisible(true)
        stopAutoHide()
        timerRef.current = setTimeout(() => setIsVisible(false), 6000)
      }
      window.addEventListener('screenshot-selection-captured', handler as EventListener)
      return () => {
        window.removeEventListener('screenshot-selection-captured', handler as EventListener)
        stopAutoHide()
      }
    }, [stopAutoHide]),
    () => null,
    () => null
  )

  // Auto-hide effect when expanded changes - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (isExpanded) stopAutoHide()
      else if (isVisible) startAutoHide()
      return () => {}
    }, [isExpanded, isVisible, startAutoHide, stopAutoHide]),
    () => null,
    () => null
  )

  // Cleanup for image preview URLs - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      return () => {
        imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }, [imagePreviewUrls]),
    () => null,
    () => null
  )

  if (!isVisible || !position) return null

  const visibleThumbnails = imagePreviewUrls.slice(0, 3)
  const extraCount = files.length - visibleThumbnails.length

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={popupRef}
          onMouseEnter={stopAutoHide}
          onMouseLeave={startAutoHide}
          drag
          dragMomentum={false}
          layout
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
          className="cursor-grab active:cursor-grabbing"
          data-no-clickthrough
        >
          <LayoutGroup>
            <motion.div
              layout
              className={cn(
                'relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
                isExpanded ? 'rounded-xl' : 'rounded-2xl',
                isDarkTheme
                  ? 'bg-zinc-950/95 border border-zinc-800 backdrop-blur-md'
                  : 'bg-white/95 border border-zinc-200 backdrop-blur-md'
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {!isExpanded ? (
                  <motion.div
                    key="pill"
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-2 py-1.5 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {visibleThumbnails.map((url, index) => (
                        <ScreenshotThumbnail
                          key={`${files[index]?.name ?? 'shot'}-${index}`}
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          isDarkTheme={isDarkTheme}
                          className="w-14 h-10"
                          compact
                          onRemove={() => handleRemoveImage(index)}
                        />
                      ))}
                      {extraCount > 0 && (
                        <div
                          className={cn(
                            'w-14 h-10 shrink-0 rounded-md flex items-center justify-center text-xs font-medium border',
                            isDarkTheme
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                              : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                          )}
                        >
                          +{extraCount}
                        </div>
                      )}
                      <AddScreenshotSlot
                        onClick={handleAddMoreScreenshot}
                        isDarkTheme={isDarkTheme}
                        className="w-14 h-10"
                      />
                    </div>
                    <div
                      className={cn(
                        'w-px h-7 mx-0.5',
                        isDarkTheme ? 'bg-zinc-800' : 'bg-slate-200/50'
                      )}
                    />
                    <ExpandButton
                      isExpanded={false}
                      onClick={() => setIsExpanded(true)}
                      isDarkTheme={isDarkTheme}
                      size="sm"
                      tooltip="Expand to ask AI"
                    />
                    <button
                      onClick={handleClose}
                      className={cn(
                        'p-1.5 rounded-full transition-all hover:scale-110 active:scale-95',
                        isDarkTheme
                          ? 'hover:bg-zinc-800 text-zinc-500 hover:text-red-400'
                          : 'hover:bg-slate-100/50 text-slate-600 hover:text-red-500'
                      )}
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col w-[320px] relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <button
                        onClick={handleClose}
                        className={cn(
                          'p-1 rounded-full transition-all hover:scale-110 active:scale-95',
                          isDarkTheme
                            ? 'bg-zinc-800 text-zinc-500 hover:text-red-400'
                            : 'bg-slate-100/50 text-slate-600 hover:text-red-500'
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {imagePreviewUrls.length > 0 && (
                      <div className="mx-2 mt-2 flex items-center gap-1.5 flex-wrap">
                        {imagePreviewUrls.map((url, index) => (
                          <ScreenshotThumbnail
                            key={`${files[index]?.name ?? 'shot'}-${index}`}
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            isDarkTheme={isDarkTheme}
                            className="w-14 h-10"
                            onRemove={() => handleRemoveImage(index)}
                          />
                        ))}
                        <AddScreenshotSlot
                          onClick={handleAddMoreScreenshot}
                          isDarkTheme={isDarkTheme}
                          className="w-14 h-10"
                        />
                      </div>
                    )}
                    <TextSelectionInput
                      value={prompt}
                      onChange={setPrompt}
                      onGenerate={handleGenerateInline}
                      onStop={handleStop}
                      onClose={handleClose}
                      placeholder="Ask AI about this screenshot..."
                      isGenerating={isGenerating}
                      isDarkTheme={isDarkTheme}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </motion.div>
      </AnimatePresence>

      {isExpanded && (generatedOutput !== null || isGenerating) && (
        <TextSelectionOutput
          content={generatedOutput ?? ''}
          isStreaming={isGenerating}
          onCopy={handleCopyOutput}
          isDarkTheme={isDarkTheme}
          floating
          anchorPosition={{ x: position.left, y: position.top }}
          onClose={() => {
            setGeneratedOutput(null)
            setIsGenerating(false)
          }}
        />
      )}
    </>
  )
}
