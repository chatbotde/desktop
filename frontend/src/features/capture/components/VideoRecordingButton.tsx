import { useState, useCallback, useSyncExternalStore } from 'react'
import { Video, Square, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/components/ui/button'
import { useVideoRecording, type VideoData } from '@/hooks/useVideoRecording'

interface VideoRecordingButtonProps {
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
   * Callback when video is added to prompt
   */
  onVideoAdded?: (video: VideoData) => void
  /**
   * Default FPS for recording
   * @default 30
   */
  defaultFps?: number
}

/**
 * A button component that handles video recording and automatic file insertion into the prompt input.
 * 
 * Click to start recording. The button changes to a stop button.
 * When stopped, the recorded video is automatically added to the prompt input as a file.
 */
export function VideoRecordingButton({
  className,
  isDarkTheme = true,
  onVideoAdded,
  defaultFps = 30
}: VideoRecordingButtonProps) {
  const [isActive, setIsActive] = useState(false)

  // Video recording hook
  const {
    recordingState,
    error,
    startRecording,
    stopRecording,
  } = useVideoRecording()

  // Handle recording completion
  const handleRecordingComplete = useCallback(async (video: VideoData) => {
    try {
      // Convert VideoData to File object
      let videoFile: File
      
      if (video.blob) {
        // Use the blob directly if available
        videoFile = new File([video.blob], video.name, { type: video.type })
      } else {
        // Convert from data URL if blob is not available
        const response = await fetch(video.data)
        const blob = await response.blob()
        videoFile = new File([blob], video.name, { type: video.type })
      }
      
      // Auto-add to prompt input using the custom event
      window.dispatchEvent(new CustomEvent('prompt-add-files', {
        detail: { files: [videoFile] }
      }))
      
      onVideoAdded?.(video)
    } catch (error) {
      console.error('[VideoRecordingButton] Failed to add video to prompt:', error)
    }
  }, [onVideoAdded])

  const handleStart = useCallback(async () => {
    try {
      setIsActive(true)
      const success = await startRecording({
        fps: defaultFps,
        audioEnabled: true
      })
      
      if (!success) {
        setIsActive(false)
        console.error('Failed to start video recording')
      }
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsActive(false)
      alert(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [defaultFps, startRecording])

  const handleStop = useCallback(async () => {
    try {
      const video = await stopRecording()
      
      if (video) {
        await handleRecordingComplete(video)
      }
      setIsActive(false)
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setIsActive(false)
    }
  }, [stopRecording, handleRecordingComplete])

  // Reset isActive when recording state returns to idle - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (recordingState === 'idle' && !isActive) {
        // Recording was stopped externally or completed
        setIsActive(false)
      }
      return () => {}
    }, [recordingState, isActive]),
    () => null,
    () => null
  )

  // Determine button state
  const isConnecting = isActive && recordingState === 'idle'
  const isActiveRecording = recordingState === 'recording' || recordingState === 'paused'

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
          ? "Stop recording" 
          : buttonState === 'connecting'
          ? "Connecting..."
          : "Start video recording"
      }
      disabled={!!error}
    >
      {buttonState === 'stop' ? (
        <Square className="h-4 w-4" />
      ) : buttonState === 'connecting' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Video className="h-4 w-4" />
      )}
    </Button>
  )
}

