import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openRecordedVideoPlayer } from '@/lib/events/recorded-video-player'
import { useFilePreviewUrl } from './hooks/use-file-preview-url'
import { SendToPhoneHoverButton } from './components/send-to-phone-button'

interface PromptVideoPreviewProps {
  file: File
  onRemove?: () => void
  className?: string
  variant?: 'expanded' | 'collapsed'
}

export function isVideoFile(file: File): boolean {
  return file.type.toLowerCase().startsWith('video/')
}

export function PromptVideoPreview({
  file,
  onRemove,
  className,
  variant = 'expanded',
}: PromptVideoPreviewProps) {
  const videoUrl = useFilePreviewUrl(file)

  const isCollapsed = variant === 'collapsed'
  const sizeClass = isCollapsed ? 'h-6 w-10' : 'h-14 w-24'

  const openOverlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    openRecordedVideoPlayer(file)
  }

  return (
    <div
      className={cn(
        'relative shrink-0 group overflow-hidden rounded-md border border-white/10 bg-black',
        sizeClass,
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        onClick={openOverlay}
        aria-label={`Play ${file.name}`}
        title="Play in overlay"
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            className="h-full w-full object-cover pointer-events-none"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-black shadow-sm">
            <Play className="h-2 w-2 ml-px" fill="currentColor" />
          </div>
        </div>
      </button>

      <div className="absolute bottom-0 left-0 z-10 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <SendToPhoneHoverButton
          file={file}
          className="h-5 w-5"
          iconClassName="h-3 w-3"
        />
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-0 right-0 z-10 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white hover:bg-black/80 transition-colors"
          aria-label={`Remove ${file.name}`}
          title="Remove"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
