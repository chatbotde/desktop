import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { createChatMessage } from '@/utils/message-utils'
import type { ChatMessage, MediaAttachment } from '../types'
import { sendMessage as sendCloudMessage, unifiedAIService } from '@/lib/ai'
import type { SendMessageOptions } from '../types/send-message-options'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { getSelectedModel } from '@/lib/ai/model-config'

interface UseMessageManagerProps {
  setGeneratedImages?: Dispatch<SetStateAction<string[]>>
  setIsImageWindowVisible?: (visible: boolean) => void
  setIsGeneratingImages?: (loading: boolean) => void
  setImageGenerationError?: (error: string | null) => void
  setGeneratedVideos?: Dispatch<SetStateAction<string[]>>
  setIsVideoWindowVisible?: (visible: boolean) => void
  setIsGeneratingVideos?: (loading: boolean) => void
  setVideoGenerationError?: (error: string | null) => void
}

export const useMessageManager = (
  _outputWindowEnabled: boolean,
  callbacks?: UseMessageManagerProps,
  imageWindowEnabled = true,
  videoWindowEnabled = true,
) => {
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const callbacksRef = useRef(callbacks)
  const imageWindowEnabledRef = useRef(imageWindowEnabled)
  const videoWindowEnabledRef = useRef(videoWindowEnabled)

  callbacksRef.current = callbacks
  imageWindowEnabledRef.current = imageWindowEnabled
  videoWindowEnabledRef.current = videoWindowEnabled

  const handleSendMessage = useCallback(async (
    message: string,
    attachments?: MediaAttachment[],
    options?: SendMessageOptions
  ) => {
    const callbacks = callbacksRef.current
    const imageWindowEnabled = imageWindowEnabledRef.current
    const videoWindowEnabled = videoWindowEnabledRef.current
    // Create abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Check if selected model is a media generation model BEFORE adding messages
    const selectedModel = getSelectedModel()
    const selectedModelKey = `${selectedModel?.id ?? ''} ${selectedModel?.name ?? ''}`.toLowerCase()
    const isImageModel =
      selectedModel?.category === 'image-generation' ||
      selectedModelKey.includes('gemini-2.5-flash-image')
    const isVideoModel = selectedModel?.category === 'video-generation'
    const isMediaModel = isImageModel || isVideoModel

    // Only add user message to output if NOT a media generation model
    // Media generation is handled separately and doesn't use the output window
    if (!isMediaModel) {
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
        if (imageWindowEnabled) {
          if (callbacks?.setIsImageWindowVisible) {
            callbacks.setIsImageWindowVisible(true)
          }
          if (callbacks?.setIsGeneratingImages) {
            callbacks.setIsGeneratingImages(true)
          }
          if (callbacks?.setImageGenerationError) {
            callbacks.setImageGenerationError(null)
          }
        }

        try {
          // Handle image generation - don't add to output messages
          const modelName = selectedModel?.provider === 'google'
            ? selectedModel.id
            : selectedModel?.name
          const generatedImages = await unifiedAIService.generateImages(message, modelName)

          // Check if aborted before adding response
          if (abortController.signal.aborted) {
            if (callbacks?.setIsGeneratingImages) {
              callbacks.setIsGeneratingImages(false)
            }
            return
          }

          // Append to stack so previous images are kept
          if (imageWindowEnabled) {
            if (callbacks?.setGeneratedImages) {
              callbacks.setGeneratedImages((prev: string[]) => {
                const next = [...prev]
                for (const url of generatedImages) {
                  if (!next.includes(url)) next.push(url)
                }
                return next
              })
            }
            if (callbacks?.setIsImageWindowVisible) {
              callbacks.setIsImageWindowVisible(true)
            }
            if (callbacks?.setImageGenerationError) {
              callbacks.setImageGenerationError(null)
            }

            // Hide loading state
            if (callbacks?.setIsGeneratingImages) {
              callbacks.setIsGeneratingImages(false)
            }
          }

          // Don't add image generation to messages - it's shown separately
          return
        } catch (error) {
          if (imageWindowEnabled) {
            if (callbacks?.setIsGeneratingImages) {
              callbacks.setIsGeneratingImages(false)
            }
            if (callbacks?.setImageGenerationError) {
              callbacks.setImageGenerationError(error instanceof Error ? error.message : String(error))
            }
          }
          throw error
        }
      } else if (isVideoModel) {
        if (videoWindowEnabled) {
          if (callbacks?.setIsVideoWindowVisible) {
            callbacks.setIsVideoWindowVisible(true)
          }
          if (callbacks?.setIsGeneratingVideos) {
            callbacks.setIsGeneratingVideos(true)
          }
          if (callbacks?.setVideoGenerationError) {
            callbacks.setVideoGenerationError(null)
          }
        }

        try {
          const modelName = selectedModel?.name
          const generatedVideos = await unifiedAIService.generateVideos(message, modelName)

          if (abortController.signal.aborted) {
            if (callbacks?.setIsGeneratingVideos) {
              callbacks.setIsGeneratingVideos(false)
            }
            return
          }

          if (videoWindowEnabled) {
            if (callbacks?.setGeneratedVideos) {
              callbacks.setGeneratedVideos((prev: string[]) => {
                const next = [...prev]
                for (const url of generatedVideos) {
                  if (!next.includes(url)) next.push(url)
                }
                return next
              })
            }
            if (callbacks?.setIsVideoWindowVisible) {
              callbacks.setIsVideoWindowVisible(true)
            }
            if (callbacks?.setVideoGenerationError) {
              callbacks.setVideoGenerationError(null)
            }
            if (callbacks?.setIsGeneratingVideos) {
              callbacks.setIsGeneratingVideos(false)
            }
          }

          return
        } catch (error) {
          if (videoWindowEnabled) {
            if (callbacks?.setIsGeneratingVideos) {
              callbacks.setIsGeneratingVideos(false)
            }
            if (callbacks?.setVideoGenerationError) {
              callbacks.setVideoGenerationError(error instanceof Error ? error.message : String(error))
            }
          }
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
          responseStream = await sendCloudMessage(message, aiAttachments, options)
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

      // For media generation errors, show in console but don't add to output window
      if (isImageModel) {
        console.error('Image generation failed:', err)
        if (imageWindowEnabled) {
          if (callbacks?.setIsGeneratingImages) {
            callbacks.setIsGeneratingImages(false)
          }
          if (callbacks?.setImageGenerationError) {
            callbacks.setImageGenerationError(errorMessage)
          }
        }
        throw err
      }

      if (isVideoModel) {
        console.error('Video generation failed:', err)
        if (videoWindowEnabled) {
          if (callbacks?.setIsGeneratingVideos) {
            callbacks.setIsGeneratingVideos(false)
          }
          if (callbacks?.setVideoGenerationError) {
            callbacks.setVideoGenerationError(errorMessage)
          }
        }
        throw err
      }

      // For regular messages, add error to output window
      const errorResponse = createChatMessage(
        `Sorry, I could not get a response right now. (${errorMessage})`,
        'assistant'
      )
      setOutputMessages(prev => [...prev, errorResponse])
      console.error('AI response failed:', err)
    } finally {
      // Only set waiting to false if we were actually waiting (not a media model)
      if (!isMediaModel) {
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
      abortControllerRef.current = null
    }
    setIsWaitingForResponse(false)
    const cb = callbacksRef.current
    cb?.setIsGeneratingImages?.(false)
    cb?.setIsGeneratingVideos?.(false)
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
