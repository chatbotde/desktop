import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  role: 'user' | 'assistant'
  onCopy?: (text: string) => void
}

export function MessageActions({ content, role, onCopy }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)



  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      onCopy?.(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
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

  const handleSendToOutput = () => {
    console.log('📤 Sending to output window:', content.substring(0, 50) + '...')
    if (window.addOutputMessage) {
      window.addOutputMessage(content)
    } else {
      console.warn('⚠️ window.addOutputMessage not available')
    }
  }

  return (
    <div className={cn(
      "opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex mt-3 gap-2",
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


      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-9 p-0 rounded-full transition-all duration-200 backdrop-blur-md",
          "shadow-sm hover:shadow-md",
          "bg-black/40 text-white/70 hover:text-white hover:bg-black/50 border border-white/10 hover:border-white/20"
        )}
        onClick={handleSendToOutput}
        title="Send to output window"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}
