import { useEffect, useRef } from 'react'
import { useFeature } from '@/contexts/FeatureContext'
import type { ChatMessage } from '@/features/output-window'

interface UseAutoInsertOptions {
  /**
   * Array of messages to watch for new assistant messages
   */
  messages: ChatMessage[]
}

/**
 * Extract plain text from message content (removes markdown formatting)
 */
function getPlainText(content: string): string {
  // Remove markdown code blocks
  let text = content.replace(/```[\s\S]*?```/g, '')
  // Remove inline code
  text = text.replace(/`[^`]*`/g, '')
  // Remove markdown links but keep text
  text = text.replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
  // Remove markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '')
  // Remove markdown bold/italic
  text = text.replace(/\*\*([^*]*)\*\*/g, '$1')
  text = text.replace(/\*([^*]*)\*/g, '$1')
  text = text.replace(/__([^_]*)__/g, '$1')
  text = text.replace(/_([^_]*)_/g, '$1')
  // Remove markdown lists
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

/**
 * Hook that automatically inserts assistant messages into external applications
 * Works independently of output window state (collapsed/expanded, open/close)
 */
export function useAutoInsert({ messages }: UseAutoInsertOptions) {
  const { isFeatureEnabled } = useFeature()
  const isEnabled = isFeatureEnabled('auto-insert')
  const insertedMessageIdsRef = useRef<Set<string>>(new Set())
  const lastMessageCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isEnabled) {
      // Reset tracking when disabled
      insertedMessageIdsRef.current.clear()
      lastMessageCountRef.current = 0
      return
    }

    // Check if there are new assistant messages
    const currentMessageCount = messages.length
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current

    if (!hasNewMessages) {
      return
    }

    // Find new assistant messages that haven't been inserted yet
    const newAssistantMessages = messages
      .filter(msg => 
        msg.role === 'assistant' && 
        !insertedMessageIdsRef.current.has(msg.id) &&
        msg.content.trim().length > 0
      )

    if (newAssistantMessages.length === 0) {
      lastMessageCountRef.current = currentMessageCount
      return
    }

    // Process each new assistant message
    newAssistantMessages.forEach(async (message) => {
      // Mark as inserted immediately to prevent duplicate inserts
      insertedMessageIdsRef.current.add(message.id)

      // Get plain text from message content
      const plainText = getPlainText(message.content)
      
      if (!plainText || plainText.trim().length === 0) {
        return
      }

      // Small delay to ensure message is complete
      setTimeout(async () => {
        if (!window.tsfAPI) {
          console.log('[useAutoInsert] TSF API is not available')
          return
        }

        try {
          // Initialize TSF if needed
          await window.tsfAPI.initialize()

          // Insert text into the last focused application
          const success = await window.tsfAPI.focusAndInsertText(plainText)

          if (success) {
            console.log('[useAutoInsert] Successfully auto-inserted message:', message.id)
          } else {
            console.warn('[useAutoInsert] Failed to auto-insert message:', message.id)
          }
        } catch (error) {
          console.error('[useAutoInsert] Error auto-inserting message:', error)
        }
      }, 300) // Small delay to ensure message is complete
    })

    // Update the last message count
    lastMessageCountRef.current = currentMessageCount
  }, [messages, isEnabled])

  // Clean up inserted IDs when messages are cleared (when array becomes empty)
  useEffect(() => {
    if (messages.length === 0) {
      insertedMessageIdsRef.current.clear()
      lastMessageCountRef.current = 0
    }
  }, [messages.length])
}

