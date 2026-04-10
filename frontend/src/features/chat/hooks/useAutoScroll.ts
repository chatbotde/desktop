import { useSyncExternalStore, useCallback } from 'react'

interface UseAutoScrollProps {
  messages: any[]
  isStreaming: boolean
  isTyping: boolean
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Custom hook to handle auto-scrolling behavior for message containers
 * Scrolls to user messages immediately and assistant messages during streaming
 */
export function useAutoScroll({ 
  messages, 
  isStreaming, 
  isTyping, 
  messagesContainerRef 
}: UseAutoScrollProps) {
  useSyncExternalStore(
    useCallback((_callback) => {
      let adjustTimeout: NodeJS.Timeout | null = null
      
      if (messages.length > 0 && messagesContainerRef.current) {
        const lastMessage = messages[messages.length - 1]
        
        const scrollTimeout = setTimeout(() => {
          const container = messagesContainerRef.current
          if (!container) return

          if (lastMessage.role === 'user') {
            const userMessages = container.querySelectorAll('[data-message-type="user"]')
            if (userMessages.length > 0) {
              const lastUserMessage = userMessages[userMessages.length - 1] as HTMLElement
              if (lastUserMessage) {
                requestAnimationFrame(() => {
                  const containerRect = container.getBoundingClientRect()
                  const messageRect = lastUserMessage.getBoundingClientRect()
                  const relativeTop = messageRect.top - containerRect.top + container.scrollTop
                  const messageHeight = messageRect.height
                  const containerHeight = container.clientHeight
                  
                  const targetScroll = relativeTop + messageHeight - containerHeight + 20
                  container.scrollTo({
                    top: Math.max(0, targetScroll),
                    behavior: 'smooth'
                  })
                })
              }
            }
          } else if (lastMessage.role === 'assistant' && (isStreaming || isTyping)) {
            const assistantMessages = container.querySelectorAll('[data-message-type="assistant"]')
            if (assistantMessages.length > 0) {
              const lastAssistantMessage = assistantMessages[assistantMessages.length - 1] as HTMLElement
              if (lastAssistantMessage) {
                requestAnimationFrame(() => {
                  const containerRect = container.getBoundingClientRect()
                  const messageRect = lastAssistantMessage.getBoundingClientRect()
                  const relativeTop = messageRect.top - containerRect.top + container.scrollTop
                  const containerHeight = container.clientHeight
                  
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
      return () => {}
    }, [messages, isStreaming, isTyping, messagesContainerRef]),
    () => null,
    () => null
  )
}
