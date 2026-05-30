import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useDragControls } from 'motion/react'
import { Check, GripVertical, Loader2, MessageSquareText, Square, X } from 'lucide-react'
import { isAssemblyAIConfigured } from '@/lib/audio'
import { isCerebrasVoiceIntentConfigured, rewriteTranscriptToIntent } from '@/lib/ai'
import { cn } from '@/shared/lib'
import { useIsDark } from '@/shared/providers'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

type InsertState = 'idle' | 'starting' | 'listening' | 'stopping' | 'inserting' | 'inserted' | 'failed'

const waveBars = [0.35, 0.8, 0.55, 1, 0.45, 0.7, 0.4]

const popupSpring = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
}

function collapseIncrementalTranscript(text: string) {
  const tokens = text.match(/\S+/g) ?? []
  const collapsed: string[] = []
  const comparable = (token: string) => token.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')

  for (let index = 0; index < tokens.length;) {
    let overlap = 0
    const maxOverlap = Math.min(collapsed.length, tokens.length - index)

    for (let size = maxOverlap; size > 0; size--) {
      const suffix = collapsed.slice(collapsed.length - size).map(comparable)
      const next = tokens.slice(index, index + size).map(comparable)

      if (suffix.every((token, tokenIndex) => token === next[tokenIndex])) {
        overlap = size
        break
      }
    }

    if (overlap > 0) {
      index += overlap
      continue
    }

    collapsed.push(tokens[index])
    index++
  }

  return collapsed.join(' ').trim()
}

async function insertTranscriptText(text: string) {
  if (window.tsfAPI) {
    await window.tsfAPI.initialize()
    return window.tsfAPI.focusAndInsertText(text)
  }

  window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text } }))
  return true
}

interface InsertTranscriptOverlayProps {
  onDismiss?: () => void
}

