import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
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
    "text-white transition-all duration-300 hover:shadow-lg leading-relaxed break-words overflow-hidden",
    role === 'assistant' 
      ? 'bg-transparent px-2 py-1' 
      : 'bg-blue-600/80 text-center px-6 py-4 rounded-2xl shadow-md',
    className
  )

  return (
    <div className="group mx-2 my-1">
      <div className={messageStyles}>
        <MessageContent
          markdown={role === 'assistant'}
          className="prose prose-invert max-w-none break-words whitespace-normal bg-transparent p-0"
        >
          {content}
        </MessageContent>
      </div>

      {/* Copy button */}
      <div className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex mt-2",
        role === 'user' ? 'justify-end' : 'justify-start'
      )}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-200 backdrop-blur-sm",
            copied 
              ? 'bg-green-500/40 text-green-300' 
              : 'bg-black/30 text-white/70 hover:text-white hover:bg-white/20'
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