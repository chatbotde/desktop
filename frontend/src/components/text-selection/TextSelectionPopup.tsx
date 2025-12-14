import { useState, useEffect, useCallback } from 'react'
import { TextSelectionInput } from './text-selection'
import { TextSelectionOutput } from './text-selection-output'
import { useFeature } from '@/contexts/FeatureContext'
import { sendMessageComplete as sendCloudMessageComplete } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'

interface SelectionData {
  text: string
  programName?: string
  mousePosStart?: { x: number; y: number }
  mousePosEnd?: { x: number; y: number }
  startTop?: { x: number; y: number }
  endBottom?: { x: number; y: number }
  method?: number
  posLevel?: number
  [key: string]: unknown
}

declare global {
  interface Window {
    interfaceAPI?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      setIgnoreMouseEvents?: (ignore: boolean, options?: { forward?: boolean }) => void
      onMessage?: (channel: string, callback: (...args: unknown[]) => void) => void
      removeMessageListener?: (channel: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

interface TextSelectionPopupProps {
  onSendMessage: (message: string) => Promise<void>
}

export function TextSelectionPopup({ onSendMessage }: TextSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const { isFeatureEnabled } = useFeature()

  useEffect(() => {
    // Don't listen for text selection if feature is disabled
    if (!isFeatureEnabled('text-selection')) {
      // Hide popup if feature is disabled
      setIsVisible(false)
      return
    }

    const handleSelectionChange = (data: SelectionData) => {
      // Double check feature is enabled before showing
      if (!isFeatureEnabled('text-selection')) {
        return
      }

      if (!data?.text?.trim()) return

      setSelectionData(data)
      setPrompt('')

      const popupWidth = 400
      const popupHeight = 120

      const mouseX = data.mousePosEnd?.x ?? data.mousePosStart?.x ?? window.innerWidth / 2
      const mouseY = data.mousePosEnd?.y ?? data.mousePosStart?.y ?? window.innerHeight / 2

      let x = mouseX
      let y = mouseY + 15

      if (x + popupWidth > window.innerWidth) {
        x = window.innerWidth - popupWidth - 20
      }
      if (x < 20) {
        x = 20
      }
      if (y + popupHeight > window.innerHeight) {
        y = mouseY - popupHeight - 15
      }
      if (y < 10) {
        y = 10
      }

      setPosition({ top: y, left: x })
      setIsVisible(true)
    }

    if (window.interfaceAPI?.onMessage) {
      window.interfaceAPI.onMessage('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
    }

    return () => {
      // Clean up listener when component unmounts or feature is disabled
      if (window.interfaceAPI?.removeMessageListener) {
        window.interfaceAPI.removeMessageListener('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
      }
    }
  }, [isFeatureEnabled])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setPrompt('')
    setIsLoading(false)
    setIsGenerating(false)
    setGeneratedOutput(null)
  }, [])

  // Hide popup if feature is disabled
  useEffect(() => {
    if (!isFeatureEnabled('text-selection')) {
      setIsVisible(false)
    }
  }, [isFeatureEnabled])

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isLoading || isGenerating) return

    let message = prompt.trim()
    if (selectionData?.text) {
      message = `${message}\n\nSelected text:\n"${selectionData.text}"`
    }

    setIsLoading(true)

    try {
      await onSendMessage(message)
      handleClose()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }, [prompt, selectionData, isLoading, isGenerating, onSendMessage, handleClose])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating || isLoading) return

    let message = prompt.trim()
    if (selectionData?.text) {
      message = `${message}\n\nSelected text:\n"${selectionData.text}"`
    }

    setIsGenerating(true)
    setGeneratedOutput(null)

    try {
      // Use the same AI service logic as handleSendMessage
      const localModel = unifiedLocalLLMService.getCurrentModel()
      const replyText = localModel
        ? await (async () => {
            const init = await unifiedLocalLLMService.initialize()
            if (!init.success) {
              throw new Error(init.message)
            }
            return await unifiedLocalLLMService.sendMessageComplete(
              message,
              undefined,
              localModel.name
            )
          })()
        : await sendCloudMessageComplete(message, undefined)

      setGeneratedOutput(replyText)
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error'
      setGeneratedOutput(`Sorry, I could not generate a response right now. (${errorMessage})`)
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectionData, isGenerating, isLoading])

  const handleInsert = useCallback(async () => {
    if (!generatedOutput) return
    
    try {
      // Use TSF API to insert text at the cursor position
      if (window.tsfAPI?.focusAndInsertText) {
        const success = await window.tsfAPI.focusAndInsertText(generatedOutput)
        if (success) {
          console.log('Text inserted successfully')
          // Optionally close the popup after insertion
          // handleClose()
        } else {
          console.error('Failed to insert text')
        }
      } else {
        console.warn('TSF API not available for text insertion')
      }
    } catch (error) {
      console.error('Error inserting text:', error)
    }
  }, [generatedOutput])

  const handleCopy = useCallback(() => {
    // Copy is handled by the TextSelectionOutput component
    console.log('Content copied to clipboard')
  }, [])

  // Don't render if feature is disabled or not visible
  if (!isFeatureEnabled('text-selection') || !isVisible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
      className="w-[400px] transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
      data-no-clickthrough
    >
      <div className="flex flex-col gap-0">
        <TextSelectionInput
          value={prompt}
          onChange={setPrompt}
          onSend={handleSend}
          onGenerate={handleGenerate}
          onClose={handleClose}
          placeholder="Ask about this..."
          isLoading={isLoading}
          isGenerating={isGenerating}
        />
        {generatedOutput && (
          <TextSelectionOutput
            content={generatedOutput}
            onInsert={handleInsert}
            onCopy={handleCopy}
          />
        )}
      </div>
    </div>
  )
}