export function InsertTranscriptOverlay({ onDismiss }: InsertTranscriptOverlayProps) {
  const isDark = useIsDark()
  const dragControls = useDragControls()
  const [isAssemblyEnabled, setIsAssemblyEnabled] = useState(false)
  const [insertState, setInsertState] = useState<InsertState>('idle')
  const [error, setError] = useState<string | null>(null)
  const insertedStateTimeoutRef = useRef<number | null>(null)
  const stopGraceTimeoutRef = useRef<number | null>(null)
  const lastInsertedTextRef = useRef('')
  const hasStartedTranscriptionRef = useRef(false)
  const isRecordingRef = useRef(false)
  const isStoppingRef = useRef(false)
  const hasInsertedCurrentRecordingRef = useRef(false)
  const {
    isRecording,
    activeStream,
    startRecording,
    stopRecording,
    cleanup,
  } = useAudioRecorder()

  const {
    transcriptionText,
    partialText,
    isTranscribing,
    startTranscription,
    stopTranscription,
    clearTranscription,
  } = useLiveTranscription({ isEnabled: isAssemblyEnabled })

  const transcriptionTextRef = useRef(transcriptionText)
  const partialTextRef = useRef(partialText)
  isRecordingRef.current = isRecording
  transcriptionTextRef.current = transcriptionText
  partialTextRef.current = partialText

  const clearInsertedStateTimeout = useCallback(() => {
    if (insertedStateTimeoutRef.current !== null) {
      window.clearTimeout(insertedStateTimeoutRef.current)
      insertedStateTimeoutRef.current = null
    }
  }, [])

  const clearStopGraceTimeout = useCallback(() => {
    if (stopGraceTimeoutRef.current !== null) {
      window.clearTimeout(stopGraceTimeoutRef.current)
      stopGraceTimeoutRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    clearInsertedStateTimeout()
    clearStopGraceTimeout()
    lastInsertedTextRef.current = ''
    hasStartedTranscriptionRef.current = false
    isStoppingRef.current = false
    hasInsertedCurrentRecordingRef.current = false
    clearTranscription()
    setError(null)
  }, [clearTranscription, clearInsertedStateTimeout, clearStopGraceTimeout])

  const handleStart = useCallback(async () => {
    if (!isAssemblyAIConfigured()) {
      setInsertState('failed')
      setError('AssemblyAI is not configured')
      return
    }

    resetState()
    setInsertState('starting')
    setIsAssemblyEnabled(true)

    try {
      await startRecording('mic')
      setInsertState('listening')
    } catch (startError) {
      setIsAssemblyEnabled(false)
      setInsertState('failed')
      setError(startError instanceof Error ? startError.message : 'Could not start voice insert')
    }
  }, [resetState, startRecording])

  const handleStopAndInsert = useCallback(async () => {
    if (isStoppingRef.current || hasInsertedCurrentRecordingRef.current) return

    isStoppingRef.current = true
    setInsertState('stopping')
    hasStartedTranscriptionRef.current = false

    clearStopGraceTimeout()
    stopGraceTimeoutRef.current = window.setTimeout(async () => {
      try {
        const beforeStopText = `${transcriptionTextRef.current} ${partialTextRef.current}`.trim()
        await stopTranscription()
        setIsAssemblyEnabled(false)
        stopRecording()

        const finalText = collapseIncrementalTranscript(
          `${transcriptionTextRef.current} ${partialTextRef.current}`.trim() || beforeStopText
        )

        if (!finalText) {
          isStoppingRef.current = false
          setInsertState('failed')
          setError('No speech detected')
          return
        }

        if (lastInsertedTextRef.current === finalText) {
          isStoppingRef.current = false
          setInsertState('idle')
          return
        }

        lastInsertedTextRef.current = finalText
        hasInsertedCurrentRecordingRef.current = true

        let textToInsert = finalText

        if (isCerebrasVoiceIntentConfigured()) {
          setInsertState('inserting')
          try {
            textToInsert = await rewriteTranscriptToIntent(finalText)
            if (!textToInsert) {
              textToInsert = finalText
            }
          } catch (intentError) {
            console.warn('[InsertTranscript] Cerebras intent rewrite failed, using raw transcript:', intentError)
            textToInsert = finalText
          }
        }

        const success = await insertTranscriptText(textToInsert)
        if (!success) {
          isStoppingRef.current = false
          hasInsertedCurrentRecordingRef.current = false
          lastInsertedTextRef.current = ''
          setInsertState('failed')
          setError('Could not insert text')
          return
        }

        clearTranscription()
        transcriptionTextRef.current = ''
        partialTextRef.current = ''
        isStoppingRef.current = false
        lastInsertedTextRef.current = ''
        setInsertState('inserted')
        clearInsertedStateTimeout()
        insertedStateTimeoutRef.current = window.setTimeout(() => {
          setInsertState('idle')
          insertedStateTimeoutRef.current = null
        }, 700)
      } catch (insertError) {
        isStoppingRef.current = false
        hasInsertedCurrentRecordingRef.current = false
        lastInsertedTextRef.current = ''
        setInsertState('failed')
        setError(insertError instanceof Error ? insertError.message : 'Could not insert text')
      } finally {
        clearStopGraceTimeout()
      }
    }, 450)
  }, [clearInsertedStateTimeout, clearStopGraceTimeout, clearTranscription, stopRecording, stopTranscription])

  const isBusy = insertState === 'starting' || insertState === 'stopping' || insertState === 'inserting'
  const isActive = isRecording || isTranscribing
  const showError = insertState === 'failed' && error

  const handleCancel = useCallback(async () => {
    clearInsertedStateTimeout()
    clearStopGraceTimeout()
    isStoppingRef.current = false
    hasInsertedCurrentRecordingRef.current = false
    hasStartedTranscriptionRef.current = false

    if (isRecording || isTranscribing) {
      await stopTranscription().catch(console.error)
      setIsAssemblyEnabled(false)
      stopRecording()
    }

    resetState()
    setInsertState('idle')
  }, [
    clearInsertedStateTimeout,
    clearStopGraceTimeout,
    isRecording,
    isTranscribing,
    resetState,
    stopRecording,
    stopTranscription,
  ])

  const handleDismiss = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      handleCancel()
        .catch(console.error)
        .finally(() => {
          onDismiss?.()
        })
    },
    [handleCancel, onDismiss]
  )

  const handleClick = useCallback(() => {
    if (isBusy || isStoppingRef.current) return

    if (isRecording || isTranscribing) {
      handleStopAndInsert().catch(console.error)
      return
    }

    handleStart().catch(console.error)
  }, [handleStart, handleStopAndInsert, isBusy, isRecording, isTranscribing])

  useEffect(() => {
    if (!isAssemblyEnabled || !isRecording || !activeStream || isTranscribing || hasStartedTranscriptionRef.current) return

    hasStartedTranscriptionRef.current = true
    startTranscription(activeStream).catch((startError) => {
      hasStartedTranscriptionRef.current = false
      setInsertState('failed')
      setError(startError instanceof Error ? startError.message : 'Could not connect to AssemblyAI')
    })
  }, [activeStream, isAssemblyEnabled, isRecording, isTranscribing, startTranscription])

  useEffect(() => {
    const toggle = () => {
      if (isRecordingRef.current) {
        handleStopAndInsert().catch(console.error)
      } else {
        handleStart().catch(console.error)
      }
    }

    window.addEventListener('toggle-insert-transcript-overlay', toggle)
    window.addEventListener('toggle-transcription-visibility', toggle)

    return () => {
      window.removeEventListener('toggle-insert-transcript-overlay', toggle)
      window.removeEventListener('toggle-transcription-visibility', toggle)
    }
  }, [handleStart, handleStopAndInsert])

  useEffect(() => {
    return () => {
      clearInsertedStateTimeout()
      clearStopGraceTimeout()
      if (isRecordingRef.current) {
        stopRecording()
      }
      stopTranscription().catch(console.error)
      cleanup().catch(console.error)
    }
  }, [clearInsertedStateTimeout, clearStopGraceTimeout, cleanup, stopRecording, stopTranscription])

  return (
    <motion.div
      className="group relative pointer-events-auto"
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 5 }}
      transition={popupSpring}
      data-no-clickthrough
    >
      {onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            'absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border shadow-md transition-all duration-150',
            'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto',
            isDark
              ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
          )}
          aria-label="Hide voice insert"
          title="Hide voice insert"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <button
        type="button"
        onPointerDown={(event) => dragControls.start(event)}
        className={cn(
          'absolute -left-1 top-1/2 z-10 flex h-7 w-5 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-150',
          'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto',
          isDark
            ? 'text-zinc-500 hover:text-zinc-300'
            : 'text-zinc-400 hover:text-zinc-600'
        )}
        aria-label="Move voice insert"
        title="Move"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className={cn(
          'flex h-11 min-w-[104px] items-center gap-2 rounded-full border p-1.5 pr-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-colors disabled:opacity-80',
          isActive
            ? 'border-red-500/50 bg-zinc-950 text-white hover:border-red-400/70'
            : isDark
              ? 'border-blue-500/30 bg-zinc-950 text-zinc-100 shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:bg-zinc-900'
              : 'border-blue-200/50 bg-white text-zinc-950 shadow-[0_0_20px_rgba(37,99,235,0.1)] hover:bg-zinc-50'
        )}
        aria-label={isActive ? 'Stop voice insert and insert text' : 'Start voice insert'}
        title={showError ? error : undefined}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            isActive
              ? 'bg-red-500 text-white'
              : isDark
                ? 'bg-zinc-900 text-zinc-100'
                : 'bg-zinc-100 text-zinc-900'
          )}
        >
          {insertState === 'inserted' ? (
            <Check className="h-4 w-4" />
          ) : isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <Square className="h-4 w-4" />
          ) : (
            <MessageSquareText className="h-4 w-4 text-blue-500" />
          )}
        </span>

        <span className="flex h-8 w-14 items-center justify-center gap-1">
          {waveBars.map((bar, index) => (
            <motion.span
              key={index}
              className={cn('w-1 rounded-full', isActive ? 'bg-blue-400' : isDark ? 'bg-zinc-700' : 'bg-zinc-300')}
              animate={isActive ? { height: [6, 24 * bar, 6] } : { height: 8 + 10 * bar }}
              transition={{
                duration: 0.7,
                repeat: isActive ? Infinity : 0,
                delay: index * 0.08,
                ease: 'easeInOut',
              }}
            />
          ))}
        </span>
      </button>
    </motion.div>
  )
}
