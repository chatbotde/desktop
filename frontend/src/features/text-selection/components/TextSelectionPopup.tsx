import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from './TextSelection'
import { TextSelectionOutput } from './TextSelectionOutput'
import { AddToPromptButton } from '@/components/add-button'
import { ReadButton } from '@/components/read-button'
import { CopyButton } from '@/components/copy-button'
import { ExpandButton } from '@/components/expand-button'
import { useFeature } from '@/contexts/FeatureContext'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { cn } from '@/lib/utils'
import { combineMessageWithSelection } from '@/services/prompts/text-selection/prompt-builder'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const { isFeatureEnabled } = useFeature()

  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const nextTimeRef = useRef<number>(0)

  const stopAutoHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoHide = useCallback(() => {
    stopAutoHide()
    // Only auto-hide if not expanded or generating or playing
    if (!isExpanded && !isGenerating && !isPlaying) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000) // 6 seconds
    }
  }, [isExpanded, isGenerating, isPlaying, stopAutoHide])

  const handleStopAudio = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { })
      audioContextRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setIsExpanded(false)
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
    handleStopAudio()
  }, [stopAutoHide, handleStopAudio])

  const handleRead = useCallback(async () => {
    if (isPlaying) {
      handleStopAudio()
      return
    }

    if (!selectionData?.text?.trim()) return

    setIsPlaying(true)
    // extend auto-hide while playing/loading
    stopAutoHide()

    try {
      const formData = new FormData()
      formData.append('text', selectionData.text)

      const response = await fetch('/api/tts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok || !response.body) {
        throw new Error('TTS Service request failed')
      }

      const reader = response.body.getReader()

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass({ latencyHint: 'interactive' })
      const ctx = audioContextRef.current

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      nextTimeRef.current = ctx.currentTime + 0.1

      let headerRead = false
      let leftoverBytes: Uint8Array | null = null
      let sampleRate = 24000

      while (true) {
        if (!audioContextRef.current) break

        const { done, value } = await reader.read()
        if (done) break

        let chunk = value || new Uint8Array(0)

        if (leftoverBytes) {
          const newChunk = new Uint8Array(leftoverBytes.length + chunk.length)
          newChunk.set(leftoverBytes)
          newChunk.set(chunk, leftoverBytes.length)
          chunk = newChunk
          leftoverBytes = null
        }

        let dataOffset = 0

        if (!headerRead) {
          if (chunk.length < 44) {
            leftoverBytes = chunk
            continue
          }

          const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          sampleRate = view.getUint32(24, true)
          // console.log("Streaming TTS: Detected sample rate:", sampleRate)

          headerRead = true
          dataOffset = 44
        }

        const bytesToProcess = chunk.length - dataOffset
        const excessBytes = bytesToProcess % 2
        if (excessBytes > 0) {
          leftoverBytes = chunk.slice(chunk.length - excessBytes)
          chunk = chunk.slice(0, chunk.length - excessBytes)
        }

        if (chunk.length <= dataOffset) continue;

        const int16Data = new Int16Array(chunk.buffer, chunk.byteOffset + dataOffset, (chunk.length - dataOffset) / 2)
        const float32Data = new Float32Array(int16Data.length)

        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0
        }

        const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate)
        audioBuffer.getChannelData(0).set(float32Data)

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)

        let startTime = nextTimeRef.current
        if (startTime < ctx.currentTime) startTime = ctx.currentTime
        source.start(startTime)

        nextTimeRef.current = startTime + audioBuffer.duration
      }

      if (audioContextRef.current) {
        const remaining = nextTimeRef.current - ctx.currentTime
        if (remaining > 0) {
          await new Promise(r => setTimeout(r, remaining * 1000))
        }
      }

    } catch (error) {
      console.error('TTS Streaming Error:', error)
    } finally {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { })
        audioContextRef.current = null
      }
      setIsPlaying(false)
      startAutoHide()
    }
  }, [selectionData, isPlaying, handleStopAudio, stopAutoHide, startAutoHide])

  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

  useEffect(() => {
    if (!isFeatureEnabled('text-selection')) {
      setIsVisible(false)
      handleStopAudio()
      return
    }

    const handleSelectionChange = (data: SelectionData) => {
      if (!isFeatureEnabled('text-selection')) return

      if (!data?.text?.trim()) {
        setIsVisible(false)
        handleStopAudio()
        return
      }

      // 1. Deciding position BEFORE appearing
      // Pill dimensions are roughly fixed: ~150x40
      const PILL_WIDTH = 190 // Reduced after commenting out audio button
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
      handleStopAudio()

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
      handleStopAudio()
    }
  }, [isFeatureEnabled, stopAutoHide, handleStopAudio])


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

    const message = combineMessageWithSelection(prompt.trim(), selectionData?.text || '')

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

  const handleCopy = useCallback(() => {
    if (selectionData?.text) {
      navigator.clipboard.writeText(selectionData.text)
    }
  }, [selectionData])

  const handleCopyOutput = useCallback(() => {
    if (generatedOutput) {
      navigator.clipboard.writeText(generatedOutput)
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
                  ? "bg-zinc-950 border border-zinc-800"
                  : "bg-white border border-zinc-200"
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
                    {/* <ReadButton
                      onClick={handleRead}
                      isDarkTheme={isDarkTheme}
                      isLoading={isPlaying}
                    />
                    <div className={cn(
                      "w-px h-4 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} /> */}
                    <CopyButton
                      onClick={handleCopy}
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
                            ? "bg-zinc-800 text-zinc-500 hover:text-red-400"
                            : "bg-slate-100/50 text-slate-600 hover:text-red-500"
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
      )}
    </AnimatePresence>
  )
}


