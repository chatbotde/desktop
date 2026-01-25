import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from './TextSelection'
import { TextSelectionOutput } from './TextSelectionOutput'
import { AddToPromptButton } from '@/components/add-button'
import { ExpandButton } from '@/components/expand-button'
import { useFeature } from '@/contexts/FeatureContext'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { cn } from '@/lib/utils'

interface SelectionData {
  text: string
  programName?: string
  mousePosStart?: { x: number; y: number }
  mousePosEnd?: { x: number; y: number }
  startTop?: { x: number; y: number }
  endBottom?: { x: number; y: number }
  method?: number
  posLevel?: number
  [key: string]: unknown
}

interface TextSelectionPopupProps {
  onSendMessage?: (message: string) => Promise<void>
  onAddToPrompt?: (text: string) => void
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

export function TextSelectionPopup({ onAddToPrompt, isDarkTheme = true }: TextSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const { isFeatureEnabled } = useFeature()

  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRef = useRef(false)

  const stopAutoHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoHide = useCallback(() => {
    stopAutoHide()
    // Only auto-hide if not expanded or generating
    if (!isExpanded && !isGenerating) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000) // 6 seconds
    }
  }, [isExpanded, isGenerating, stopAutoHide])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setIsExpanded(false)
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

  useEffect(() => {
    if (!isFeatureEnabled('text-selection')) {
      setIsVisible(false)
      return
    }

    const handleSelectionChange = (data: SelectionData) => {
      if (!isFeatureEnabled('text-selection')) return

      if (!data?.text?.trim()) {
        setIsVisible(false)
        return
      }

      // 1. Deciding position BEFORE appearing
      // Pill dimensions are roughly fixed: ~150x40
      const PILL_WIDTH = 150
      const PILL_HEIGHT = 40
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 20
      const offset = 15

      let anchorX = data.mousePosEnd?.x ?? data.mousePosStart?.x ?? data.endBottom?.x ?? data.startTop?.x
      let anchorY = data.mousePosEnd?.y ?? data.mousePosStart?.y ?? data.endBottom?.y ?? data.startTop?.y

      const isValidCoordinate = (val: number | undefined): boolean => {
        return val !== undefined && !isNaN(val) && isFinite(val) && val >= 0
      }

      if (!isValidCoordinate(anchorX) || !isValidCoordinate(anchorY)) {
        anchorX = viewportWidth / 2
        anchorY = viewportHeight / 2
      }

      // Primary calculation for initial appearance
      let finalTop = (anchorY ?? 0) + offset
      let finalLeft = anchorX ?? 0

      // Vertical clamping based on estimated pill height
      if (finalTop + PILL_HEIGHT > viewportHeight - padding) {
        finalTop = (data.startTop?.y ?? anchorY ?? 0) - PILL_HEIGHT - offset
      }
      if (finalTop < padding) finalTop = padding

      // Horizontal clamping based on estimated pill width
      if (finalLeft + PILL_WIDTH > viewportWidth - padding) {
        finalLeft = viewportWidth - PILL_WIDTH - padding
      }
      if (finalLeft < padding) finalLeft = padding

      // Set selection data and position simultaneously to avoid flash
      setSelectionData(data)
      setPrompt('')
      setIsExpanded(false)
      setPosition({ top: finalTop, left: finalLeft })

      // Finally, set visible
      setIsVisible(true)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000)
    }

    if (window.interfaceAPI?.onMessage) {
      window.interfaceAPI.onMessage('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
    }

    return () => {
      if (window.interfaceAPI?.removeMessageListener) {
        window.interfaceAPI.removeMessageListener('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
      }
      stopAutoHide()
    }
  }, [isFeatureEnabled, stopAutoHide])

  // Only update position smoothly when state changes significantly (like expanding)
  React.useLayoutEffect(() => {
    if (!isVisible || !popupRef.current || !selectionData || !position) return

    const rect = popupRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20
    const offset = 15

    let anchorX = selectionData.mousePosEnd?.x ?? selectionData.mousePosStart?.x ?? selectionData.endBottom?.x
    let anchorY = selectionData.mousePosEnd?.y ?? selectionData.mousePosStart?.y ?? selectionData.endBottom?.y

    const isValidCoordinate = (val: number | undefined): boolean => {
      return val !== undefined && !isNaN(val) && isFinite(val) && val >= 0
    }

    if (!isValidCoordinate(anchorX) || !isValidCoordinate(anchorY)) {
      anchorX = position.left
      anchorY = position.top
    }

    const anchorTopY = selectionData.startTop?.y ?? anchorY ?? 0
    const safeAnchorY = anchorY ?? 0
    const safeAnchorTopY = anchorTopY ?? 0

    const posBelow = safeAnchorY + offset
    const posAbove = safeAnchorTopY - rect.height - offset

    let finalTop = posBelow
    let finalLeft = anchorX ?? 0

    const spaceBelow = viewportHeight - posBelow
    const spaceAbove = anchorTopY

    if (posBelow + rect.height > viewportHeight - padding) {
      if (spaceAbove > rect.height + padding || spaceAbove > spaceBelow) {
        finalTop = posAbove
      } else {
        finalTop = viewportHeight - rect.height - padding
      }
    }

    if (finalTop < padding) finalTop = padding

    if (isExpanded) {
      finalLeft = (anchorX ?? 0) - (rect.width / 2)
    } else {
      finalLeft = anchorX ?? 0
    }

    if (finalLeft + rect.width > viewportWidth - padding) {
      finalLeft = viewportWidth - rect.width - padding
    }
    if (finalLeft < padding) finalLeft = padding

    // Only update if it's a real shift (e.g. from state change) to keep it stable
    if (Math.abs(finalTop - position.top) > 1 || Math.abs(finalLeft - position.left) > 1) {
      setPosition({ top: finalTop, left: finalLeft })
    }
  }, [isVisible, isExpanded, generatedOutput, selectionData])

  useEffect(() => {
    if (!isFeatureEnabled('text-selection')) setIsVisible(false)
  }, [isFeatureEnabled])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    let message = prompt.trim()
    if (selectionData?.text) {
      message = `${message}\n\nSelected text:\n"${selectionData.text}"`
    }

    setIsGenerating(true)
    setGeneratedOutput(null)
    stopRef.current = false
    stopAutoHide()

    try {
      const localModel = unifiedLocalLLMService.getCurrentModel()
      let responseStream: AsyncGenerator<string, void, unknown>;

      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) throw new Error(init.message)
        responseStream = await unifiedLocalLLMService.sendMessage(message, undefined, localModel.name)
      } else {
        responseStream = await sendCloudMessage(message, undefined)
      }

      let fullResponse = ''
      for await (const chunk of responseStream) {
        if (stopRef.current) break
        fullResponse += chunk
        setGeneratedOutput(fullResponse)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setGeneratedOutput(`Sorry, I could not generate a response right now. (${errorMessage})`)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectionData, isGenerating, stopAutoHide])

  const handleInsert = useCallback(async () => {
    if (!generatedOutput) return
    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) return
      await tsfAPI.initialize()
      const selectedText = selectionData?.text?.trim() || ''
      let textToInsert = selectedText ? `${selectedText} ${generatedOutput}` : generatedOutput
      await tsfAPI.focusAndReplaceText(textToInsert)
    } catch (error) {
      console.error('Error inserting text:', error)
    }
  }, [generatedOutput, selectionData])

  const handleReplace = useCallback(async () => {
    if (!generatedOutput) return
    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) return
      await tsfAPI.initialize()
      await tsfAPI.focusAndReplaceText(generatedOutput)
    } catch (error) {
      console.error('Error replacing text:', error)
    }
  }, [generatedOutput])

  const handleAddToPromptSelection = () => {
    if (selectionData?.text && onAddToPrompt) {
      onAddToPrompt(selectionData.text)
      handleClose()
    }
  }

  useEffect(() => {
    if (isExpanded) stopAutoHide()
    else if (isVisible) startAutoHide()
  }, [isExpanded, isVisible, startAutoHide, stopAutoHide])

  if (!isFeatureEnabled('text-selection')) return null

  return (
    <AnimatePresence>
      {isVisible && position && (
        <motion.div
          ref={popupRef}
          onMouseEnter={stopAutoHide}
          onMouseLeave={startAutoHide}
          drag
          dragMomentum={false}
          layout
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            layout: {
              type: "spring",
              damping: 25,
              stiffness: 300,
            }
          }}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
          className="cursor-grab active:cursor-grabbing"
          data-no-clickthrough
        >
          <LayoutGroup>
            <motion.div
              layout
              className={cn(
                "relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                isExpanded ? "rounded-xl" : "rounded-full",
                isDarkTheme
                  ? "bg-zinc-950/85 border border-white/10 backdrop-blur-xl"
                  : "bg-white/95 border border-slate-200 backdrop-blur-xl"
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
                      onClick={handleAddToPromptSelection}
                      isDarkTheme={isDarkTheme}
                    />
                    <div className={cn(
                      "w-px h-4 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <ExpandButton
                      isExpanded={false}
                      onClick={() => setIsExpanded(true)}
                      isDarkTheme={isDarkTheme}
                      tooltip="Expand to ask AI"
                    />
                    <div className={cn(
                      "w-px h-4 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <button
                      onClick={handleClose}
                      className={cn(
                        "p-1 px-1.5 rounded-full transition-all hover:scale-110 active:scale-95",
                        isDarkTheme
                          ? "hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                          : "hover:bg-slate-100/50 text-slate-600 hover:text-red-500"
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
                    className="flex flex-col w-[400px] relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />

                    {/* Header/Close area */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={handleClose}
                        className={cn(
                          "p-1.5 rounded-full transition-all hover:scale-110 active:scale-95",
                          isDarkTheme
                            ? "hover:bg-white/10 text-zinc-500 hover:text-zinc-200"
                            : "hover:bg-black/5 text-zinc-400 hover:text-zinc-700"
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <TextSelectionInput
                      value={prompt}
                      onChange={setPrompt}
                      onGenerate={handleGenerate}
                      onStop={handleStop}
                      onClose={handleClose}
                      placeholder="Ask AI about this selection..."
                      isGenerating={isGenerating}
                      isDarkTheme={isDarkTheme}
                      className="bg-transparent border-none shadow-none"
                    />
                    {(generatedOutput || isGenerating) && (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-white/5"
                      >
                        <TextSelectionOutput
                          content={generatedOutput || ""}
                          isStreaming={isGenerating}
                          onInsert={handleInsert}
                          onReplace={handleReplace}
                          onCopy={() => { }}
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
      )}
    </AnimatePresence>
  )
}


