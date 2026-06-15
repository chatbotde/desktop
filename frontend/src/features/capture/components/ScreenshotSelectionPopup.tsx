/**
 * Screenshot Selection Popup
 *
 * When user captures an area screenshot, this popup appears (like text selection)
 * with expand-to-ask so they can ask AI about the screenshot in place.
 */

import { useState, useSyncExternalStore, useCallback, useRef, useMemo, useLayoutEffect } from 'react'

import { X, Plus, Shirt } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from '@/features/text-selection/components/TextSelection'
import { TextSelectionOutput } from '@/features/text-selection/components/TextSelectionOutput'
import { ExpandButton } from '@/components/expand-button'
import { useFileToAttachment } from '@/components/prompt-input/hooks/use-file-to-attachment'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { triggerRectangleScreenshot } from '@/features/capture/lib/trigger-rectangle-screenshot'
import {
  clampPopupPosition,
  centerPopupPosition,
  getPopupEstimatedSize,
  positionNearCapture,
} from '@/features/capture/lib/screenshot-popup-position'
import { VirtualTryOnPanel } from './VirtualTryOnPanel'
import { runVirtualTryOnFromFiles, type TryOnCategory } from '@/lib/image/virtual-tryon'
import { cn } from '@/lib/utils'
import { GLOBAL_THEME } from '@/global/theme'
import { useIsDark } from '@/shared/providers'

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
          isDarkTheme ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'
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
  imageWindowEnabled?: boolean
  onTryOnStart?: () => void
  onTryOnSuccess?: (images: string[]) => void
  onTryOnError?: (message: string) => void
}

