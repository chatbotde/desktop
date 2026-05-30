import { useState, useRef, useSyncExternalStore, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, X, Plus } from 'lucide-react'
import { cn } from '@/shared/lib'
import { getThemeClasses } from '@/features/prompt'
import { useDraggable } from '@/features/output-window'
import { formatTime, normalizeAudioDuration } from './audio-utils'
import { GLOBAL_THEME } from '@/global/theme'

const PLAYER_WIDTH = 300
const PLAYER_HEIGHT = 44

function getDefaultPlayerPosition() {
  return {
    x: Math.max(16, window.innerWidth / 2 - PLAYER_WIDTH / 2),
    y: window.innerHeight - 88,
  }
}

/** Position the player centered above the prompt input bar */
function getAbovePromptPlayerPosition() {
  const input = document.querySelector<HTMLElement>('[aria-label="Message input"]')
  if (input) {
    const rect = input.getBoundingClientRect()
    const x = Math.max(
      16,
      Math.min(window.innerWidth - PLAYER_WIDTH - 16, rect.left + rect.width / 2 - PLAYER_WIDTH / 2)
    )
    const y = Math.max(16, rect.top - PLAYER_HEIGHT - 12)
    return { x, y }
  }

  return {
    x: Math.max(16, window.innerWidth / 2 - PLAYER_WIDTH / 2),
    y: window.innerHeight - 120,
  }
}

function resolveInitialPosition(placement: 'default' | 'above-prompt') {
  return placement === 'above-prompt' ? getAbovePromptPlayerPosition() : getDefaultPlayerPosition()
}

function resolvePlaybackDuration(audioDuration: number, recordedDuration: number): number {
  const fromAudio = normalizeAudioDuration(audioDuration)
  if (fromAudio > 0) return fromAudio
  return normalizeAudioDuration(recordedDuration)
}

interface PlaybackWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  isDarkTheme?: boolean
}

function PlaybackWaveform({ audioRef, isPlaying, isDarkTheme = true }: PlaybackWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const barsRef = useRef<number[]>([])
  const connectedRef = useRef(false)
  const idleTimeRef = useRef(0)

  useSyncExternalStore(
    useCallback((_callback) => {
      const audio = audioRef.current
      if (!audio || connectedRef.current) return () => {}

      try {
        const ctx = new AudioContext()
        const source = ctx.createMediaElementSource(audio)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)
        analyser.connect(ctx.destination)
        contextRef.current = ctx
        analyserRef.current = analyser
        connectedRef.current = true
      } catch {
        connectedRef.current = true
      }

      return () => {
        contextRef.current?.close().catch(() => {})
        contextRef.current = null
        analyserRef.current = null
        connectedRef.current = false
      }
    }, [audioRef]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      if (isPlaying && contextRef.current?.state === 'suspended') {
        contextRef.current.resume().catch(() => {})
      }
      return () => {}
    }, [isPlaying]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return () => {}

      const resize = () => {
        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(container)

      let raf = 0
      const barWidth = 2
      const barGap = 2

      const draw = () => {
        const rect = container.getBoundingClientRect()
        const ctx = canvas.getContext('2d')
        if (!ctx || rect.width <= 0) {
          raf = requestAnimationFrame(draw)
          return
        }

        const barCount = Math.max(8, Math.floor(rect.width / (barWidth + barGap)))
        const centerY = rect.height / 2
        const color = isDarkTheme ? 'rgb(161, 161, 170)' : 'rgb(82, 82, 91)'

        if (isPlaying && analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          const start = Math.floor(data.length * 0.05)
          const end = Math.floor(data.length * 0.45)
          const slice = data.slice(start, end)
          const next: number[] = []

          for (let i = 0; i < barCount; i++) {
            const idx = Math.floor((i / barCount) * slice.length)
            const value = Math.max(0.12, (slice[idx] / 255) * 0.95)
            next.push(value)
          }
          barsRef.current = next
        } else {
          idleTimeRef.current += 0.06
          const next: number[] = []
          for (let i = 0; i < barCount; i++) {
            const wave = Math.sin(idleTimeRef.current + i * 0.35) * 0.08
            next.push(Math.max(0.1, 0.18 + wave))
          }
          barsRef.current = next
        }

        ctx.clearRect(0, 0, rect.width, rect.height)
        barsRef.current.forEach((value, i) => {
          const x = i * (barWidth + barGap)
          const h = Math.max(3, value * rect.height * 0.85)
          const y = centerY - h / 2
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.roundRect(x, y, barWidth, h, 1)
          ctx.fill()
        })

        raf = requestAnimationFrame(draw)
      }

      raf = requestAnimationFrame(draw)

      return () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
      }
    }, [audioRef, isPlaying, isDarkTheme]),
    () => null,
    () => null
  )

  return (
    <div ref={containerRef} className="h-7 min-w-0 flex-1">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  )
}

