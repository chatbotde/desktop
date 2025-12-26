

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"

import { cn } from "@/shared/lib"
import { Button } from '@/shared/components/ui/button'
import { Mic, Square, Loader2, Check, AlertCircle, X } from "lucide-react"
import { createPrerecordedService, isAssemblyAIConfigured } from "@/lib/audio"
import { sendMessageComplete as sendCloudMessageComplete } from "@/lib/ai"
import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { buildVoiceRewritePromptFromTranscription } from "@/lib/prompt"


export type LiveWaveformProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  processing?: boolean
  deviceId?: string
  barWidth?: number
  barHeight?: number
  barGap?: number
  barRadius?: number
  barColor?: string
  fadeEdges?: boolean
  fadeWidth?: number
  height?: string | number
  sensitivity?: number
  smoothingTimeConstant?: number
  fftSize?: number
  historySize?: number
  updateRate?: number
  mode?: "scrolling" | "static"
  onError?: (error: Error) => void
  onStreamReady?: (stream: MediaStream) => void
  onStreamEnd?: () => void
}
export const LiveWaveform = ({
  active = false,
  processing = false,
  deviceId,
  barWidth = 3,
  barGap = 1,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight: baseBarHeight = 4,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 30,
  mode = "static",
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  ...props
}: LiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<number[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)
  const processingAnimationRef = useRef<number | null>(null)
  const lastActiveDataRef = useRef<number[]>([])
  const transitionProgressRef = useRef(0)
  const staticBarsRef = useRef<number[]>([])
  const needsRedrawRef = useRef(true)
  const gradientCacheRef = useRef<CanvasGradient | null>(null)
  const lastWidthRef = useRef(0)
  const heightStyle = typeof height === "number" ? `${height}px` : height
  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
      gradientCacheRef.current = null
      lastWidthRef.current = rect.width
      needsRedrawRef.current = true
    })
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])
  useEffect(() => {
    if (processing && !active) {
      let time = 0
      transitionProgressRef.current = 0
      const animateProcessing = () => {
        time += 0.03
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02
        )
        const processingData = []
        const barCount = Math.floor(
          (containerRef.current?.getBoundingClientRect().width || 200) /
          (barWidth + barGap)
        )
        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2)
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - halfCount) / halfCount
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4
            const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25
            const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2
            const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight
            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.min(
                i,
                lastActiveDataRef.current.length - 1
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }
            processingData.push(Math.max(0.05, Math.min(1, finalValue)))
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - barCount / 2) / (barCount / 2)
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4
            const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25
            const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2
            const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight
            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.floor(
                (i / barCount) * lastActiveDataRef.current.length
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }
            processingData.push(Math.max(0.05, Math.min(1, finalValue)))
          }
        }
        if (mode === "static") {
          staticBarsRef.current = processingData
        } else {
          historyRef.current = processingData
        }
        needsRedrawRef.current = true
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing)
      }
      animateProcessing()
      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current)
        }
      }
    } else if (!active && !processing) {
      const hasData =
        mode === "static"
          ? staticBarsRef.current.length > 0
          : historyRef.current.length > 0
      if (hasData) {
        let fadeProgress = 0
        const fadeToIdle = () => {
          fadeProgress += 0.03
          if (fadeProgress < 1) {
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(
                (value) => value * (1 - fadeProgress)
              )
            } else {
              historyRef.current = historyRef.current.map(
                (value) => value * (1 - fadeProgress)
              )
            }
            needsRedrawRef.current = true
            requestAnimationFrame(fadeToIdle)
          } else {
            if (mode === "static") {
              staticBarsRef.current = []
            } else {
              historyRef.current = []
            }
          }
        }
        fadeToIdle()
      }
    }
  }, [processing, active, barWidth, barGap, mode])
  // Handle microphone setup and teardown
  useEffect(() => {
    if (!active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
      return
    }
    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
            : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
        })
        streamRef.current = stream
        onStreamReady?.(stream)
        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        const audioContext = new AudioContextConstructor()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        // Clear history when starting
        historyRef.current = []
      } catch (error) {
        onError?.(error as Error)
      }
    }
    setupMicrophone()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
    }
  }, [
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    onError,
    onStreamReady,
    onStreamEnd,
  ])
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let rafId: number
    const animate = (currentTime: number) => {
      // Render waveform
      const rect = canvas.getBoundingClientRect()
      // Update audio data if active
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime
        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          )
          analyserRef.current.getByteFrequencyData(dataArray)
          if (mode === "static") {
            // For static mode, update bars in place
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)
            const barCount = Math.floor(rect.width / (barWidth + barGap))
            const halfCount = Math.floor(barCount / 2)
            const newBars: number[] = []
            // Mirror the data for symmetric display
            for (let i = halfCount - 1; i >= 0; i--) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length
              )
              const value = Math.min(
                1,
                (relevantData[dataIndex] / 255) * sensitivity
              )
              newBars.push(Math.max(0.05, value))
            }
            for (let i = 0; i < halfCount; i++) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length
              )
              const value = Math.min(
                1,
                (relevantData[dataIndex] / 255) * sensitivity
              )
              newBars.push(Math.max(0.05, value))
            }
            staticBarsRef.current = newBars
            lastActiveDataRef.current = newBars
          } else {
            // Scrolling mode - original behavior
            let sum = 0
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)
            for (let i = 0; i < relevantData.length; i++) {
              sum += relevantData[i]
            }
            const average = (sum / relevantData.length / 255) * sensitivity
            // Add to history
            historyRef.current.push(Math.min(1, Math.max(0.05, average)))
            lastActiveDataRef.current = [...historyRef.current]
            // Maintain history size
            if (historyRef.current.length > historySize) {
              historyRef.current.shift()
            }
          }
          needsRedrawRef.current = true
        }
      }
      // Only redraw if needed
      if (!needsRedrawRef.current && !active) {
        rafId = requestAnimationFrame(animate)
        return
      }
      needsRedrawRef.current = active
      ctx.clearRect(0, 0, rect.width, rect.height)
      const computedBarColor =
        barColor ||
        (() => {
          const style = getComputedStyle(canvas)
          // Try to get the computed color value directly
          const color = style.color
          return color || "#000"
        })()
      const step = barWidth + barGap
      const barCount = Math.floor(rect.width / step)
      const centerY = rect.height / 2
      // Draw bars based on mode
      if (mode === "static") {
        // Static mode - bars in fixed positions
        const dataToRender = processing
          ? staticBarsRef.current
          : active
            ? staticBarsRef.current
            : staticBarsRef.current.length > 0
              ? staticBarsRef.current
              : []
        for (let i = 0; i < barCount && i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0.1
          const x = i * step
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8)
          const y = centerY - barHeight / 2
          ctx.fillStyle = computedBarColor
          ctx.globalAlpha = 0.4 + value * 0.6
          if (barRadius > 0) {
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, barRadius)
            ctx.fill()
          } else {
            ctx.fillRect(x, y, barWidth, barHeight)
          }
        }
      } else {
        // Scrolling mode - original behavior
        for (let i = 0; i < barCount && i < historyRef.current.length; i++) {
          const dataIndex = historyRef.current.length - 1 - i
          const value = historyRef.current[dataIndex] || 0.1
          const x = rect.width - (i + 1) * step
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8)
          const y = centerY - barHeight / 2
          ctx.fillStyle = computedBarColor
          ctx.globalAlpha = 0.4 + value * 0.6
          if (barRadius > 0) {
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, barRadius)
            ctx.fill()
          } else {
            ctx.fillRect(x, y, barWidth, barHeight)
          }
        }
      }
      // Apply edge fading
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        // Cache gradient if width hasn't changed
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
          const fadePercent = Math.min(0.3, fadeWidth / rect.width)
          // destination-out: removes destination where source alpha is high
          // We want: fade edges out, keep center solid
          // Left edge: start opaque (1) = remove, fade to transparent (0) = keep
          gradient.addColorStop(0, "rgba(255,255,255,1)")
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)")
          // Center stays transparent = keep everything
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)")
          // Right edge: fade from transparent (0) = keep to opaque (1) = remove
          gradient.addColorStop(1, "rgba(255,255,255,1)")
          gradientCacheRef.current = gradient
          lastWidthRef.current = rect.width
        }
        ctx.globalCompositeOperation = "destination-out"
        ctx.fillStyle = gradientCacheRef.current
        ctx.fillRect(0, 0, rect.width, rect.height)
        ctx.globalCompositeOperation = "source-over"
      }
      ctx.globalAlpha = 1
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
  ])
  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={
        active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle"
      }
      role="img"
      {...props}
    >
      {!active && !processing && (
        <div className="border-muted-foreground/20 absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t-2 border-dotted" />
      )}
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * Minimal voice → transcription → prompt → model → TSF insert UI.
 * Uses microphone, shows only a live waveform and start/stop icons.
 * When recording stops, it automatically:
 *  - transcribes audio via AssemblyAI (prerecorded),
 *  - turns the transcript into a concise prompt,
 *  - sends that prompt to the current model,
 *  - inserts the model output into the last focused external app via TSF.
 */
