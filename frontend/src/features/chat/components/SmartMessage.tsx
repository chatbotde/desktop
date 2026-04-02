import { useState, useRef, useSyncExternalStore, useCallback } from 'react'
import { cn } from '@/shared/lib'
import { MessageContent } from '@/components/prompt-kit/message'
import { MessageActions } from './MessageActions'
import { ExpandToggle } from './ExpandToggle'

interface SmartMessageProps {
  content: string
  role: 'user' | 'assistant'
  onCopy?: (text: string) => void
}

export function SmartMessage({ content, role, onCopy }: SmartMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Check if content is long enough to need collapsing - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
      if (role === 'user' && contentRef.current) {
        const lineHeight = 28
        const maxCollapsedLines = 3
        const maxHeight = lineHeight * maxCollapsedLines
        
        const needsToggle = contentRef.current.scrollHeight > maxHeight + 10
        setShouldShowToggle(needsToggle)
      }
      return () => {}
    }, [content, role]),
    () => null,
    () => null
  )

  const messageStyles = cn(
    "text-white transition-all duration-300 break-words overflow-hidden relative",
    "leading-[1.7] tracking-normal font-normal antialiased",
    role === 'assistant' 
      ? 'bg-transparent px-6 py-4' 
      : cn(
          'bg-blue-600',
          'rounded-2xl',
          'border-7 border-blue-600',
          'shadow-lg shadow-blue-500/20',
          'px-7 py-5',
          'hover:shadow-xl hover:shadow-blue-500/30',
          'transition-all duration-300 ease-in-out',
          shouldShowToggle && !isExpanded && 'pb-12'
      )
  )

  const contentWrapperStyles = cn(
    role === 'user' && shouldShowToggle && !isExpanded && 'max-h-[84px] overflow-hidden relative',
    "transition-all duration-300 ease-in-out"
  )

  return (
    <div className="group w-full">
      <div className={messageStyles}>
        <div 
          ref={contentRef}
          className={contentWrapperStyles}
        >
          <MessageContent
            markdown={role === 'assistant'}
            className={cn(
              role === 'assistant'
                ? "prose prose-invert max-w-none break-words whitespace-pre-wrap bg-transparent p-0"
                : "max-w-none break-words whitespace-pre-wrap bg-transparent p-0 !text-white",
              "text-[15px] leading-[1.7] tracking-[0.01em]",
              "[&_p]:mb-3 [&_p]:mt-0",
              "[&_ul]:my-3 [&_ol]:my-3",
              "[&_li]:mb-1.5",
              "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
              "[&_pre]:my-3 [&_pre]:rounded-lg",
              "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
              "[&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2",
              // Math equation styling - allow multi-line rendering
              "[&_.math-block]:my-4 [&_.math-block]:w-full [&_.math-block]:overflow-x-auto [&_.math-block]:overflow-y-visible",
              "[&_.math-inline]:inline [&_.math-inline]:align-middle",
              "[&_.katex]:!text-current [&_.katex-display]:!block [&_.katex-display]:!w-full",
              "[&_.katex-display_.katex]:!max-w-full [&_.katex-display_.katex]:!overflow-x-auto",
              role === 'assistant' 
                ? "[&_.katex]:!text-white [&_.math-block]:bg-white/5 [&_.math-inline]:bg-white/5"
                : "[&_.katex]:!text-white [&_.math-block]:bg-white/10 [&_.math-inline]:bg-white/10",
              // Force white text for assistant messages on dark background
              role === 'assistant' && "!text-white [&_*]:!text-white [&_p]:!text-white [&_span]:!text-white [&_div]:!text-white [&_strong]:!text-white [&_code]:!text-white"
            )}
          >
            {content}
          </MessageContent>
          
          {/* Gradient fade for collapsed state */}
          {role === 'user' && shouldShowToggle && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-600/95 via-blue-600/70 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand/Collapse button for user messages */}
        {role === 'user' && shouldShowToggle && (
          <ExpandToggle 
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        )}
      </div>

      <MessageActions content={content} role={role} onCopy={onCopy} />
    </div>
  )
}