interface AudioNotificationPlayerProps {
  audioBlob: Blob
  recordedDuration?: number
  onClose: () => void
  onUse?: (blob: Blob) => void
  isDarkTheme?: boolean
  /** When opened from prompt input, sit above the bar with a higher z-index */
  placement?: 'default' | 'above-prompt'
}

export function AudioNotificationPlayer({
  audioBlob,
  recordedDuration = 0,
  onClose,
  onUse,
  isDarkTheme = true,
  placement = 'default',
}: AudioNotificationPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [position, setPosition] = useState(() => resolveInitialPosition(placement))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(() => normalizeAudioDuration(recordedDuration))
  const [audioUrl, setAudioUrl] = useState('')
  const recordedDurationRef = useRef(recordedDuration)
  recordedDurationRef.current = recordedDuration

  const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
  const themeClasses = getThemeClasses(isDarkTheme)

  useSyncExternalStore(
    useCallback((_callback) => {
      setDuration(normalizeAudioDuration(recordedDuration))
      return () => {}
    }, [recordedDuration]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [audioBlob]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      const audio = audioRef.current
      if (!audio) return () => {}

      const syncDuration = () => {
        setDuration(resolvePlaybackDuration(audio.duration, recordedDurationRef.current))
      }

      const onTime = () => {
        setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
        syncDuration()
      }

      const onEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }

      audio.addEventListener('loadedmetadata', syncDuration)
      audio.addEventListener('durationchange', syncDuration)
      audio.addEventListener('timeupdate', onTime)
      audio.addEventListener('ended', onEnded)

      if (audio.readyState >= 1) {
        syncDuration()
      }

      return () => {
        audio.removeEventListener('loadedmetadata', syncDuration)
        audio.removeEventListener('durationchange', syncDuration)
        audio.removeEventListener('timeupdate', onTime)
        audio.removeEventListener('ended', onEnded)
      }
    }, [audioUrl]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      const audio = audioRef.current
      if (!audio) return () => {}
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false))
      } else {
        audio.pause()
      }
      return () => {}
    }, [isPlaying]),
    () => null,
    () => null
  )

  const handlePillMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    handleDragMouseDown(e)
  }

  const handleAddToPrompt = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!audioBlob || audioBlob.size === 0) return
    onUse?.(audioBlob)
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying((prev) => !prev)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const playerZIndex =
    placement === 'above-prompt' ? GLOBAL_THEME.zIndex.overlay : 60

  const player = (
    <div
      ref={containerRef}
      className={cn('fixed select-none', isDragging && 'cursor-grabbing')}
      style={{ left: position.x, top: position.y, zIndex: playerZIndex }}
      data-no-clickthrough
    >
      <div
        onMouseDown={handlePillMouseDown}
        className={cn(
          'flex h-11 w-[min(300px,calc(100vw-32px))] cursor-grab items-center gap-1.5 rounded-full border px-2 shadow-lg active:cursor-grabbing',
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <button
          type="button"
          data-no-clickthrough
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleTogglePlay}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
            isDarkTheme
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
        </button>

        <PlaybackWaveform
          audioRef={audioRef}
          isPlaying={isPlaying}
          isDarkTheme={isDarkTheme}
        />

        <span
          className={cn(
            'shrink-0 text-[10px] tabular-nums whitespace-nowrap',
            themeClasses.icon
          )}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {onUse && (
          <button
            type="button"
            data-no-clickthrough
            onMouseDown={(e) => e.stopPropagation()}
            onPointerUp={handleAddToPrompt}
            className={cn(
              'pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
              isDarkTheme
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
            aria-label="Add to prompt"
            title="Add to prompt"
          >
            <Plus className="size-4" />
          </button>
        )}

        <button
          type="button"
          data-no-clickthrough
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClose}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
            isDarkTheme
              ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
          )}
          aria-label="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />}
    </div>
  )

  if (typeof document === 'undefined') {
    return player
  }

  return createPortal(player, document.body)
}
