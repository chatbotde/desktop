import { Volume2, FileText, Trash2, X, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { getThemeClasses, getHoverClass } from '@/features/prompt'
import { isAssemblyAIConfigured } from '@/lib/audio'

interface AudioPreviewHeaderProps {
  fileSize: string
  duration: number
  isTranscribing: boolean
  onTranscribe: () => void
  onDelete?: () => void
  onClose: () => void
  isDarkTheme?: boolean
  formatTime: (seconds: number) => string
}

export function AudioPreviewHeader({
  fileSize,
  duration,
  isTranscribing,
  onTranscribe,
  onDelete,
  onClose,
  isDarkTheme = true,
  formatTime
}: AudioPreviewHeaderProps) {
  const themeClasses = getThemeClasses(isDarkTheme)
  const hoverClass = getHoverClass(isDarkTheme)

  return (
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
        {isAssemblyAIConfigured() && (
          <button
            onClick={onTranscribe}
            disabled={isTranscribing}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              hoverClass,
              isTranscribing && "opacity-50 cursor-not-allowed"
            )}
            title="Transcribe Audio"
          >
            {isTranscribing ? (
              <Loader2 className={cn("size-4 animate-spin", themeClasses.icon)} />
            ) : (
              <FileText className={cn("size-4", themeClasses.icon)} />
            )}
          </button>
        )}
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
  )
}

