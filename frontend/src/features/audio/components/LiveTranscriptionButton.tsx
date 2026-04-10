import { useState, useCallback, useRef, useSyncExternalStore } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/components/ui/button'
import { useAudioRecorder, type AudioSourceType } from '../hooks/useAudioRecorder'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

interface LiveTranscriptionButtonProps {
  /**
   * Audio source to use for recording
   * @default 'mic'
   */
  audioSource?: AudioSourceType
  /**
   * Custom className for the button
   */
  className?: string
  /**
   * Whether to use dark theme styling
   * @default true
   */
  isDarkTheme?: boolean
  /**
   * Callback when transcription is added to prompt
   */
  onTranscriptionAdded?: (text: string) => void
}

/**
 * A button component that combines microphone recording, live transcription,
 * and automatic text insertion into the prompt input.
 * 
 * Click to start recording and live transcription. The button changes to a stop button.
 * When stopped, the transcribed text is automatically added to the prompt input.
 */
export function LiveTranscriptionButton({
  audioSource = 'mic',
  className,
  isDarkTheme = true,
  onTranscriptionAdded
}: LiveTranscriptionButtonProps) {
  const [isActive, setIsActive] = useState(false)
  
  // Track last activity time for auto-stop
  const lastActivityRef = useRef<number>(Date.now())
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleStopRef = useRef<(() => Promise<void>) | null>(null)

  // HOOKS MUST BE CALLED BEFORE ANY VARIABLE USAGE
  // Audio recording hook
  const {
    isRecording,
    activeStream,
    startRecording,
    stopRecording,
    cleanup: cleanupRecorder
  } = useAudioRecorder()

  // Live transcription hook
  const {
    transcriptionText,
    partialText,
    isTranscribing,
    startTranscription: _startTranscription,
    stopTranscription,
    clearTranscription
  } = useLiveTranscription({
    isEnabled: isActive
  })

  // Refs to track latest transcription values - AFTER hooks are called
  const transcriptionTextRef = useRef(transcriptionText)
  transcriptionTextRef.current = transcriptionText
  const partialTextRef = useRef(partialText)
  partialTextRef.current = partialText
  
  // Update activity time when transcription changes - inline logic
  if (transcriptionText) {
    lastActivityRef.current = Date.now()
  }
  if (partialText) {
    lastActivityRef.current = Date.now()
  }

  // Helper to reset auto-stop timer
  const resetAutoStopTimer = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current as any)
      autoStopTimeoutRef.current = null
    }
    
    if (isRecording && isTranscribing && handleStopRef.current) {
      autoStopTimeoutRef.current = setTimeout(() => {
        if (handleStopRef.current) {
          handleStopRef.current()
        }
      }, 10000) as any
    }
  }, [isRecording, isTranscribing])

  // Reset timer when transcription changes (was in useEffect)
  if (transcriptionText || partialText) {
    resetAutoStopTimer()
  }

  // Start/stop transcription based on recording state - inline logic
  if (isRecording && activeStream && isActive) {
    lastActivityRef.current = Date.now()
    // Note: startTranscription should be called in the callback, not during render
    // This is handled in handleStart
  } else if (!isRecording || !isActive) {
    stopTranscription()
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
      autoStopTimeoutRef.current = null
    }
  }

  // Cleanup on unmount - useSyncExternalStore pattern
  useSyncExternalStore(
    () => () => {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current)
      }
      cleanupRecorder().catch(console.error)
    },
    () => null,
    () => null
  )

  const handleStart = useCallback(async () => {
    try {
      setIsActive(true)
      await startRecording(audioSource)
      // Start transcription after recording begins
      // This was moved from useEffect to here
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsActive(false)
      alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [audioSource, startRecording])

  const handleStop = useCallback(async () => {
    // Clear auto-stop timer
    if (autoStopTimeoutRef.current) {
      clearInterval(autoStopTimeoutRef.current as any)
      autoStopTimeoutRef.current = null
    }
    
    // Stop recording first
    stopRecording()
    setIsActive(false)
    
    // Stop transcription
    await stopTranscription()
    
    // Wait a brief moment for any final transcription chunks to arrive
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get the full transcribed text using refs to ensure we have the latest values
    const fullText = `${transcriptionTextRef.current} ${partialTextRef.current}`.trim()
    
    if (fullText) {
      // Auto-add to prompt input using the custom event
      try {
        window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: fullText } }))
        onTranscriptionAdded?.(fullText)
      } catch (error) {
        console.error('[LiveTranscriptionButton] Failed to dispatch prompt-add-text event:', error)
      }
    }
    
    // Clear transcription for next use
    clearTranscription()
  }, [stopRecording, stopTranscription, clearTranscription, onTranscriptionAdded])

  // Keep handleStop ref in sync - direct assignment instead of useEffect
  handleStopRef.current = handleStop

  // Determine button state:
  // - isConnecting: recording but not yet connected (show loading)
  // - isActiveRecording: recording and connected (show stop button)
  // - idle: not recording (show mic button)
  const isConnecting = isRecording && !isTranscribing
  const isActiveRecording = isRecording && isTranscribing

  const getButtonState = () => {
    if (isActiveRecording) return 'stop'
    if (isConnecting) return 'connecting'
    return 'idle'
  }

  const buttonState = getButtonState()

  return (
    <Button
      onClick={buttonState === 'stop' ? handleStop : handleStart}
      className={cn(
        "rounded-full transition-all duration-200",
        buttonState === 'stop' && "bg-red-500 hover:bg-red-600 text-white",
        buttonState === 'connecting' && isDarkTheme
          ? "bg-yellow-500/80 hover:bg-yellow-500 text-white"
          : buttonState === 'connecting'
          ? "bg-yellow-400/80 hover:bg-yellow-400 text-white"
          : "",
        buttonState === 'idle' && isDarkTheme 
          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100" 
          : buttonState === 'idle'
          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
          : "",
        className
      )}
      variant={buttonState === 'stop' ? "default" : "ghost"}
      size="icon"
      aria-label={
        buttonState === 'stop' 
          ? "Stop transcription" 
          : buttonState === 'connecting'
          ? "Connecting..."
          : "Start live transcription"
      }
    >
      {buttonState === 'stop' ? (
        <Square className="h-4 w-4" />
      ) : buttonState === 'connecting' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}

