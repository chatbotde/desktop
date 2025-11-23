import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Square, Copy, Check, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageContent } from './prompt-kit/message'

export interface MediaAttachment {
  id: string
  name: string
  type: string
  size: number
  data: string
  source: string
  mediaType: 'image' | 'video' | 'audio'
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: MediaAttachment[]
}

interface MessagesProps {
  messages: ChatMessage[]
  isTyping: boolean
  isStreaming: boolean
  onCopyMessage: (text: string) => void
  onStopStreaming: () => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}

// Internal SmartMessage component for rendering individual message content
function SmartMessage({ content, role, onCopy }: { content: string; role: 'user' | 'assistant'; onCopy?: (text: string) => void }) {
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

  const handleInsert = async () => {
    console.log('🔘 Insert button clicked');
    
    // Check if we have direct access to tsfAPI (electron window)
    const directApi = (window as any).tsfAPI;
    
    if (directApi) {
      console.log('📍 Using direct tsfAPI');
      try {
        const result = await directApi.focusAndInsertText(content);
        if (result) {
          console.log('✅ Text insertion successful!');
        } else {
          console.warn('⚠️  Insert returned false');
          alert('Failed to insert text. Make sure you clicked on a text editor first.');
        }
      } catch (err) {
        console.error('❌ Error during text insertion:', err);
        alert('Error inserting text: ' + (err as Error).message);
      }
      return;
    }
    
    // If no direct API, use postMessage bridge to parent window
    console.log('🌉 Using postMessage bridge to parent window');
    
    try {
      const callId = Date.now() + Math.random();
      
      // Send message to parent window
      window.parent.postMessage({
        type: 'tsf-api-call',
        method: 'focusAndInsertText',
        args: [content],
        callId
      }, '*');
      
      // Wait for response
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for TSF response'));
        }, 10000);
        
        const handler = (event: MessageEvent) => {
          if (event.data.type === 'tsf-api-response' && event.data.callId === callId) {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data);
          }
        };
        
        window.addEventListener('message', handler);
      });
      
      if (response.success) {
        if (response.result) {
          console.log('✅ Text insertion successful via bridge!');
        } else {
          console.warn('⚠️  Insertion failed, check console for details');
          alert('Failed to insert text. Make sure you clicked on a text editor first.');
        }
      } else {
        console.error('❌ Bridge returned error:', response.error);
        alert('Failed to insert text: ' + response.error);
      }
    } catch (err) {
      console.error('❌ Error using bridge:', err);
      alert('Error inserting text: ' + (err as Error).message);
    }
  }

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
      ? 'bg-transparent px-6 py-4' 
      : cn(
          'bg-blue-600',
          'rounded-2xl',
          'border-7 border-blue-600',
          'shadow-lg shadow-blue-500/20',
          'px-7 py-5', // Increased padding inside border for better spacing
          'hover:shadow-xl hover:shadow-blue-500/30',
          'transition-all duration-300 ease-in-out',
          shouldShowToggle && !isExpanded && 'pb-12'
      )
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
              "absolute bottom-4 left-1/2 -translate-x-1/2 transform flex items-center gap-2 group/expandtoggle",
              "text-xs font-semibold",
              "text-blue-100 hover:text-white",
              "px-5 py-2.5 rounded-full border-2",
              isExpanded
                ? "bg-gradient-to-r from-blue-700 via-blue-600 to-violet-700 border-blue-500 shadow-lg shadow-violet-600/20"
                : "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 border-blue-400/70 shadow-md shadow-blue-700/10",
              "transition-all duration-200 ease-in hover:scale-[1.06] active:scale-95",
              "backdrop-blur-md"
            )}
            style={{
              minWidth: "128px",
              boxShadow: isExpanded
                ? "0 4px 28px 0 oklch(40% 0.12 264 / 25%)"
                : "0 2px 12px 0 oklch(28% 0.15 246 / 16%)"
            }}
          >
            <span className={cn("flex items-center gap-2 w-full justify-center")}>
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 -ml-1 group-hover/expandtoggle:scale-110 transition-transform duration-150" />
                  <span className="tracking-wide">Show less</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-sky-600 to-violet-700 border border-blue-300/40 shadow-sm hover:shadow-md transition-all duration-150">
                    <ChevronDown className="w-5 h-5 mr-1 group-hover/expandtoggle:scale-110 transition-transform duration-150" />
                    <span className="tracking-wide text-[1.07rem] font-medium">Show more</span>
                  </span>
                </>
              )}
            </span>
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

        {/* Insert Button - Only for assistant messages */}
        {role === 'assistant' && (
           <Button
             variant="ghost"
             size="sm"
             className={cn(
               "h-9 w-9 p-0 rounded-full transition-all duration-200 backdrop-blur-md ml-2",
               "shadow-sm hover:shadow-md",
               "bg-black/40 text-white/70 hover:text-white hover:bg-black/50 border border-white/10 hover:border-white/20"
             )}
             onClick={handleInsert}
             title="Insert to last active window"
           >
             <CornerDownLeft className="w-4 h-4" />
           </Button>
        )}
      </div>
    </div>
  )
}

