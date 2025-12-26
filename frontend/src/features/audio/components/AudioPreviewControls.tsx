import { Play, Pause, Download } from 'lucide-react'
import { cn } from '@/shared/lib'
import { getThemeClasses } from '@/features/prompt'
import { Button } from '@/shared/components/ui/button'

interface AudioPreviewControlsProps {
  audioBlob: Blob
  isPlaying: boolean
  onPlayPause: () => void
  onDownload: () => void
  onUse?: (blob: Blob) => void
  isDarkTheme?: boolean
}

export function AudioPreviewControls({
  audioBlob,
  isPlaying,
  onPlayPause,
  onDownload,
  onUse,
  isDarkTheme = true
}: AudioPreviewControlsProps) {
  const themeClasses = getThemeClasses(isDarkTheme)

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={onPlayPause}
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
          onClick={onDownload}
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
  )
}