export function ScreenshotSelectionPopup({
  isDarkTheme: isDarkThemeProp,
  imageWindowEnabled = true,
  onTryOnStart,
  onTryOnSuccess,
  onTryOnError,
}: ScreenshotSelectionPopupProps) {
  const isDarkThemeFromProvider = useIsDark()
  const isDarkTheme = isDarkThemeProp ?? isDarkThemeFromProvider
  const themeColors = isDarkTheme ? GLOBAL_THEME.colors.dark : GLOBAL_THEME.colors.light
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTryOnMode, setIsTryOnMode] = useState(false)
  const [isTryOnGenerating, setIsTryOnGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
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
    setIsTryOnMode(false)
    setIsTryOnGenerating(false)
    setFiles([])
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

  const handleVirtualTryOn = useCallback(
    async (personIndex: number, garmentIndex: number, category: TryOnCategory) => {
      if (!imageWindowEnabled || isTryOnGenerating) return

      const personFile = files[personIndex]
      const garmentFile = files[garmentIndex]
      if (!personFile || !garmentFile) return

      setIsTryOnGenerating(true)
      stopAutoHide()
      onTryOnStart?.()

      try {
        const images = await runVirtualTryOnFromFiles(personFile, garmentFile, { category })
        onTryOnSuccess?.(images)
        handleClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Virtual try-on failed'
        onTryOnError?.(message)
      } finally {
        setIsTryOnGenerating(false)
      }
    },
    [
      files,
      imageWindowEnabled,
      isTryOnGenerating,
      onTryOnStart,
      onTryOnSuccess,
      onTryOnError,
      stopAutoHide,
      handleClose,
    ]
  )

  const hasTryOnAction = files.length >= 2 && imageWindowEnabled

  const getEstimatedPopupSize = useCallback(
    () =>
      getPopupEstimatedSize({
        isExpanded,
        isTryOnMode,
        hasTryOnAction,
      }),
    [isExpanded, isTryOnMode, hasTryOnAction]
  )

  const clampPositionToViewport = useCallback(
    (pos: { top: number; left: number }, size?: { width: number; height: number }) => {
      const resolvedSize = size ?? getEstimatedPopupSize()
      return clampPopupPosition(pos, resolvedSize)
    },
    [getEstimatedPopupSize]
  )

  const openTryOnMode = useCallback(() => {
    stopAutoHide()
    setIsExpanded(true)
    setIsTryOnMode(true)
    setGeneratedOutput(null)
    setPosition(centerPopupPosition(getPopupEstimatedSize({ isExpanded: true, isTryOnMode: true, hasTryOnAction: true })))
  }, [stopAutoHide, hasTryOnAction])

  const handleDragEnd = useCallback(() => {
    if (!popupRef.current) return
    const rect = popupRef.current.getBoundingClientRect()
    setPosition(
      clampPopupPosition(
        { top: rect.top, left: rect.left },
        { width: rect.width, height: rect.height }
      )
    )
  }, [])

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

        const pillSize = getPopupEstimatedSize({
          isExpanded: false,
          isTryOnMode: false,
          hasTryOnAction: imageWindowEnabled,
        })
        setFiles([f])
        setPosition(positionNearCapture(pos, pillSize))
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
    }, [stopAutoHide, imageWindowEnabled]),
    () => null,
    () => null
  )

  useLayoutEffect(() => {
    if (!isVisible || !position) return

    setPosition((prev) => {
      if (!prev) return prev
      if (isTryOnMode) {
        return centerPopupPosition(getEstimatedPopupSize())
      }
      return clampPositionToViewport(prev)
    })
  }, [isVisible, isExpanded, isTryOnMode, files.length, hasTryOnAction, clampPositionToViewport, getEstimatedPopupSize])

  useLayoutEffect(() => {
    if (!isVisible) return

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev
        if (isTryOnMode) return centerPopupPosition(getEstimatedPopupSize())
        return clampPositionToViewport(prev)
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isVisible, isTryOnMode, clampPositionToViewport, getEstimatedPopupSize])

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
    <div ref={viewportRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        <motion.div
          ref={popupRef}
          onMouseEnter={stopAutoHide}
          onMouseLeave={startAutoHide}
          drag={!isTryOnMode}
          dragMomentum={false}
          dragConstraints={viewportRef}
          dragElastic={0}
          onDragEnd={handleDragEnd}
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
            position: 'fixed',
            top: position.top,
            left: position.left,
            pointerEvents: 'auto',
            touchAction: 'none',
            maxWidth: `calc(100vw - ${32}px)`,
            maxHeight: `calc(100vh - ${32}px)`,
          }}
          className={cn(!isTryOnMode && 'cursor-grab active:cursor-grabbing')}
          data-no-clickthrough
        >
          <LayoutGroup>
            <motion.div
              layout
              className={cn(
                'relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
                isExpanded ? 'rounded-xl' : 'rounded-2xl',
                'border',
                isDarkTheme ? 'border-zinc-800' : 'border-zinc-200'
              )}
              style={{ backgroundColor: themeColors.background }}
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
                        isDarkTheme ? 'bg-zinc-800' : 'bg-zinc-200'
                      )}
                    />
                    {files.length >= 2 && imageWindowEnabled && (
                      <button
                        type="button"
                        onClick={openTryOnMode}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95',
                          isDarkTheme
                            ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500'
                            : 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-600'
                        )}
                        title="Virtual try-on with screenshots"
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        Try On
                      </button>
                    )}
                    <ExpandButton
                      isExpanded={false}
                      onClick={() => {
                        setIsTryOnMode(false)
                        setIsExpanded(true)
                        setPosition((prev) =>
                          prev
                            ? clampPositionToViewport(
                                prev,
                                getPopupEstimatedSize({
                                  isExpanded: true,
                                  isTryOnMode: false,
                                  hasTryOnAction,
                                })
                              )
                            : prev
                        )
                      }}
                      isDarkTheme={isDarkTheme}
                      size="sm"
                      tooltip="Expand to ask AI"
                    />
                    <button
                      onClick={handleClose}
                      className={cn(
                        'p-1.5 rounded-full transition-all hover:scale-110 active:scale-95',
                        isDarkTheme
                          ? 'hover:bg-zinc-800 text-zinc-400 hover:text-red-400'
                          : 'hover:bg-zinc-100 text-zinc-600 hover:text-red-500'
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
                    className="flex flex-col w-[320px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto relative"
                    style={{ backgroundColor: themeColors.background }}
                  >
                    {!isTryOnMode && (
                      <div
                        className={cn(
                          'absolute top-0 left-0 right-0 h-12 pointer-events-none',
                          isDarkTheme
                            ? 'bg-gradient-to-b from-zinc-900 to-transparent'
                            : 'bg-gradient-to-b from-zinc-50 to-transparent'
                        )}
                      />
                    )}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <button
                        onClick={handleClose}
                        className={cn(
                          'p-1 rounded-full transition-all hover:scale-110 active:scale-95 border',
                          isDarkTheme
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-red-400'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:text-red-500'
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isTryOnMode && files.length >= 2 ? (
                      <VirtualTryOnPanel
                        imagePreviewUrls={imagePreviewUrls}
                        files={files}
                        isGenerating={isTryOnGenerating}
                        onTryOn={handleVirtualTryOn}
                        onBack={() => setIsTryOnMode(false)}
                      />
                    ) : (
                      <>
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
                            {files.length >= 2 && imageWindowEnabled && (
                              <button
                                type="button"
                                onClick={openTryOnMode}
                                className={cn(
                                  'w-14 h-10 shrink-0 rounded-md border flex flex-col items-center justify-center gap-0.5 text-[9px] font-medium transition-colors',
                                  isDarkTheme
                                    ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-500'
                                    : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500'
                                )}
                                title="Virtual try-on"
                              >
                                <Shirt className="w-3.5 h-3.5" />
                                Try On
                              </button>
                            )}
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
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </motion.div>
      </AnimatePresence>

      {isExpanded && !isTryOnMode && (generatedOutput !== null || isGenerating) && position && (
        <TextSelectionOutput
          content={generatedOutput ?? ''}
          isStreaming={isGenerating}
          onCopy={handleCopyOutput}
          isDarkTheme={isDarkTheme}
          floating
          anchorPosition={{
            x: clampPositionToViewport(position).left,
            y: clampPositionToViewport(position).top,
          }}
          onClose={() => {
            setGeneratedOutput(null)
            setIsGenerating(false)
          }}
        />
      )}
    </div>
  )
}
