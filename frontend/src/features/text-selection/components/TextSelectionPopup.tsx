import { useState, useSyncExternalStore, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { TextSelectionInput } from './TextSelection'
import { TextSelectionOutput } from './TextSelectionOutput'
import { CopyButton } from '@/components/copy-button'
import { ExpandButton } from '@/components/expand-button'
import { useFeature } from '@/contexts/FeatureContext'
import { useVoiceContext } from '@/features/voice'
import { sendMessage } from '@/lib/ai'

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
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

export function TextSelectionPopup({ isDarkTheme = true }: TextSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { isFeatureEnabled } = useFeature()
  const { activeVoiceId, getVoicePath, presetVoices } = useVoiceContext()



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
      }, 10000) // 10 seconds
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

  const handleRead = useCallback(async (textOverride?: string) => {
    if (isPlaying) {
      handleStopAudio()
      return
    }

    const textToRead = textOverride || selectionData?.text
    if (!textToRead?.trim()) return

    setIsPlaying(true)
    // extend auto-hide while playing/loading
    stopAutoHide()

    try {
      const formData = new FormData()
      formData.append('text', textToRead)

      // Add voice parameters if available
      if (activeVoiceId) {
        const isPreset = presetVoices.some(v => v.id === activeVoiceId)
        if (isPreset) {
          // Preset voice name
          formData.append('voice_url', activeVoiceId)
        } else {
          // Cloned voice path
          const voicePath = getVoicePath(activeVoiceId)
          if (voicePath) {
            // We send the local absolute path as voice_url
            // the pocket-tts server will read it directly from disk
            formData.append('voice_url', voicePath)
          }
        }
      }


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

      // Add a GainNode to increase volume
      const gainNode = ctx.createGain()
      gainNode.gain.value = 20.0 // Boost volume (8.0x multiplier)
      gainNode.connect(ctx.destination)

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
        source.connect(gainNode)

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
  }, [selectionData, isPlaying, handleStopAudio, stopAutoHide, startAutoHide, activeVoiceId, getVoicePath, presetVoices])



  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

  const handleCopy = useCallback(async () => {
    if (!selectionData?.text) return
    try {
      await navigator.clipboard.writeText(selectionData.text)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }, [selectionData])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !selectionData?.text || isGenerating) return

    setIsGenerating(true)
    setGeneratedOutput(null)
    stopRef.current = false

    try {
      // Use the proper AI service to send the message
      const fullPrompt = `Context: "${selectionData.text}"\n\nUser request: ${prompt}`
      const stream = await sendMessage(fullPrompt)

      // Stream the response and accumulate text
      let result = ''
      for await (const chunk of stream) {
        if (stopRef.current) break
        result += chunk
        setGeneratedOutput(result)
      }

      setGeneratedOutput(result)
    } catch (error) {
      console.error('Generation error:', error)
      setGeneratedOutput('Error: Failed to generate response')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectionData, isGenerating])

  const handleInsert = useCallback(async () => {
    if (!generatedOutput) return
    try {
      // Send insert command to main process
      window.interfaceAPI?.sendMessage('insert-text', generatedOutput)
    } catch (error) {
      console.error('Insert failed:', error)
    }
  }, [generatedOutput])

  const handleReplace = useCallback(async () => {
    if (!generatedOutput || !selectionData?.text) return
    try {
      // Send replace command to main process
      window.interfaceAPI?.sendMessage('replace-text', {
        find: selectionData.text,
        replace: generatedOutput
      })
    } catch (error) {
      console.error('Replace failed:', error)
    }
  }, [generatedOutput, selectionData])

  const handleCopyOutput = useCallback(async () => {
    if (!generatedOutput) return
    try {
      await navigator.clipboard.writeText(generatedOutput)
    } catch (error) {
      console.error('Copy output failed:', error)
    }
  }, [generatedOutput])

  // Main selection change listener - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (!isFeatureEnabled('text-selection')) {
        setIsVisible(false)
        handleStopAudio()
        return () => {}
      }

      const handleSelectionChange = (data: SelectionData) => {
        if (!isFeatureEnabled('text-selection')) return

        if (!data?.text?.trim()) {
          setIsVisible(false)
          handleStopAudio()
          return
        }

        const PILL_WIDTH = 200
        const PILL_HEIGHT = 48
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

        let finalTop = (anchorY ?? 0) + offset
        let finalLeft = anchorX ?? 0

        if (finalTop + PILL_HEIGHT > viewportHeight - padding) {
          finalTop = (data.startTop?.y ?? anchorY ?? 0) - PILL_HEIGHT - offset
        }
        if (finalTop < padding) finalTop = padding

        if (finalLeft + PILL_WIDTH > viewportWidth - padding) {
          finalLeft = viewportWidth - PILL_WIDTH - padding
        }
        if (finalLeft < padding) finalLeft = padding

        setSelectionData(data)
        setPrompt('')
        setIsExpanded(false)
        setPosition({ top: finalTop, left: finalLeft })
        handleStopAudio()

        setIsVisible(true)

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setIsVisible(false)
        }, 10000)
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
    }, [isFeatureEnabled, stopAutoHide, handleStopAudio]),
    () => null,
    () => null
  )

  // Feature flag listener - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (!isFeatureEnabled('text-selection')) setIsVisible(false)
      return () => {}
    }, [isFeatureEnabled]),
    () => null,
    () => null
  )

  // Auto-hide when expanded - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (isExpanded) stopAutoHide()
      else if (isVisible) startAutoHide()
      return () => {}
    }, [isExpanded, isVisible, startAutoHide, stopAutoHide]),
    () => null,
    () => null
  )

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
                  ? "bg-zinc-950 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                  : "bg-white border border-blue-200/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
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
                    className="flex items-center gap-1.5 p-1.5 whitespace-nowrap"
                  >
                    {/* 
                    <ReadButton
                      onClick={() => handleRead()}
                      isDarkTheme={isDarkTheme}
                      isLoading={isPlaying}
                      size="md"
                    />
                    <div className={cn(
                      "w-px h-5 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    */}
                    <CopyButton
                      onClick={handleCopy}
                      isDarkTheme={isDarkTheme}
                      size="md"
                    />
                    <div className={cn(
                      "w-px h-5 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <ExpandButton
                      isExpanded={false}
                      onClick={() => setIsExpanded(true)}
                      isDarkTheme={isDarkTheme}
                      tooltip="Expand to ask AI"
                      size="md"
                    />
                    <div className={cn(
                      "w-px h-5 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <button
                      onClick={handleClose}
                      className={cn(
                        "p-1.5 px-2 rounded-full transition-all hover:scale-110 active:scale-95",
                        isDarkTheme
                          ? "hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                          : "hover:bg-slate-100/50 text-slate-600 hover:text-red-500"
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
                      className="bg-black border-none shadow-none"
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
                          onRead={() => {
                            if (generatedOutput) {
                              // We need to pass the content specifically for the output
                              // But handleRead uses selectionData.text by default.
                              // Let's refactor handleRead or create handleReadOutput
                              handleRead(generatedOutput)
                            }
                          }}
                          isReading={isPlaying}
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


