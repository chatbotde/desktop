import { cn } from '@/lib/utils'
import { openRecordedImagePlayer } from '@/lib/events/recorded-image-player'
import { useFilePreviewUrl } from './hooks/use-file-preview-url'

interface PromptImagePreviewProps {
  file: File
  onRemove?: () => void
  className?: string
  variant?: 'expanded' | 'collapsed'
}

export function isImageFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name)
}

export function PromptImagePreview({
  file,
  onRemove,
  className,
  variant = 'expanded',
}: PromptImagePreviewProps) {
  const previewUrl = useFilePreviewUrl(file)
  const sizeClass = variant === 'collapsed' ? 'w-16 h-16' : 'w-16 h-16'

  const openOverlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    openRecordedImagePlayer(file)
  }

  return (
    <div
      className={cn(
        'relative shrink-0 group overflow-hidden rounded-lg border-2 border-zinc-700 bg-zinc-900 shadow-sm',
        sizeClass,
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        onClick={openOverlay}
        disabled={!previewUrl}
        aria-label={`View ${file.name}`}
        title="View in overlay"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>

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
