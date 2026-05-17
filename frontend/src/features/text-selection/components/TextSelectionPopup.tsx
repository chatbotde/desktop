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
import { TEXT_SELECTION_PROMPT } from '@/services/prompts/prompts/text-selection'

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

/** Each selection instance has its own isolated state */
interface SelectionInstance {
  id: string
  selectionData: SelectionData
  position: { top: number; left: number }
  isExpanded: boolean
  prompt: string
  isGenerating: boolean
  generatedOutput: string | null
  isPlaying: boolean
}

interface TextSelectionPopupProps {
  onSendMessage?: (message: string) => Promise<void>
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

let nextId = 0
function generateId(): string {
  return `sel-${Date.now()}-${nextId++}`
}

export function TextSelectionPopup({ isDarkTheme = true }: TextSelectionPopupProps) {
  const [instances, setInstances] = useState<SelectionInstance[]>([])
  const instancesRef = useRef<SelectionInstance[]>([])
  // Keep ref in sync with state
  instancesRef.current = instances

  const { isFeatureEnabled } = useFeature()
  const { activeVoiceId, getVoicePath, presetVoices } = useVoiceContext()

  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const stopRefs = useRef<Map<string, boolean>>(new Map())
  const audioContextRefs = useRef<Map<string, AudioContext>>(new Map())
  const nextTimeRefs = useRef<Map<string, number>>(new Map())

  // --- Per-instance helpers ---

  const updateInstance = useCallback((id: string, updates: Partial<SelectionInstance>) => {
    setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst))
  }, [])

  const removeInstance = useCallback((id: string) => {
    // Clean up timers
    const timer = timerRefs.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRefs.current.delete(id)
    }
    // Clean up audio
    const audioCtx = audioContextRefs.current.get(id)
    if (audioCtx) {
      audioCtx.close().catch(() => {})
      audioContextRefs.current.delete(id)
    }
    stopRefs.current.delete(id)
    nextTimeRefs.current.delete(id)

    setInstances(prev => prev.filter(inst => inst.id !== id))
  }, [])

  const stopAutoHide = useCallback((id: string) => {
    const timer = timerRefs.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRefs.current.delete(id)
    }
  }, [])

  const startAutoHide = useCallback((id: string) => {
    stopAutoHide(id)
    setInstances(prev => {
      const inst = prev.find(i => i.id === id)
      if (inst && !inst.isExpanded && !inst.isGenerating && !inst.isPlaying) {
        const timer = setTimeout(() => {
          removeInstance(id)
        }, 10000)
        timerRefs.current.set(id, timer)
      }
      return prev
    })
  }, [stopAutoHide, removeInstance])

  const handleStopAudio = useCallback((id: string) => {
    const audioCtx = audioContextRefs.current.get(id)
    if (audioCtx) {
      audioCtx.close().catch(() => {})
      audioContextRefs.current.delete(id)
    }
    updateInstance(id, { isPlaying: false })
  }, [updateInstance])

  const handleClose = useCallback((id: string) => {
    handleStopAudio(id)
    removeInstance(id)
  }, [handleStopAudio, removeInstance])

  const handleCopy = useCallback(async (id: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst?.selectionData?.text) return
    try {
      await navigator.clipboard.writeText(inst.selectionData.text)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }, [])

  const handleGenerate = useCallback(async (id: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst || !inst.prompt.trim() || !inst.selectionData?.text || inst.isGenerating) return

    updateInstance(id, { isGenerating: true, generatedOutput: null })
    stopRefs.current.set(id, false)

    try {
      const fullPrompt = `SELECTED TEXT:\n"""\n${inst.selectionData.text}\n"""\n\nUSER REQUEST:\n${inst.prompt}`
      const stream = await sendMessage(fullPrompt, undefined, {
        bypassHistory: true,
        systemPromptOverride: TEXT_SELECTION_PROMPT.prompt
      })

      let result = ''
      for await (const chunk of stream) {
        if (stopRefs.current.get(id)) break
        result += chunk
        updateInstance(id, { generatedOutput: result })
      }

      updateInstance(id, { generatedOutput: result })
    } catch (error) {
      console.error('Generation error:', error)
      updateInstance(id, { generatedOutput: 'Error: Failed to generate response' })
    } finally {
      updateInstance(id, { isGenerating: false })
    }
  }, [updateInstance])

  const handleStop = useCallback((id: string) => {
    stopRefs.current.set(id, true)
  }, [])

  const handleInsert = useCallback(async (id: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst?.generatedOutput) return
    try {
      await window.tsfAPI?.focusAndInsertText(inst.generatedOutput)
    } catch (error) {
      console.error('Insert failed:', error)
    }
  }, [])

  const handleReplace = useCallback(async (id: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst?.generatedOutput) return
    try {
      await window.tsfAPI?.focusAndReplaceText(inst.generatedOutput)
    } catch (error) {
      console.error('Replace failed:', error)
    }
  }, [])

  const handleCopyOutput = useCallback(async (id: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst?.generatedOutput) return
    try {
      await navigator.clipboard.writeText(inst.generatedOutput)
    } catch (error) {
      console.error('Copy output failed:', error)
    }
  }, [])

  const handleRead = useCallback(async (id: string, textOverride?: string) => {
    const inst = instancesRef.current.find(i => i.id === id)
    if (!inst) return

    if (inst.isPlaying) {
      handleStopAudio(id)
      return
    }

    const textToRead = textOverride || inst.selectionData?.text
    if (!textToRead?.trim()) return

    updateInstance(id, { isPlaying: true })
    stopAutoHide(id)

    try {
      const formData = new FormData()
      formData.append('text', textToRead)

      // Add voice parameters if available
      if (activeVoiceId) {
        const isPreset = presetVoices.some(v => v.id === activeVoiceId)
        if (isPreset) {
          formData.append('voice_url', activeVoiceId)
        } else {
          const voicePath = getVoicePath(activeVoiceId)
          if (voicePath) {
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
      const audioCtx = new AudioContextClass({ latencyHint: 'interactive' })
      audioContextRefs.current.set(id, audioCtx)

      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 20.0
      gainNode.connect(audioCtx.destination)

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }

      nextTimeRefs.current.set(id, audioCtx.currentTime + 0.1)

      let headerRead = false
      let leftoverBytes: Uint8Array | null = null
      let sampleRate = 24000

      while (true) {
        if (!audioContextRefs.current.has(id)) break

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

        const audioBuffer = audioCtx.createBuffer(1, float32Data.length, sampleRate)
        audioBuffer.getChannelData(0).set(float32Data)

        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(gainNode)

        const nextTime = nextTimeRefs.current.get(id) ?? audioCtx.currentTime
        let startTime = nextTime
        if (startTime < audioCtx.currentTime) startTime = audioCtx.currentTime
        source.start(startTime)

        nextTimeRefs.current.set(id, startTime + audioBuffer.duration)
      }

      if (audioContextRefs.current.has(id)) {
        const remaining = (nextTimeRefs.current.get(id) ?? 0) - audioCtx.currentTime
        if (remaining > 0) {
          await new Promise(r => setTimeout(r, remaining * 1000))
        }
      }

    } catch (error) {
      console.error('TTS Streaming Error:', error)
    } finally {
      const audioCtx = audioContextRefs.current.get(id)
      if (audioCtx) {
        audioCtx.close().catch(() => {})
        audioContextRefs.current.delete(id)
      }
      updateInstance(id, { isPlaying: false })
      startAutoHide(id)
    }
  }, [handleStopAudio, stopAutoHide, startAutoHide, updateInstance, activeVoiceId, getVoicePath, presetVoices])

  // Main selection change listener - using syncExternalStore
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = useRef<SelectionData | null>(null)

  useSyncExternalStore(
    useCallback(() => {
      if (!isFeatureEnabled('text-selection')) {
        setInstances([])
        return () => {}
      }

      const commitSelection = () => {
        const data = pendingDataRef.current
        if (!data) return
        pendingDataRef.current = null

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

        const newInstance: SelectionInstance = {
          id: generateId(),
          selectionData: data,
          position: { top: finalTop, left: finalLeft },
          isExpanded: false,
          prompt: '',
          isGenerating: false,
          generatedOutput: null,
          isPlaying: false,
        }

        setInstances(prev => {
          // Cap at 5 selections to avoid clutter
          const updated = [...prev, newInstance]
          if (updated.length > 5) {
            // Remove the oldest non-expanded, non-generating instance
            const removeIdx = updated.findIndex(i => !i.isExpanded && !i.isGenerating)
            if (removeIdx !== -1) {
              const removed = updated[removeIdx]
              // Clean up the removed instance
              const timer = timerRefs.current.get(removed.id)
              if (timer) {
                clearTimeout(timer)
                timerRefs.current.delete(removed.id)
              }
              updated.splice(removeIdx, 1)
            }
          }
          return updated
        })

        // Start auto-hide timer for the new instance
        const timer = setTimeout(() => {
          // Only auto-dismiss if not expanded/generating
          setInstances(prev => {
            const inst = prev.find(i => i.id === newInstance.id)
            if (inst && !inst.isExpanded && !inst.isGenerating && !inst.isPlaying) {
              return prev.filter(i => i.id !== newInstance.id)
            }
            return prev
          })
        }, 10000)
        timerRefs.current.set(newInstance.id, timer)
      }

      const handleSelectionChange = (data: SelectionData) => {
        if (!isFeatureEnabled('text-selection')) return

        if (!data?.text?.trim()) {
          return // Don't dismiss existing selections on empty text
        }

        // Debounce: the backend fires multiple events per selection.
        // Buffer the latest data and commit after 300ms of silence.
        pendingDataRef.current = data
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(commitSelection, 300)
      }

      if (window.interfaceAPI?.onMessage) {
        window.interfaceAPI.onMessage('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
      }

      return () => {
        if (window.interfaceAPI?.removeMessageListener) {
          window.interfaceAPI.removeMessageListener('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
        }
        // Clean up debounce timer
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        // Clean up all timers
        timerRefs.current.forEach(timer => clearTimeout(timer))
        timerRefs.current.clear()
        // Clean up all audio contexts
        audioContextRefs.current.forEach(ctx => ctx.close().catch(() => {}))
        audioContextRefs.current.clear()
      }
    }, [isFeatureEnabled]),
    () => null,
    () => null
  )

  // Feature flag listener - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (!isFeatureEnabled('text-selection')) setInstances([])
      return () => {}
    }, [isFeatureEnabled]),
    () => null,
    () => null
  )

  if (!isFeatureEnabled('text-selection')) return null

  return (
    <AnimatePresence>
      {instances.map((inst) => (
        <motion.div
          key={inst.id}
          onMouseEnter={() => stopAutoHide(inst.id)}
          onMouseLeave={() => startAutoHide(inst.id)}
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
            top: inst.position.top,
            left: inst.position.left,
            zIndex: 9999,
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
          className="cursor-grab active:cursor-grabbing"
          data-no-clickthrough
        >
          <LayoutGroup id={inst.id}>
            <motion.div
              layout
              className={cn(
                "relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                inst.isExpanded ? "rounded-xl" : "rounded-full",
                isDarkTheme
                  ? "bg-zinc-950 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                  : "bg-white border border-blue-200/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {!inst.isExpanded ? (
                  <motion.div
                    key="pill"
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 p-1.5 whitespace-nowrap"
                  >
                    <CopyButton
                      onClick={() => handleCopy(inst.id)}
                      isDarkTheme={isDarkTheme}
                      size="md"
                    />
                    <div className={cn(
                      "w-px h-5 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <ExpandButton
                      isExpanded={false}
                      onClick={() => {
                        updateInstance(inst.id, { isExpanded: true })
                        stopAutoHide(inst.id)
                      }}
                      isDarkTheme={isDarkTheme}
                      tooltip="Expand to ask AI"
                      size="md"
                    />
                    <div className={cn(
                      "w-px h-5 mx-0.5",
                      isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
                    )} />
                    <button
                      onClick={() => handleClose(inst.id)}
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
                        onClick={() => handleClose(inst.id)}
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
                      value={inst.prompt}
                      onChange={(val) => updateInstance(inst.id, { prompt: val })}
                      onGenerate={() => handleGenerate(inst.id)}
                      onStop={() => handleStop(inst.id)}
                      onClose={() => handleClose(inst.id)}
                      placeholder="Ask AI about this selection..."
                      isGenerating={inst.isGenerating}
                      isDarkTheme={isDarkTheme}
                      className="bg-black border-none shadow-none"
                    />
                    {(inst.generatedOutput || inst.isGenerating) && (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-white/5"
                      >
                        <TextSelectionOutput
                          content={inst.generatedOutput || ""}
                          isStreaming={inst.isGenerating}
                          onInsert={() => handleInsert(inst.id)}
                          onReplace={() => handleReplace(inst.id)}
                          onCopy={() => handleCopyOutput(inst.id)}
                          onRead={() => {
                            if (inst.generatedOutput) {
                              handleRead(inst.id, inst.generatedOutput)
                            }
                          }}
                          isReading={inst.isPlaying}
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
      ))}
    </AnimatePresence>
  )
}


