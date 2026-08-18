import { cn } from '@/lib/utils'
import { getFileIcon } from './prompt-shared'
import { FileRemoveButton } from './components/file-remove-button'
import { SendToPhoneHoverButton } from './components/send-to-phone-button'

interface PromptGenericFilePreviewProps {
  file: File
  onRemove?: () => void
  className?: string
  variant?: 'expanded' | 'collapsed'
  themeClasses?: {
    fileItem: string
    fileText?: string
    icon: string
  }
  hoverClass?: string
}

export function PromptGenericFilePreview({
  file,
  onRemove,
  className,
  variant = 'expanded',
  themeClasses,
  hoverClass = '',
}: PromptGenericFilePreviewProps) {
  const isCollapsed = variant === 'collapsed'

  if (isCollapsed) {
    return (
      <div
        className={cn(
          'relative shrink-0 group flex h-6 w-6 items-center justify-center rounded bg-muted',
          themeClasses?.fileItem,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        title={file.name}
      >
        {getFileIcon(file, themeClasses ?? { icon: 'text-zinc-400' })}
        <div className="absolute -bottom-1 -left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
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
            className="absolute -top-0.5 -right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
            aria-label={`Remove ${file.name}`}
            title="Remove"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative shrink-0 group flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm max-w-[240px]',
        themeClasses?.fileItem,
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      title={file.name}
    >
      {getFileIcon(file, themeClasses ?? { icon: 'text-zinc-400' })}
      <span className={cn('truncate text-xs min-w-0 flex-1', themeClasses?.fileText)}>
        {file.name}
      </span>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <SendToPhoneHoverButton
          file={file}
          className="h-6 w-6"
          iconClassName="h-3.5 w-3.5"
        />
      </div>
      {onRemove && (
        <FileRemoveButton
          onClick={() => onRemove()}
          ariaLabel={`Remove ${file.name}`}
          themeClasses={themeClasses ?? { icon: 'text-zinc-400' }}
          hoverClass={hoverClass}
          size="sm"
        />
      )}
    </div>
  )
}
