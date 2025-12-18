import { useState, useCallback, useRef } from 'react'
import { createChatMessage } from '@/utils/message-utils'
import type { ChatMessage, MediaAttachment } from '@/components/output-window/types'
import { sendMessageComplete as sendCloudMessageComplete } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

export const useMessageManager = (_outputWindowEnabled: boolean) => {
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSendMessage = useCallback(async (message: string, attachments?: MediaAttachment[]) => {
    // Create abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Add user message immediately
    const userMessage = createChatMessage(message, 'user', attachments)
    setOutputMessages(prev => [...prev, userMessage])
    setIsWaitingForResponse(true)

    // Convert MediaAttachment to the format expected by AI service
    const aiAttachments: import('@/lib/ai/gemini').MediaAttachment[] | undefined = attachments?.map(att => ({
      id: att.id,
      name: att.name,
      type: att.type,
      size: att.size,
      data: att.data,
      source: att.source,
      mediaType: att.mediaType,
      dimensions: att.dimensions,
      duration: att.duration
    }))

    // Request assistant response
    try {
      // Check if aborted before starting
      if (abortController.signal.aborted) {
        return
      }

      // If a local model is selected, use Ollama (local LLM). Otherwise use cloud router.
      const localModel = unifiedLocalLLMService.getCurrentModel()
      const replyText = localModel
        ? await (async () => {
          const init = await unifiedLocalLLMService.initialize()
          if (!init.success) {
            throw new Error(init.message)
          }
          // Check if aborted
          if (abortController.signal.aborted) {
            return ''
          }
          return await unifiedLocalLLMService.sendMessageComplete(
            message,
            aiAttachments,
            localModel.name
          )
        })()
        : await sendCloudMessageComplete(message, aiAttachments)

      // Check if aborted before adding response
      if (abortController.signal.aborted) {
        return
      }

      const assistantMessage = createChatMessage(replyText, 'assistant')
      setOutputMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Don't show error if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error'

      const errorResponse = createChatMessage(
        `Sorry, I could not get a response right now. (${errorMessage})`,
        'assistant'
      )
      setOutputMessages(prev => [...prev, errorResponse])
      console.error('AI response failed:', err)
    } finally {
      setIsWaitingForResponse(false)
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('Stopping message generation...')
      abortControllerRef.current.abort()
      setIsWaitingForResponse(false)
      abortControllerRef.current = null
    }
  }, [])

  const addMessage = useCallback((message: string, role: 'user' | 'assistant' = 'assistant') => {
    const newMessage = createChatMessage(message, role)
    setOutputMessages(prev => [...prev, newMessage])
  }, [])

  const clearMessages = useCallback(() => {
    setOutputMessages([])
  }, [])

  return {
    outputMessages,
    isWaitingForResponse,
    handleSendMessage,
    handleStop,
    addMessage,
    clearMessages,
    setOutputMessages
  }
}
