import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, X, Trash2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getThemeClasses, getHoverClass } from './prompt-input-theme'
import { Button } from '@/components/ui/button'

interface AudioPreviewProps {
  audioBlob: Blob
  fileName?: string
  onClose: () => void
  onDelete?: () => void
  onUse?: (blob: Blob) => void
  isDarkTheme?: boolean
}

export function AudioPreview({ 
  audioBlob, 
  fileName, 
  onClose, 
  onDelete,
  onUse,
  isDarkTheme = true 
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)

  const themeClasses = getThemeClasses(isDarkTheme)
  const hoverClass = getHoverClass(isDarkTheme)

  // Create object URL for the audio blob
  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  // Update duration when audio loads
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `recording-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const fileSize = (audioBlob.size / 1024).toFixed(2) + ' KB'

  return (
    <div
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]",
        "w-full max-w-md px-4"
      )}
      data-no-clickthrough
    >
      <div
        className={cn(
          "rounded-xl border shadow-2xl p-4",
          themeClasses.containerBorder,
          "backdrop-blur-lg"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 className={cn("size-5", themeClasses.icon)} />
            <div>
              <div className={cn("text-sm font-semibold", themeClasses.input)}>
                Audio Recording
              </div>
              <div className={cn("text-xs", themeClasses.icon)}>
                {fileSize} • {formatTime(duration)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={onDelete}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  hoverClass
                )}
                title="Delete"
              >
                <Trash2 className={cn("size-4", themeClasses.icon)} />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                hoverClass
              )}
              title="Close"
            >
              <X className={cn("size-4", themeClasses.icon)} />
            </button>
          </div>
        </div>

        {/* Audio Player */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(currentTime / duration) * 100}%, rgb(63, 63, 70) ${(currentTime / duration) * 100}%, rgb(63, 63, 70) 100%)`
            }}
          />
          <div className="flex justify-between text-xs mt-1">
            <span className={themeClasses.icon}>{formatTime(currentTime)}</span>
            <span className={themeClasses.icon}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlay}
              size="sm"
              variant="default"
              className="rounded-full w-10 h-10 p-0"
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
            <span className={cn("text-sm", themeClasses.input)}>
              {isPlaying ? 'Playing...' : 'Paused'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              className={cn(
                "gap-2",
                isDarkTheme ? "border-zinc-700" : "border-zinc-300"
              )}
            >
              <Download className="size-4" />
              Download
            </Button>
            {onUse && (
              <Button
                onClick={() => onUse(audioBlob)}
                size="sm"
                variant="default"
              >
                Use Recording
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