export function Messages({ 
  messages, 
  isTyping, 
  isStreaming,
  onCopyMessage,
  onStopStreaming,
  messagesContainerRef,
  messagesEndRef,
  onScroll
}: MessagesProps) {
  // Auto-scroll to end when new message is sent (especially user messages)
  // Using container.scrollTo instead of scrollIntoView to avoid affecting fixed positioned elements
  useEffect(() => {
    let adjustTimeout: NodeJS.Timeout | null = null
    
    if (messages.length > 0 && messagesContainerRef.current) {
      const lastMessage = messages[messages.length - 1]
      
      // Use setTimeout to ensure DOM has updated
      const scrollTimeout = setTimeout(() => {
        const container = messagesContainerRef.current
        if (!container) return

        if (lastMessage.role === 'user') {
          // For user messages: scroll to the end of the user message specifically
          const userMessages = container.querySelectorAll('[data-message-type="user"]')
          if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1] as HTMLElement
            if (lastUserMessage) {
              // Use requestAnimationFrame to ensure layout is stable before calculating
              requestAnimationFrame(() => {
                // Calculate scroll position relative to container only (not viewport)
                // This prevents affecting fixed positioned elements like floating cards
                const containerRect = container.getBoundingClientRect()
                const messageRect = lastUserMessage.getBoundingClientRect()
                const relativeTop = messageRect.top - containerRect.top + container.scrollTop
                const messageHeight = messageRect.height
                const containerHeight = container.clientHeight
                
                // Scroll to show the bottom of the message
                const targetScroll = relativeTop + messageHeight - containerHeight + 20 // 20px padding
                container.scrollTo({
                  top: Math.max(0, targetScroll),
                  behavior: 'smooth'
                })
              })
            }
          }
        } else if (lastMessage.role === 'assistant' && (isStreaming || isTyping)) {
          // For assistant messages during streaming: scroll to show the message but not all the way to the end
          const assistantMessages = container.querySelectorAll('[data-message-type="assistant"]')
          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1] as HTMLElement
            if (lastAssistantMessage) {
              // Use requestAnimationFrame to ensure layout is stable
              requestAnimationFrame(() => {
                // Calculate scroll position relative to container only
                // This prevents affecting fixed positioned elements like floating cards
                const containerRect = container.getBoundingClientRect()
                const messageRect = lastAssistantMessage.getBoundingClientRect()
                const relativeTop = messageRect.top - containerRect.top + container.scrollTop
                const containerHeight = container.clientHeight
                
                // Scroll to show the message but leave some space at bottom (10% of viewport)
                const targetScroll = relativeTop - (containerHeight * 0.3)
                container.scrollTo({
                  top: Math.max(0, targetScroll),
                  behavior: 'smooth'
                })
              })
            }
          }
        }
      }, 100)
      
      return () => {
        clearTimeout(scrollTimeout)
        if (adjustTimeout) {
          clearTimeout(adjustTimeout)
        }
      }
    }
  }, [messages, isStreaming, isTyping, messagesContainerRef])

  // Extracted media attachment renderer
  const renderMediaAttachment = (attachment: MediaAttachment) => {
    const { mediaType, data, name, dimensions, duration, type } = attachment
    const maxDimensions = { maxWidth: 400, maxHeight: 300 }

    const mediaInfo = (
      <div className="mt-2 text-xs text-gray-400 space-y-0.5">
        <div className="font-medium truncate">{}</div>
        {dimensions && <div>{dimensions.width} × {dimensions.height}</div>}
        {duration && <div>{Math.round(duration)}s</div>}
      </div>
    )

    switch (mediaType) {
      case 'image':
        return (
          <div className="media-attachment">
            <img 
              src={data} 
              alt={name}
              className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
              style={maxDimensions}
            />
            {mediaInfo}
          </div>
        )
      
      case 'video':
        return (
          <div className="media-attachment">
            <video 
              controls 
              preload="metadata"
              className="max-w-full max-h-64 rounded-lg border border-gray-600/20"
              style={maxDimensions}
            >
              <source src={data} type={type} />
              Your browser does not support the video element.
            </video>
            {mediaInfo}
          </div>
        )
      
      case 'audio':
        return (
          <div className="media-attachment">
            <audio controls preload="metadata" className="w-full">
              <source src={data} type={type} />
              Your browser does not support the audio element.
            </audio>
            {mediaInfo}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col relative h-full">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="px-4 md:px-8 lg:px-12 py-6 space-y-6 min-h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            data-message-type={message.role}
            className={`message-appear flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`break-words overflow-hidden ${
              message.role === 'user' ? 'max-w-[85%] md:max-w-[75%] lg:max-w-[65%]' : 'max-w-[90%] md:max-w-[85%] lg:max-w-[75%]'
            }`}>
              {/* Media attachments (if any) */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {renderMediaAttachment(attachment)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Message content */}
              {message.content && (
                <SmartMessage
                  content={message.content}
                  role={message.role}
                  onCopy={onCopyMessage}
                />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start message-appear">
            <div className="bg-transparent text-white px-4 py-2 max-w-[90%] md:max-w-[85%] lg:max-w-[75%]">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70 mr-2">AI is thinking</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Stop Streaming Button */}
      {isStreaming && (
        <div className="absolute bottom-4 right-4 z-30">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 flex items-center justify-center bg-oklch(12.9% 0.042 264.695) from-red-500 via-red-600 to-rose-500 text-white rounded-full border-2 border-white/40 backdrop-blur-lg shadow-xl hover:scale-105 transition-transform duration-150 p-0"
            onClick={onStopStreaming}
            title="Stop streaming"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            
          </Button>
        </div>
      )}
    </div>
  )
}