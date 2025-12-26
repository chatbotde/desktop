import { useState, useCallback } from 'react'
import { sendMessageComplete as sendCloudMessageComplete } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { buildVoiceRewritePromptFromLiveTranscription } from '@/lib/prompt'

export function useAiSuggestion() {
    const [aiSuggestion, setAiSuggestion] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)

    const generateSuggestion = useCallback(async (transcriptionText: string, partialText: string) => {
        const fullText = `${transcriptionText} ${partialText}`.trim()
        if (!fullText) return

        setIsGenerating(true)
        setAiError(null)

        try {
            const prompt = buildVoiceRewritePromptFromLiveTranscription(fullText)

            const localModel = unifiedLocalLLMService.getCurrentModel()
            const replyText = localModel
                ? await (async () => {
                    const init = await unifiedLocalLLMService.initialize()
                    if (!init.success) {
                        throw new Error(init.message)
                    }
                    return await unifiedLocalLLMService.sendMessageComplete(prompt, undefined, localModel.name)
                })()
                : await sendCloudMessageComplete(prompt)

            const suggestion = replyText.trim()
            setAiSuggestion(suggestion)

            // Automatically insert and send
            try {
                window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: suggestion } }))
                window.dispatchEvent(new Event('prompt-send-now'))
            } catch (error) {
                console.error('[AI Suggestion] Failed to auto-send generated prompt:', error)
            }
        } catch (error) {
            console.error('[AI Suggestion] Generation failed:', error)
            setAiError(error instanceof Error ? error.message : 'Failed to generate prompt from transcription')
        } finally {
            setIsGenerating(false)
        }
    }, [])

    const clearSuggestion = useCallback(() => {
        setAiSuggestion('')
        setAiError(null)
    }, [])

    return {
        aiSuggestion,
        isGenerating,
        aiError,
        generateSuggestion,
        clearSuggestion,
        setAiSuggestion
    }
}
