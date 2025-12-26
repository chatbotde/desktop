import { useRef, useEffect } from 'react'
import { cn } from '@/shared/lib'
import { getThemeClasses } from '@/features/prompt'

interface AudioPlayerProps {
  audioUrl: string
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onEnded: () => void
  isDarkTheme?: boolean
  formatTime: (seconds: number) => string
}

export function AudioPlayer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  isDarkTheme = true,
  formatTime
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const themeClasses = getThemeClasses(isDarkTheme)

  // Update duration when audio loads
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      onDurationChange(audio.duration)
    }

    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime)
    }

    const handleEnded = () => {
      onEnded()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl, onTimeUpdate, onDurationChange, onEnded])

  // Sync play/pause state with audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    onSeek(newTime)
  }

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
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
    </>
  )
}

