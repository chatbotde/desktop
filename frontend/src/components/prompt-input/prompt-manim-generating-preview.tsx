import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptManimGeneratingPreviewProps {
  topic?: string
  className?: string
  variant?: 'expanded' | 'collapsed'
  label?: string
}

export function PromptManimGeneratingPreview({
  topic,
  className,
  variant = 'expanded',
  label = 'Rendering',
}: PromptManimGeneratingPreviewProps) {
  const isCollapsed = variant === 'collapsed'
  const sizeClass = isCollapsed ? 'h-6 w-10' : 'h-14 w-24'

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md border border-purple-500/30 bg-zinc-900',
        sizeClass,
        className,
      )}
      title={topic ? `${label}: ${topic}` : `${label} Manim video`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1">
        <Loader2 className={cn('animate-spin text-purple-400', isCollapsed ? 'h-3 w-3' : 'h-4 w-4')} />
        {!isCollapsed && (
          <span className="text-[9px] font-medium text-purple-200/90">{label}</span>
        )}
      </div>
    </div>
  )
}
