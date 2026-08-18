import { useState } from 'react'
import { Mic, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioNotificationPlayer } from '@/features/audio/components/AudioNotificationPlayer'
import { SendToPhoneHoverButton } from './components/send-to-phone-button'

interface PromptAudioPreviewProps {
  file: File
  onRemove?: () => void
  className?: string
  variant?: 'expanded' | 'collapsed'
  isDarkTheme?: boolean
  themeClasses?: {
    icon: string
    fileItem?: string
  }
}

export function isAudioFile(file: File): boolean {
  return file.type.toLowerCase().startsWith('audio/')
}

export function PromptAudioPreview({
  file,
  onRemove,
  className,
  variant = 'expanded',
  isDarkTheme = true,
  themeClasses,
}: PromptAudioPreviewProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const isCollapsed = variant === 'collapsed'

  const openPreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPlayer(true)
  }

  return (
    <>
      <div
        className={cn(
          'relative shrink-0 group',
          isCollapsed ? 'h-6 w-6' : 'h-8 min-w-[2rem]',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={cn(
            'relative flex h-full w-full cursor-pointer items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
            isCollapsed ? 'bg-muted' : cn('gap-1 px-2 text-sm border', themeClasses?.fileItem),
            isDarkTheme ? 'border-white/10 hover:bg-zinc-800/80' : 'border-zinc-200 hover:bg-zinc-100',
          )}
          onClick={openPreview}
          aria-label={`Play ${file.name}`}
          title="Listen to recording"
        >
          <Mic className={cn('size-3.5 shrink-0', themeClasses?.icon ?? 'text-zinc-400')} aria-hidden />
          {!isCollapsed && (
            <Play className="size-3 shrink-0 opacity-60" aria-hidden />
          )}
          {isCollapsed && (
            <>
              <div className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="size-2.5 text-current" fill="currentColor" />
              </div>
            </>
          )}
        </button>

        <div className="absolute bottom-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <SendToPhoneHoverButton
            file={file}
            className={cn(isCollapsed ? 'h-5 w-5' : 'h-6 w-6')}
            iconClassName={isCollapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'}
          />
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-0.5 -right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
            aria-label={`Remove ${file.name}`}
            title="Remove"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showPlayer && (
        <AudioNotificationPlayer
          audioBlob={file}
          onClose={() => setShowPlayer(false)}
          isDarkTheme={isDarkTheme}
          placement="above-prompt"
        />
      )}
    </>
  )
}
