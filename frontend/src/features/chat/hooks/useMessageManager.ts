import { useState, useCallback, useRef } from 'react'
import { createChatMessage } from '@/utils/message-utils'
import type { ChatMessage, MediaAttachment } from '../types'
import { sendMessage as sendCloudMessage, unifiedAIService } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { getSelectedModel } from '@/lib/ai/model-config'

interface UseMessageManagerProps {
  setGeneratedImages?: (images: string[]) => void
  setIsImageWindowVisible?: (visible: boolean) => void
  setIsGeneratingImages?: (loading: boolean) => void
}

export const useMessageManager = (
  _outputWindowEnabled: boolean,
  callbacks?: UseMessageManagerProps
) => {
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSendMessage = useCallback(async (message: string, attachments?: MediaAttachment[]) => {
    // Create abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Check if selected model is an image generation model BEFORE adding messages
    const selectedModel = getSelectedModel()
    const isImageModel = selectedModel?.category === 'image-generation' || selectedModel?.provider === 'replicate'

    // Only add user message to output if NOT an image model
    // Image generation is handled separately and doesn't use the output window
    if (!isImageModel) {
      const userMessage = createChatMessage(message, 'user', attachments)
      setOutputMessages(prev => [...prev, userMessage])
      setIsWaitingForResponse(true)
    }

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

      if (isImageModel) {
        // Show loading state and window immediately
        if (callbacks?.setIsImageWindowVisible) {
          callbacks.setIsImageWindowVisible(true)
        }
        if (callbacks?.setIsGeneratingImages) {
          callbacks.setIsGeneratingImages(true)
        }

        try {
          // Handle image generation - don't add to output messages
          const modelName = selectedModel?.name
          const generatedImages = await unifiedAIService.generateImages(message, modelName)
          
          // Check if aborted before adding response
          if (abortController.signal.aborted) {
            if (callbacks?.setIsGeneratingImages) {
              callbacks.setIsGeneratingImages(false)
            }
            return
          }

          // Store images in UI state
          if (callbacks?.setGeneratedImages) {
            callbacks.setGeneratedImages(generatedImages)
          }
          
          // Hide loading state
          if (callbacks?.setIsGeneratingImages) {
            callbacks.setIsGeneratingImages(false)
          }

          // Don't add image generation to messages - it's shown separately
          return
        } catch (error) {
          // Hide loading state on error
          if (callbacks?.setIsGeneratingImages) {
            callbacks.setIsGeneratingImages(false)
          }
          // Re-throw to be handled by outer catch
          throw error
        }
      } else {
        // If a local model is selected, use Ollama (local LLM). Otherwise use cloud router.
        const localModel = unifiedLocalLLMService.getCurrentModel()
        
        let responseStream: AsyncGenerator<string, void, unknown>;
        
        if (localModel) {
          const init = await unifiedLocalLLMService.initialize()
          if (!init.success) {
            throw new Error(init.message)
          }
          // Check if aborted
          if (abortController.signal.aborted) {
            return
          }
          responseStream = await unifiedLocalLLMService.sendMessage(
            message,
            aiAttachments,
            localModel.name
          )
        } else {
          responseStream = await sendCloudMessage(message, aiAttachments)
        }

        // Check if aborted before starting stream
        if (abortController.signal.aborted) {
          return
        }

        // Create assistant message with empty content initially
        const assistantMessageId = `assistant_${Date.now()}`
        const assistantMessage = createChatMessage('', 'assistant')
        assistantMessage.id = assistantMessageId
        setOutputMessages(prev => [...prev, assistantMessage])

        // Stream the response content
        let fullResponse = ''
        try {
          for await (const chunk of responseStream) {
            // Check if aborted during streaming
            if (abortController.signal.aborted) {
              break
            }
            
            fullResponse += chunk
            
            // Update the assistant message with accumulated content
            setOutputMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: fullResponse }
                : msg
            ))
          }
        } catch (streamError) {
          // If aborted, don't show error
          if (abortController.signal.aborted) {
            return
          }
          throw streamError
        }
      }
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

      // For image generation errors, show in console but don't add to output window
      if (isImageModel) {
        console.error('Image generation failed:', err)
        // Hide loading state
        if (callbacks?.setIsGeneratingImages) {
          callbacks.setIsGeneratingImages(false)
        }
        return
      }

      // For regular messages, add error to output window
      const errorResponse = createChatMessage(
        `Sorry, I could not get a response right now. (${errorMessage})`,
        'assistant'
      )
      setOutputMessages(prev => [...prev, errorResponse])
      console.error('AI response failed:', err)
    } finally {
      // Only set waiting to false if we were actually waiting (not image model)
      if (!isImageModel) {
        setIsWaitingForResponse(false)
      }
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
