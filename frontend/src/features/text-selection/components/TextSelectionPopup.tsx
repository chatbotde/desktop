import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { TextSelectionInput } from './TextSelection'
import { TextSelectionOutput } from './TextSelectionOutput'
import { AddToPromptButton } from '@/components/add-button'
import { ExpandButton } from '@/components/expand-button'
import { useFeature } from '@/contexts/FeatureContext'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
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
  onSendMessage?: (message: string) => Promise<void>
  onAddToPrompt?: (text: string) => void
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

export function TextSelectionPopup({ onAddToPrompt, isDarkTheme = true }: TextSelectionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null)
  const { isFeatureEnabled } = useFeature()

  const popupRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRef = useRef(false)

  const stopAutoHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoHide = useCallback(() => {
    stopAutoHide()
    // Only auto-hide if not expanded or generating
    if (!isExpanded && !isGenerating) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 6000) // 6 seconds
    }
  }, [isExpanded, isGenerating, stopAutoHide])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setIsExpanded(false)
    setPrompt('')
    setIsGenerating(false)
    setGeneratedOutput(null)
    stopAutoHide()
  }, [stopAutoHide])

  const handleStop = useCallback(() => {
    stopRef.current = true
  }, [])

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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    let message = prompt.trim()
    if (selectionData?.text) {
      message = `${message}\n\nSelected text:\n"${selectionData.text}"`
    }

    setIsGenerating(true)
    setGeneratedOutput(null)
    stopRef.current = false
    stopAutoHide()

    try {
      // Use the same AI service logic as handleSendMessage
      const localModel = unifiedLocalLLMService.getCurrentModel()

      let responseStream: AsyncGenerator<string, void, unknown>;

      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) {
          throw new Error(init.message)
        }
        responseStream = await unifiedLocalLLMService.sendMessage(
          message,
          undefined,
          localModel.name
        )
      } else {
        responseStream = await sendCloudMessage(message, undefined)
      }

      // Stream the response and accumulate text
      let fullResponse = ''
      for await (const chunk of responseStream) {
        if (stopRef.current) break
        fullResponse += chunk
        // Update output in real-time as it streams
        setGeneratedOutput(fullResponse)
      }
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
  }, [prompt, selectionData, isGenerating, stopAutoHide])

  const handleInsert = useCallback(async () => {
    if (!generatedOutput) return

    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) {
        console.warn('TSF API not available for text insertion')
        return
      }

      await tsfAPI.initialize()

      // Get the selected text if available
      const selectedText = selectionData?.text?.trim() || ''

      let textToInsert: string

      if (selectedText) {
        // Option 1: Insert selected text + output together (adds output after selected text)
        // This preserves the selected text and appends the output
        textToInsert = `${selectedText} ${generatedOutput}`

        // Replace the selection with (selected text + output)
        // This effectively "adds" the output to the selected text
        const success = await tsfAPI.focusAndReplaceText(textToInsert)

        if (success) {
          console.log('Text inserted successfully (selected text + output)')
        } else {
          console.error('Failed to insert text')
        }
      } else {
        // Option 2: No selection - just insert output at cursor position
        const success = await tsfAPI.focusAndInsertText(generatedOutput)

        if (success) {
          console.log('Text inserted successfully')
        } else {
          console.error('Failed to insert text')
        }
      }
    } catch (error) {
      console.error('Error inserting text:', error)
    }
  }, [generatedOutput, selectionData])

  const handleReplace = useCallback(async () => {
    if (!generatedOutput) return

    try {
      const tsfAPI = (window as any).tsfAPI;
      if (!tsfAPI) {
        console.warn('TSF API not available for text replacement')
        return
      }

      await tsfAPI.initialize()

      // Replace selected text with generated output
      const success = await tsfAPI.focusAndReplaceText(generatedOutput)

      if (success) {
        console.log('Text replaced successfully')
        // Optionally close the popup after replacement
        // handleClose()
      } else {
        console.error('Failed to replace text')
      }
    } catch (error) {
      console.error('Error replacing text:', error)
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
    <motion.div
      ref={popupRef}
      onMouseEnter={stopAutoHide}
      onMouseLeave={startAutoHide}
      drag
      dragMomentum={false}
      initial={false}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        pointerEvents: 'auto',
        touchAction: 'none'
      }}
      className="animate-in fade-in zoom-in-95 cursor-grab active:cursor-grabbing"
      data-no-clickthrough
    >
      {/* Collapsed state (pill) */}
      <div
        className={cn(
          "flex items-center gap-1 p-1 rounded-full shadow-xl",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded
            ? "opacity-0 scale-90 -translate-y-2 pointer-events-none absolute"
            : "opacity-100 scale-100 translate-y-0 relative",
          isDarkTheme
            ? "border border-white/10"
            : "bg-white border border-slate-200"
        )}
        style={{
          backgroundColor: isDarkTheme ? "#09090b" : "white"
        }}
      >
        <AddToPromptButton
          onClick={handleAddToPromptSelection}
          isDarkTheme={isDarkTheme}
        />
        <div className={cn(
          "w-px h-4 mx-0.5",
          isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
        )} />
        <ExpandButton
          isExpanded={false}
          onClick={() => setIsExpanded(true)}
          isDarkTheme={isDarkTheme}
          tooltip="Expand to ask AI"
        />
        <div className={cn(
          "w-px h-4 mx-0.5",
          isDarkTheme ? "bg-zinc-800" : "bg-slate-200/50"
        )} />
        <button
          onClick={handleClose}
          className={cn(
            "p-1 px-1.5 rounded-full transition-colors",
            isDarkTheme
              ? "hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
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
          onGenerate={handleGenerate}
          onStop={handleStop}
          onClose={handleClose}
          placeholder="Ask about this..."
          isGenerating={isGenerating}
          isDarkTheme={isDarkTheme}
        />
        {(generatedOutput || isGenerating) && (
          <TextSelectionOutput
            content={generatedOutput || ""}
            isStreaming={isGenerating}
            onInsert={handleInsert}
            onReplace={handleReplace}
            onCopy={handleCopy}
            isDarkTheme={isDarkTheme}
          />
        )}
      </div>
    </motion.div>
  )
}

