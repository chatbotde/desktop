import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormattedOutput, detectContentType, detectLanguage } from './FormattedOutput'
import { MessageContent } from './prompt-kit/message'

interface FormattedMessageProps {
  content: string
  role: 'user' | 'assistant'
  className?: string
  onCopy?: (text: string) => void
}

export function FormattedMessage({ content, role, className, onCopy }: FormattedMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      onCopy?.(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  // Detect if content should be formatted specially
  const contentType = detectContentType(content)
  const language = detectLanguage(content)
  const shouldFormat = role === 'assistant' && (contentType !== 'text' || content.includes('```'))

  const renderContent = () => {
    if (shouldFormat && !showRaw) {
      return (
        <FormattedOutput
          content={content}
          type={contentType}
          language={language}
          showCopy={false} // We handle copy at message level
        />
      )
    }

    // Fallback to regular message content
    return (
      <MessageContent
        markdown={role === 'assistant'}
        className="prose prose-invert max-w-none break-words whitespace-normal bg-transparent p-0"
      >
        {content}
      </MessageContent>
    )
  }

  return (
    <div className={cn("group relative", className)}>
      <div className={`
        backdrop-blur-lg text-white transition-all duration-300 hover:shadow-lg
        ${role === 'assistant' 
          ? 'bg-gray-800/60 hover:bg-gray-800/70 border border-gray-600/20' 
          : 'bg-blue-600/80 hover:bg-blue-600/90 border border-blue-400/30 rounded-br-sm'
        } 
        rounded-2xl shadow-md px-4 py-3 leading-relaxed
      `}>
        {renderContent()}
      </div>

      {/* Action buttons */}
      <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 ${
        role === 'user' ? 'left-2' : 'right-2'
      }`}>
        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm rounded-full ${
            copied 
              ? 'bg-green-500/40 text-green-300' 
              : 'bg-black/30'
          }`}
          onClick={handleCopy}
          title="Copy message"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>

        {/* Toggle raw view for formatted content */}
        {shouldFormat && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm rounded-full bg-black/30"
            onClick={() => setShowRaw(!showRaw)}
            title={showRaw ? "Show formatted" : "Show raw"}
          >
            {showRaw ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}