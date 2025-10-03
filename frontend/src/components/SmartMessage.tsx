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
      // Use the fallback method which is more reliable in Electron
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      textArea.style.pointerEvents = 'none'
      document.body.appendChild(textArea)
      
      // Select and copy
      textArea.select()
      textArea.setSelectionRange(0, 99999) // For mobile devices
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        onCopy?.(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        throw new Error('Copy command failed')
      }
    } catch (err) {
      console.error('Failed to copy content:', err)
      // Try modern clipboard API as fallback
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(content)
          onCopy?.(content)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          throw new Error('Clipboard API not available')
        }
      } catch (clipboardErr) {
        console.error('Clipboard API also failed:', clipboardErr)
        // Still show feedback even if copy failed
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const renderContent = () => {
    // Always render as MessageContent for separation
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
    <div className={cn("group mx-2 my-1", className)}>
      <div className={`
        text-white transition-all duration-300 hover:shadow-lg
        ${role === 'assistant' 
            ? 'bg-transparent' 
            : 'bg-blue-600/80 text-center px-6 py-4'
        } 
        ${role === 'assistant' ? 'px-2 py-1' : 'rounded-2xl shadow-md px-4 py-3'} leading-relaxed break-words overflow-hidden
      `}>
        {renderContent()}
      </div>

      {/* Copy button below the message */}
      <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center mt-2 ${
        role === 'user' ? 'justify-end' : 'justify-start'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm rounded-full ${
            copied 
              ? 'bg-green-500/40 text-green-300' 
              : 'bg-black/30'
          }`}
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy message"}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}