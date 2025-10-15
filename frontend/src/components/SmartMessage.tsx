import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageContent } from './prompt-kit/message'

interface SmartMessageProps {
  content: string
  role: 'user' | 'assistant'
  className?: string
  onCopy?: (text: string) => void
}

export function SmartMessage({ content, role, className, onCopy }: SmartMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Check if content is long enough to need collapsing
  useEffect(() => {
    if (role === 'user' && contentRef.current) {
      const lineHeight = 28 // Updated to match new leading-[1.7] (15px * 1.7 ≈ 25.5, rounded to 28 with spacing)
      const maxCollapsedLines = 3
      const maxHeight = lineHeight * maxCollapsedLines
      
      // Check if scrollHeight exceeds our max collapsed height
      const needsToggle = contentRef.current.scrollHeight > maxHeight + 10
      setShouldShowToggle(needsToggle)
    }
  }, [content, role])

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(content)
      onCopy?.(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback to execCommand for Electron compatibility
      console.warn('Clipboard API failed, using fallback:', err)
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        onCopy?.(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (execErr) {
        console.error('Both clipboard methods failed:', execErr)
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }

  const messageStyles = cn(
    "text-white transition-all duration-300 break-words overflow-hidden relative",
    // Better text rendering and spacing
    "leading-[1.7] tracking-normal font-normal antialiased",
    role === 'assistant' 
      ? 'bg-transparent px-5 py-3' 
      : cn(
          // Enhanced gradient and spacing
          'bg-gradient-to-br from-blue-600/90 via-blue-600/80 to-blue-700/90',
          'px-7 py-6 rounded-2xl shadow-lg border border-blue-500/30',
          // Better hover effects
          'hover:shadow-xl hover:border-blue-400/40 hover:from-blue-600/95 hover:via-blue-600/85 hover:to-blue-700/95',
          // Extra padding at bottom when collapsed
          shouldShowToggle && !isExpanded && 'pb-10'
        ),
    className
  )

  const contentWrapperStyles = cn(
    // Enhanced spacing and overflow handling
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
              "prose prose-invert max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
              // Enhanced text rendering
              "text-[15px] leading-[1.7] tracking-[0.01em]",
              // Better spacing for prose elements
              "[&_p]:mb-3 [&_p]:mt-0",
              "[&_ul]:my-3 [&_ol]:my-3",
              "[&_li]:mb-1.5",
              // Code block improvements
              "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
              "[&_pre]:my-3 [&_pre]:rounded-lg",
              // Inline code with better spacing
              "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
              // Headings with proper spacing
              "[&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2"
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
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "absolute bottom-2.5 right-2.5 flex items-center gap-1.5",
              "text-xs font-medium text-white/90 hover:text-white",
              "bg-blue-700/70 hover:bg-blue-700/90",
              "px-3 py-1.5 rounded-lg",
              "transition-all duration-200",
              "backdrop-blur-md shadow-sm hover:shadow-md",
              "border border-blue-500/30 hover:border-blue-400/50"
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="tracking-wide">Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="tracking-wide">Show more</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Copy button */}
      <div className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex mt-3",
        role === 'user' ? 'justify-end' : 'justify-start'
      )}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 w-9 p-0 rounded-full transition-all duration-200 backdrop-blur-md",
            "shadow-sm hover:shadow-md",
            copied 
              ? 'bg-green-500/50 text-green-200 border border-green-400/40' 
              : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/50 border border-white/10 hover:border-white/20'
          )}
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy message"}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}