export function VoiceToPromptQuickInsert({ onCancel }: { onCancel?: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasInserted, setHasInserted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const processRecording = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setError("Recorded audio is empty.")
      return
    }

    if (!isAssemblyAIConfigured()) {
      setError("AssemblyAI API key is not configured.")
      return
    }

    setIsProcessing(true)
    setHasInserted(false)
    setError(null)

    try {
      const service = createPrerecordedService()
      const transcriptionResult = await service.transcribe(audioBlob, {
        punctuate: true,
        formatText: true,
      })

      if (transcriptionResult.status !== "completed" || !transcriptionResult.text?.trim()) {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }

      const transcription = transcriptionResult.text.trim()

      // Step 2: Turn transcription into a clean, single prompt
      const promptBuilder = buildVoiceRewritePromptFromTranscription(transcription)

      const localModel = unifiedLocalLLMService.getCurrentModel()
      const rewrittenPrompt = localModel
        ? await (async () => {
          const init = await unifiedLocalLLMService.initialize()
          if (!init.success) throw new Error(init.message)
          return await unifiedLocalLLMService.sendMessageComplete(promptBuilder, undefined, localModel.name)
        })()
        : await sendCloudMessageComplete(promptBuilder)

      const finalPrompt = (rewrittenPrompt || "").trim() || transcription

      // Step 3: Send the final prompt to the model to get an answer
      const answer = localModel
        ? await (async () => {
          const init = await unifiedLocalLLMService.initialize()
          if (!init.success) throw new Error(init.message)
          return await unifiedLocalLLMService.sendMessageComplete(finalPrompt, undefined, localModel.name)
        })()
        : await sendCloudMessageComplete(finalPrompt)

      const textToInsert = (answer || "").trim()
      if (!textToInsert) {
        throw new Error("Model returned an empty response.")
      }

      // Step 4: Insert into last focused external application via TSF
      if (!window.tsfAPI) {
        throw new Error("TSF API is not available. Please ensure the interface window is running.")
      }

      await window.tsfAPI.initialize()
      const success = await window.tsfAPI.focusAndInsertText(textToInsert)

      if (!success) {
        throw new Error("Failed to insert text into focused application.")
      }

      setHasInserted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error during processing."
      console.error("[VoiceToPromptQuickInsert] Pipeline error:", err)
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleStreamReady = useCallback((stream: MediaStream) => {
    try {
      // Create a MediaRecorder for the waveform's microphone stream
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/wav",
      ]
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || ""

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
        chunksRef.current = []
        await processRecording(blob)
      }

      if (isRecording) {
        recorder.start(500)
      }
    } catch (err) {
      console.error("[VoiceToPromptQuickInsert] Failed to start MediaRecorder:", err)
      setError("Failed to start audio recording.")
      setIsRecording(false)
    }
  }, [isRecording, processRecording])

  const handleStreamEnd = useCallback(() => {
    mediaRecorderRef.current = null
  }, [])

  const handleStart = useCallback(() => {
    setError(null)
    setHasInserted(false)
    setIsRecording(true)
  }, [])

  const handleStop = useCallback(() => {
    setIsRecording(false)
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    } catch (err) {
      console.error("[VoiceToPromptQuickInsert] Error stopping recorder:", err)
      setError("Failed to stop recording.")
    }
  }, [])

  const handleClose = useCallback(() => {
    // Stop any active recording/processing
    handleStop()
    setError(null)
    setHasInserted(false)
    setIsRecording(false)
    setIsProcessing(false)
    // Close the component
    onCancel?.()
  }, [handleStop, onCancel])

  return (
    <div className="relative flex items-center">
      {/* Pill container */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg transition-all duration-300",
          "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700",
          isRecording && "ring-2 ring-red-500/20",
          isProcessing && "ring-2 ring-blue-500/20"
        )}
      >
        {/* Waveform on the left */}
        <div className="flex-shrink-0 w-20 h-8">
          <LiveWaveform
            active={isRecording}
            processing={isProcessing}
            height={32}
            barWidth={2}
            barGap={2}
            mode="static"
            onStreamReady={handleStreamReady}
            onStreamEnd={handleStreamEnd}
            className="w-full h-full"
          />
        </div>

        {/* Dynamic button/status area - same position, different content */}
        <div className="flex items-center justify-center min-w-[80px] h-8">
          {!isRecording && !isProcessing && !hasInserted && !error && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStart}
              disabled={false}
              aria-label="Start recording"
              className={cn(
                "rounded-full w-8 h-8 p-0 transition-colors",
                "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-700 dark:text-neutral-300"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          {isRecording && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStop}
              disabled={false}
              aria-label="Stop recording"
              className={cn(
                "rounded-full w-8 h-8 p-0 transition-colors",
                "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>...</span>
            </div>
          )}

          {hasInserted && !isProcessing && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Inserted</span>
            </div>
          )}

          {error && !isProcessing && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 max-w-[120px]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={error}>{error}</span>
            </div>
          )}
        </div>

        {/* Single close button - cancels current operation and closes component */}
        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800"
          )}
          aria-label="Close"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
