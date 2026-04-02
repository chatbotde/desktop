/**
 * Screenshot Selection Popup
 *
 * When user captures an area screenshot, this popup appears (like text selection)
 * with "Add to prompt" and "Expand to ask" so they can add the image to prompt
 * or ask AI about the screenshot in place.
 */

import { useState, useSyncExternalStore, useCallback, useRef } from 'react'

import { X } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from '@/features/text-selection/components/TextSelection'
import { TextSelectionOutput } from '@/features/text-selection/components/TextSelectionOutput'
import { AddToPromptButton } from '@/components/add-button'
import { ExpandButton } from '@/components/expand-button'
import { useFileToAttachment } from '@/components/prompt-input/hooks/use-file-to-attachment'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { cn } from '@/lib/utils'



const DIRECT_OUTPUT_INSTRUCTIONS = `
IMPORTANT: Provide DIRECT OUTPUT ONLY.
- NO conversational fillers.
- Provide ONLY the requested content itself.
- The user has shared a screenshot; answer based on the image content.
`.trim()

function wrapWithImageContext(prompt: string): string {
  const trimmed = prompt.trim()
  const imageContext = 'The user has shared a screenshot (image attached).'
  if (!trimmed) return `${DIRECT_OUTPUT_INSTRUCTIONS}\n\n${imageContext}\n\nPlease describe or analyze the screenshot.`
  return `${DIRECT_OUTPUT_INSTRUCTIONS}\n\n${imageContext}\n\nUSER REQUEST:\n${trimmed}`
}

export interface ScreenshotSelectionPopupProps {
  isDarkTheme?: boolean
}


export function ScreenshotSelectionPopup({
  isDarkTheme = true,
}: ScreenshotSelectionPopupProps) {

  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRef = useRef(false)
  const { convertFilesToAttachments } = useFileToAttachment()

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
    setFile(null)
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

  const handleAddToPrompt = useCallback(() => {
    if (!file) return
    window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
    handleClose()
  }, [file, handleClose])

  const handleGenerateInline = useCallback(async () => {
    if (!prompt.trim() || isGenerating || !file) return

    const wrappedMessage = wrapWithImageContext(prompt.trim())
    setIsGenerating(true)
    setGeneratedOutput(null)
    stopRef.current = false
    stopAutoHide()

    try {
      const attachments = await convertFilesToAttachments([file])
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
  }, [prompt, file, isGenerating, convertFilesToAttachments, stopAutoHide])

  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

  const handleCopyOutput = useCallback(() => {
    if (generatedOutput) navigator.clipboard.writeText(generatedOutput)
  }, [generatedOutput])

  // Listen for screenshot selection captured event - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
      const handler = (e: CustomEvent<{ file: File; position: { x: number; y: number } }>) => {
        const { file: f, position: pos } = e.detail || {}
        if (!f || !pos) return
        const PILL_HEIGHT = 40
        const PILL_WIDTH = 190
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
        setFile(f)
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
    useCallback((callback) => {
      if (isExpanded) stopAutoHide()
      else if (isVisible) startAutoHide()
      return () => {}
    }, [isExpanded, isVisible, startAutoHide, stopAutoHide]),
    () => null,
    () => null
  )

  // Cleanup for image preview URL - using syncExternalStore
  const imagePreviewUrl = file ? URL.createObjectURL(file) : null
  useSyncExternalStore(
    useCallback((callback) => {
      return () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      }
    }, [imagePreviewUrl]),
    () => null,
    () => null
  )

  if (!isVisible || !position) return null

  return (
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
              isExpanded ? 'rounded-xl' : 'rounded-full',
              isDarkTheme ? 'bg-zinc-950 border border-zinc-800' : 'bg-white border border-zinc-200'
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
                  className="flex items-center gap-1 p-1 whitespace-nowrap"
                >
                  <AddToPromptButton
                    onClick={handleAddToPrompt}
                    isDarkTheme={isDarkTheme}
                    tooltip="Add to prompt"
                  />
                  <div
                    className={cn(
                      'w-px h-4 mx-0.5',
                      isDarkTheme ? 'bg-zinc-800' : 'bg-slate-200/50'
                    )}
                  />
                  <ExpandButton
                    isExpanded={false}
                    onClick={() => setIsExpanded(true)}
                    isDarkTheme={isDarkTheme}
                    tooltip="Expand to ask AI"
                  />
                  <div
                    className={cn(
                      'w-px h-4 mx-0.5',
                      isDarkTheme ? 'bg-zinc-800' : 'bg-slate-200/50'
                    )}
                  />
                  <button
                    onClick={handleClose}
                    className={cn(
                      'p-1 px-1.5 rounded-full transition-all hover:scale-110 active:scale-95',
                      isDarkTheme
                        ? 'hover:bg-zinc-800 text-zinc-500 hover:text-red-400'
                        : 'hover:bg-slate-100/50 text-slate-600 hover:text-red-500'
                    )}
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
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
                  {imagePreviewUrl && (
                    <div
                      className={cn(
                        'mx-2 mt-2 rounded-md overflow-hidden border',
                        isDarkTheme ? 'border-zinc-700' : 'border-zinc-200'
                      )}
                    >
                      <img
                        src={imagePreviewUrl}
                        alt="Screenshot"
                        className="w-full max-h-20 object-contain bg-zinc-900/50"
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
                    className="bg-transparent border-none shadow-none"
                  />
                  {(generatedOutput !== null || isGenerating) && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-white/5"
                    >
                      <TextSelectionOutput
                        content={generatedOutput ?? ''}
                        isStreaming={isGenerating}
                        onCopy={handleCopyOutput}
                        isDarkTheme={isDarkTheme}
                        className="bg-transparent border-none shadow-none mt-0 mb-0"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </motion.div>
    </AnimatePresence>
  )
}
