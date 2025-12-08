import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, CornerDownLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  role: 'user' | 'assistant'
  onCopy?: (text: string) => void
}

export function MessageActions({ content, role, onCopy }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleInsert = async () => {
    console.log('🔘 Insert button clicked')
    
    const directApi = (window as any).tsfAPI
    
    if (directApi) {
      console.log('📍 Using direct tsfAPI')
      try {
        const result = await directApi.focusAndInsertText(content)
        if (result) {
          console.log('✅ Text insertion successful!')
        } else {
          console.warn('⚠️  Insert returned false')
          alert('Failed to insert text. Make sure you clicked on a text editor first.')
        }
      } catch (err) {
        console.error('❌ Error during text insertion:', err)
        alert('Error inserting text: ' + (err as Error).message)
      }
      return
    }
    
    console.log('🌉 Using postMessage bridge to parent window')
    
    try {
      const callId = Date.now() + Math.random()
      
      window.parent.postMessage({
        type: 'tsf-api-call',
        method: 'focusAndInsertText',
        args: [content],
        callId
      }, '*')
      
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler)
          reject(new Error('Timeout waiting for TSF response'))
        }, 10000)
        
        const handler = (event: MessageEvent) => {
          if (event.data.type === 'tsf-api-response' && event.data.callId === callId) {
            clearTimeout(timeout)
            window.removeEventListener('message', handler)
            resolve(event.data)
          }
        }
        
        window.addEventListener('message', handler)
      })
      
      if (response.success) {
        if (response.result) {
          console.log('✅ Text insertion successful via bridge!')
        } else {
          console.warn('⚠️  Insertion failed, check console for details')
          alert('Failed to insert text. Make sure you clicked on a text editor first.')
        }
      } else {
        console.error('❌ Bridge returned error:', response.error)
        alert('Failed to insert text: ' + response.error)
      }
    } catch (err) {
      console.error('❌ Error using bridge:', err)
      alert('Error inserting text: ' + (err as Error).message)
    }
  }

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

      {role === 'assistant' && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 w-9 p-0 rounded-full transition-all duration-200 backdrop-blur-md",
            "shadow-sm hover:shadow-md",
            "bg-black/40 text-white/70 hover:text-white hover:bg-black/50 border border-white/10 hover:border-white/20"
          )}
          onClick={handleInsert}
          title="Insert to last active window"
        >
          <CornerDownLeft className="w-4 h-4" />
        </Button>
      )}

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
