import { useCallback } from 'react'
import { buildAskPrompt, buildExplainPrompt } from '@/lib/prompt'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

interface UseTextSelectionActionsProps {
  onSendMessage: (message: string) => Promise<void>
  outputWindowEnabled: boolean
  setExplanation: (explanation: string | undefined) => void
  setExplanationPosition: (position: { x: number; y: number } | undefined) => void
  setIsInputVisible: (visible: boolean) => void
  setIsOutputVisible: (visible: boolean) => void
}

export const useTextSelectionActions = ({
  onSendMessage,
  outputWindowEnabled,
  setExplanation,
  setExplanationPosition,
  setIsInputVisible,
  setIsOutputVisible
}: UseTextSelectionActionsProps) => {
  const handleAddSelectedTextToPrompt = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    // Ensure prompt input is visible and append as a "clipboard item"
    setIsInputVisible(true)
    window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: trimmed } }))
  }, [setIsInputVisible])

  const handleAskSelectedText = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Use centralized prompt builder
    const prompt = buildAskPrompt({
      selectedText: trimmed,
      includeLabel: true,
    })

    await onSendMessage(prompt)
  }, [onSendMessage])

  const handleExplainSelectedText = useCallback(async (text: string, position?: { x: number; y: number }) => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Store the position for dynamic positioning
    if (position) {
      setExplanationPosition(position)
    }

    try {
      // Request explanation from AI using centralized prompt builder
      const prompt = buildExplainPrompt({
        selectedText: trimmed,
        style: 'clear',
        includeQuotes: true,
      })

      const localModel = unifiedLocalLLMService.getCurrentModel()
      
      let responseStream: AsyncGenerator<string, void, unknown>;
      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) {
          throw new Error(init.message)
        }
        responseStream = await unifiedLocalLLMService.sendMessage(prompt, undefined, localModel.name)
      } else {
        responseStream = await sendCloudMessage(prompt)
      }

      // Stream the response and accumulate text
      let fullResponse = ''
      for await (const chunk of responseStream) {
        fullResponse += chunk
        // Update explanation in real-time as it streams
        setExplanation(fullResponse)
      }

      const explanationText = fullResponse
      setExplanation(explanationText)
      if (outputWindowEnabled) setIsOutputVisible(true)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error'
      setExplanation(`Sorry, I could not explain this text. (${errorMessage})`)
      if (outputWindowEnabled) setIsOutputVisible(true)
      console.error('Explanation failed:', err)
    }
  }, [outputWindowEnabled, setExplanation, setExplanationPosition, setIsOutputVisible])

  return {
    handleAddSelectedTextToPrompt,
    handleAskSelectedText,
    handleExplainSelectedText
  }
}
