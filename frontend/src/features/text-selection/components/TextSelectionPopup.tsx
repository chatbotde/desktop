import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { TextSelectionInput } from './TextSelection'
import { TextSelectionOutput } from './TextSelectionOutput'
import { AddToPromptButton } from '@/components/add-button'
import { ExpandButton } from '@/components/expand-button'
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

interface TextSelectionPopupProps {
  onSendMessage: (message: string) => Promise<void>
  onAddToPrompt?: (text: string) => void
}

export function TextSelectionPopup({ onSendMessage, onAddToPrompt }: TextSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const { isFeatureEnabled } = useFeature()

  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const stopAutoHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoHide = useCallback(() => {
    stopAutoHide()
    // Only auto-hide if not expanded or generating
    if (!isExpanded && !isGenerating && !isLoading) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000) // 6 seconds
    }
  }, [isExpanded, isGenerating, isLoading, stopAutoHide])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setIsExpanded(false)
    setPrompt('')
    setIsLoading(false)
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

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

      if (!data?.text?.trim()) {
        setIsVisible(false)
        return
      }

      setSelectionData(data)
      setPrompt('')
      setIsExpanded(false) // Reset to pill mode for new selection

      // Initial rough positioning - will be refined by useLayoutEffect
      const mouseX = data.mousePosEnd?.x ?? data.mousePosStart?.x ?? window.innerWidth / 2
      const mouseY = data.mousePosEnd?.y ?? data.mousePosStart?.y ?? window.innerHeight / 2

      setPosition({ top: mouseY + 15, left: mouseX })
      setIsVisible(true)

      // Start auto-hide timer for new selection
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000)
    }

    if (window.interfaceAPI?.onMessage) {
      window.interfaceAPI.onMessage('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
    }

    return () => {
      // Clean up listener when component unmounts or feature is disabled
      if (window.interfaceAPI?.removeMessageListener) {
        window.interfaceAPI.removeMessageListener('text-selection-changed', handleSelectionChange as (...args: unknown[]) => void)
      }
      stopAutoHide()
    }
  }, [isFeatureEnabled, stopAutoHide])

  // Smart positioning to prevent overflow
  React.useLayoutEffect(() => {
    if (!isVisible || !popupRef.current || !selectionData) return

    const rect = popupRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20

    // Determine anchors
    // Default to mouse positions if structured text coordinates aren't available
    const mouseX = selectionData.mousePosEnd?.x ?? selectionData.mousePosStart?.x ?? viewportWidth / 2
    const mouseY = selectionData.mousePosEnd?.y ?? selectionData.mousePosStart?.y ?? viewportHeight / 2

    // Anchor points for "Below" and "Above" placement
    // We prefer using the selection bounds if available to avoid covering text
    const anchorBottomY = selectionData.endBottom?.y ?? mouseY
    const anchorTopY = selectionData.startTop?.y ?? mouseY
    const anchorX = selectionData.endBottom?.x ?? selectionData.startTop?.x ?? mouseX

    // Candidates
    const posBelow = anchorBottomY + 15
    const posAbove = anchorTopY - rect.height - 15

    let finalTop = posBelow
    let finalLeft = anchorX

    // Vertical Positioning Logic
    const spaceBelow = viewportHeight - posBelow
    const spaceAbove = anchorTopY

    // If it doesn't fit below, or if we have significantly more space above and it's tight below
    if (posBelow + rect.height > viewportHeight - padding) {
      if (spaceAbove > rect.height + padding || spaceAbove > spaceBelow) {
        // Place above
        finalTop = posAbove
      } else {
        // If it fits nowhere, clamp to bottom
        finalTop = viewportHeight - rect.height - padding
      }
    }

    // Constraint Vertical top edge
    if (finalTop < padding) {
      finalTop = padding
    }

    // Horizontal Positioning Logic
    // Try to align left edge with anchor, but keep within bounds
    if (finalLeft + rect.width > viewportWidth - padding) {
      finalLeft = viewportWidth - rect.width - padding
    }
    if (finalLeft < padding) {
      finalLeft = padding
    }

    // Only update if significantly different to avoid loops/jitters
    // (rounding to reduce sensitivity)
    if (
      Math.abs(finalTop - position.top) > 5 ||
      Math.abs(finalLeft - position.left) > 5
    ) {
      setPosition({ top: finalTop, left: finalLeft })
    }
  }, [isVisible, isExpanded, generatedOutput, selectionData?.text, position.top, position.left]) // Recalculate when size-affecting state changes

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
    stopAutoHide()

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
  }, [prompt, selectionData, isGenerating, isLoading, stopAutoHide])

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

  const handleAddToPromptSelection = () => {
    if (selectionData?.text && onAddToPrompt) {
      onAddToPrompt(selectionData.text)
      handleClose()
    }
  }

  // Clear timer when expanded
  useEffect(() => {
    if (isExpanded) {
      stopAutoHide()
    } else if (isVisible) {
      startAutoHide()
    }
  }, [isExpanded, isVisible, startAutoHide, stopAutoHide])

  // Don't render if feature is disabled or not visible
  if (!isFeatureEnabled('text-selection') || !isVisible) return null

  if (!isExpanded) {
    return (
      <div
        ref={popupRef}
        onMouseEnter={stopAutoHide}
        onMouseLeave={startAutoHide}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        className="flex items-center gap-1 p-1 rounded-full bg-slate-900/90 border border-slate-700 shadow-xl backdrop-blur-md transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
        data-no-clickthrough
      >
        <AddToPromptButton
          onClick={handleAddToPromptSelection}
          isDarkTheme={true}
        />
        <div className="w-px h-4 bg-slate-700/50 mx-0.5" />
        <ExpandButton
          isExpanded={false}
          onClick={() => setIsExpanded(true)}
          isDarkTheme={true}
          tooltip="Expand to ask AI"
        />
        <div className="w-px h-4 bg-slate-700/50 mx-0.5" />
        <button
          onClick={handleClose}
          className="p-1 px-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={popupRef}
      onMouseEnter={stopAutoHide}
      onMouseLeave={startAutoHide}
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
        {(generatedOutput || isGenerating) && (
          <TextSelectionOutput
            content={generatedOutput || ""}
            isStreaming={isGenerating}
            onInsert={handleInsert}
            onCopy={handleCopy}
          />
        )}
      </div>
    </div>
  )
}

