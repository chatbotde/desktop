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
import { cn } from '@/lib/utils'

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
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

export function TextSelectionPopup({ onSendMessage, onAddToPrompt, isDarkTheme = true }: TextSelectionPopupProps) {
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

      // Initial positioning - prioritize cursor/mouse position for better UX
      // Use mousePosEnd (cursor at end of selection) as primary anchor, then mousePosStart, then selection bounds
      let anchorX = data.mousePosEnd?.x ?? data.mousePosStart?.x ?? data.endBottom?.x ?? data.startTop?.x
      let anchorY = data.mousePosEnd?.y ?? data.mousePosStart?.y ?? data.endBottom?.y ?? data.startTop?.y

      // Validate coordinates are reasonable (within viewport bounds)
      const isValidCoordinate = (val: number | undefined): boolean => {
        return val !== undefined && 
               !isNaN(val) && 
               isFinite(val) && 
               val >= 0 && 
               val <= window.innerWidth + 1000 // Allow some margin for multi-monitor setups
      }

      // Only use center as last resort if no valid coordinates are available
      if (!isValidCoordinate(anchorX) || !isValidCoordinate(anchorY)) {
        anchorX = window.innerWidth / 2
        anchorY = window.innerHeight / 2
      }

      // Safely set the position if anchorX and anchorY are valid numbers
      if (typeof anchorX === 'number' && typeof anchorY === 'number') {
        setPosition({ top: anchorY + 15, left: anchorX })
      } else {
        // Fallback to center of viewport
        setPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 })
      }
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

  // Smart positioning to prevent overflow and position near cursor
  React.useLayoutEffect(() => {
    if (!isVisible || !popupRef.current || !selectionData) return

    const rect = popupRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20
    const offset = 15 // Distance from cursor

    // Prioritize cursor/mouse position for better UX - cursor is where user's attention is
    // Use mousePosEnd (cursor at end of selection) as primary anchor point
    let anchorX = selectionData.mousePosEnd?.x ?? selectionData.mousePosStart?.x
    let anchorY = selectionData.mousePosEnd?.y ?? selectionData.mousePosStart?.y

    // Fallback to selection bounds if mouse positions aren't available
    if (anchorX === undefined || anchorY === undefined) {
      anchorX = selectionData.endBottom?.x ?? selectionData.startTop?.x
      anchorY = selectionData.endBottom?.y ?? selectionData.startTop?.y
    }

    // Validate coordinates are reasonable (within viewport bounds)
    // Check if coordinates are valid numbers and within reasonable bounds
    const isValidCoordinate = (val: number | undefined): boolean => {
      return val !== undefined && 
             !isNaN(val) && 
             isFinite(val) && 
             val >= 0 && 
             val <= viewportWidth + 1000 // Allow some margin for multi-monitor setups
    }

    // Only use viewport center as absolute last resort if coordinates are invalid
    if (!isValidCoordinate(anchorX) || !isValidCoordinate(anchorY)) {
      // If coordinates are invalid, try to get from current position if it's reasonable
      if (isValidCoordinate(position.left) && isValidCoordinate(position.top)) {
        anchorX = position.left
        anchorY = position.top
      } else {
        // Last resort: use viewport center
        anchorX = viewportWidth / 2
        anchorY = viewportHeight / 2
      }
    }

    // Get top anchor for "above" placement calculation
    const anchorTopY = selectionData.startTop?.y ?? anchorY

    // Calculate position candidates, guarding against possibly undefined anchor values
    const safeAnchorY = anchorY ?? 0
    const safeAnchorTopY = anchorTopY ?? 0

    const posBelow = safeAnchorY + offset
    const posAbove = safeAnchorTopY - rect.height - offset

    let finalTop = posBelow
    let finalLeft = anchorX ?? 0


    // Vertical Positioning Logic - prefer below, but place above if needed
    const spaceBelow = viewportHeight - posBelow
    const spaceAbove = anchorTopY

    // If it doesn't fit below, try above
    if (posBelow + rect.height > viewportHeight - padding) {
      // Ensure spaceAbove is defined and a valid number
      const safeSpaceAbove = spaceAbove ?? 0
      if (safeSpaceAbove > rect.height + padding || safeSpaceAbove > spaceBelow) {
        // Place above the selection
        finalTop = posAbove
      } else {
        // If it fits nowhere, clamp to bottom of viewport
        finalTop = viewportHeight - rect.height - padding
      }
    }

    // Ensure we don't go above viewport
    if (finalTop < padding) {
      finalTop = padding
    }

    // Horizontal Positioning Logic
    // Center the popup horizontally relative to the anchor point
    // For pill mode (collapsed), align left edge with anchor
    // For expanded mode, center it better
    if (isExpanded) {
      // Center the expanded popup on the anchor point, guard against undefined anchorX
      finalLeft = (anchorX ?? 0) - (rect.width / 2)
    } else {
      // For pill mode, align left edge with anchor, guard against undefined anchorX
      finalLeft = anchorX ?? 0
    }

    // Keep within horizontal bounds
    if (finalLeft + rect.width > viewportWidth - padding) {
      finalLeft = viewportWidth - rect.width - padding
    }
    if (finalLeft < padding) {
      finalLeft = padding
    }

    // Only update if significantly different to avoid loops/jitters
    if (
      Math.abs(finalTop - position.top) > 5 ||
      Math.abs(finalLeft - position.left) > 5
    ) {
      setPosition({ top: finalTop, left: finalLeft })
    }
  }, [isVisible, isExpanded, generatedOutput, selectionData, position.top, position.left]) // Recalculate when size-affecting state changes

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
      className="animate-in fade-in zoom-in-95"
      data-no-clickthrough
    >
      {/* Collapsed state (pill) */}
      <div
        className={cn(
          "flex items-center gap-1 p-1 rounded-full shadow-xl backdrop-blur-md",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded 
            ? "opacity-0 scale-90 -translate-y-2 pointer-events-none absolute" 
            : "opacity-100 scale-100 translate-y-0 relative",
          isDarkTheme
            ? "bg-slate-900/90 border border-slate-700"
            : "bg-white/90 border border-slate-200"
        )}
      >
        <AddToPromptButton
          onClick={handleAddToPromptSelection}
          isDarkTheme={isDarkTheme}
        />
        <div className={cn(
          "w-px h-4 mx-0.5",
          isDarkTheme ? "bg-slate-700/50" : "bg-slate-200/50"
        )} />
        <ExpandButton
          isExpanded={false}
          onClick={() => setIsExpanded(true)}
          isDarkTheme={isDarkTheme}
          tooltip="Expand to ask AI"
        />
        <div className={cn(
          "w-px h-4 mx-0.5",
          isDarkTheme ? "bg-slate-700/50" : "bg-slate-200/50"
        )} />
        <button
          onClick={handleClose}
          className={cn(
            "p-1 px-1.5 rounded-full transition-colors",
            isDarkTheme
              ? "hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
              : "hover:bg-slate-100/50 text-slate-600 hover:text-red-500"
          )}
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded state */}
      <div
        className={cn(
          "flex flex-col gap-0 w-[400px]",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded 
            ? "opacity-100 scale-100 translate-y-0 relative" 
            : "opacity-0 scale-90 translate-y-2 pointer-events-none absolute"
        )}
      >
        <TextSelectionInput
          value={prompt}
          onChange={setPrompt}
          onSend={handleSend}
          onGenerate={handleGenerate}
          onClose={handleClose}
          placeholder="Ask about this..."
          isLoading={isLoading}
          isGenerating={isGenerating}
          isDarkTheme={isDarkTheme}
        />
        {(generatedOutput || isGenerating) && (
          <TextSelectionOutput
            content={generatedOutput || ""}
            isStreaming={isGenerating}
            onInsert={handleInsert}
            onCopy={handleCopy}
            isDarkTheme={isDarkTheme}
          />
        )}
      </div>
    </div>
  )
}

