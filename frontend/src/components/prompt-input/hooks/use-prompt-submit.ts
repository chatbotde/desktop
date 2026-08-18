import { useCallback } from "react"
import { toast } from "sonner"
import { validateMessage } from '@/lib/ai/capabilities'
import { getSelectedModel } from '@/lib/ai/model-config'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { CaptureAreaStore } from '@/features/capture/capture-area-store'
import { useFeature } from "@/contexts/FeatureContext"
import type { MediaAttachment } from '@/features/chat'
import type { PromptReference } from "../types/prompt-reference"
import { formatReferencesForMessage } from "../utils/format-prompt-references"
import { getIntegrationSlugsFromReferences } from "@/lib/composio/composio-chat-tools"
import { getGroundingEnabled } from "@/lib/settings/grounding-toggle"
import { isFactCheckConfigured } from "@/lib/search"
import type { SendMessageOptions } from "@/features/chat/types/send-message-options"

interface UsePromptSubmitProps {
  input: string
  files: File[]
  clipboardItems: string[]
  references: PromptReference[]
  setInput: (value: string) => void
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  setClipboardItems: React.Dispatch<React.SetStateAction<string[]>>
  clearReferences: () => void
  setValidationError: (error: string | null) => void
  setIsLoading: (loading: boolean) => void
  setIsExpanded: (expanded: boolean) => void
  prevInputLengthRef: React.MutableRefObject<number>
  convertFilesToAttachments: (files: File[]) => Promise<MediaAttachment[]>
  onSendMessage?: (
    message: string,
    attachments?: MediaAttachment[],
    options?: SendMessageOptions
  ) => void | Promise<void>
}

export function usePromptSubmit({
  input,
  files,
  clipboardItems,
  references,
  setInput,
  setFiles,
  setClipboardItems,
  clearReferences,
  setValidationError,
  setIsLoading,
  setIsExpanded,
  prevInputLengthRef,
  convertFilesToAttachments,
  onSendMessage,
}: UsePromptSubmitProps) {
  const { isFeatureEnabled } = useFeature()

  const handleSubmit = useCallback(async (overrideText?: string) => {
    // Check if we should auto-capture area
    let autoCapturedFile: File | null = null
    const isSetAreaEnabled = isFeatureEnabled('set-capture-area')

    if (isSetAreaEnabled && CaptureAreaStore.isAutoCaptureEnabled()) {
      const area = CaptureAreaStore.getArea()
      if (area && window.CaptureAPI?.takeAreaScreenshot) {
        try {
          const result = await window.CaptureAPI.takeAreaScreenshot(area)
          if (result.success && result.screenshot) {
            const response = await fetch(result.screenshot.data)
            const blob = await response.blob()
            autoCapturedFile = new File([blob], result.screenshot.name, { type: result.screenshot.type })
          }
        } catch (e) {
          console.error("Failed to auto-capture area on submit", e)
        }
      }
    }

    const textToSubmit = overrideText !== undefined ? overrideText : input

    if (!(textToSubmit.trim() || files.length > 0 || clipboardItems.length > 0 || references.length > 0 || autoCapturedFile)) return

    const integrationReferences = references.filter((ref) => ref.kind === "integration")
    const disconnectedIntegrations = integrationReferences.filter((ref) => !ref.meta?.connected)
    if (disconnectedIntegrations.length > 0) {
      const names = disconnectedIntegrations.map((ref) => ref.label).join(", ")
      setValidationError(`Connect ${names} in Settings → Integrations first`)
      return
    }

    const composioToolkitSlugs = getIntegrationSlugsFromReferences(references)

    // Prepare message and files
    const referenceBlock = formatReferencesForMessage(references)
    const messageParts = [referenceBlock, ...clipboardItems, textToSubmit].filter(Boolean)
    const messageToSend = messageParts.join("\n\n")
    const filesToSend = [...files]

    if (autoCapturedFile) {
      filesToSend.push(autoCapturedFile)
    }

    const clipboardItemsToSend = [...clipboardItems]

    // Convert files to MediaAttachment format for validation
    const attachments = filesToSend.length > 0 ? await convertFilesToAttachments(filesToSend) : undefined

    const hasAudioAttachment = filesToSend.some((f) => f.type.startsWith("audio/"))
    const factCheckMode =
      getGroundingEnabled() &&
      isFactCheckConfigured() &&
      (hasAudioAttachment || Boolean(textToSubmit.trim()))

    if (getGroundingEnabled() && !isFactCheckConfigured()) {
      setValidationError("Fact check needs VITE_GOOGLE_API_KEY and VITE_EXA_API_KEY in .env")
      return
    }

    // Check if local model is selected
    const localModel = unifiedLocalLLMService.getCurrentModel()
    const cloudModel = getSelectedModel()

    // Use cloud model for validation (local models typically don't support images)
    const modelToValidate = cloudModel || null

    // Validate message and attachments before sending (skip for fact-check — uses its own pipeline)
    if (!factCheckMode) {
      // Local models do not support multimodal attachments (image/audio/video)
      if (attachments && attachments.length > 0 && localModel) {
        const mediaTypes = [...new Set(attachments.map((a) => a.mediaType))]
        const label = mediaTypes.length === 1
          ? mediaTypes[0]
          : 'media'
        setValidationError(`${localModel.displayName} doesn't support ${label} attachments`)
        return
      }

      // Validate message (this also checks if model is selected)
      const validation = validateMessage(messageToSend, attachments, modelToValidate)

      if (!validation.isValid) {
        // Get the first error message for simplicity
        const firstError = validation.errors[0]
        const errorMessage = firstError?.message || "This model doesn't support the requested capability"

        // Show simple popup above input
        setValidationError(errorMessage)
        return // Don't send the message
      }
    } else if (hasAudioAttachment) {
      const audioAttachments = attachments?.filter((a) => a.mediaType === 'audio') ?? []
      if (audioAttachments.length === 0 && filesToSend.some((f) => f.type.startsWith('audio/'))) {
        setValidationError('Could not read audio attachment. Try recording again.')
        return
      }
    }

    // Clear validation error if validation passes
    setValidationError(null)

    // Clear input state only after validation passes
    setInput("")
    prevInputLengthRef.current = 0
    setFiles([])
    setClipboardItems([])
    clearReferences()

    // Emit input cleared event to reset auto-screenshot
    window.dispatchEvent(new CustomEvent('prompt-input-cleared'))

    setIsLoading(true)

    try {
      if ((messageToSend.trim() || clipboardItemsToSend.length > 0 || attachments) && onSendMessage) {
        const message =
          messageToSend ||
          (factCheckMode && hasAudioAttachment ? "" : attachments ? "See attached media" : "")
        await onSendMessage(message, attachments, {
          composioToolkitSlugs: composioToolkitSlugs.length > 0 ? composioToolkitSlugs : undefined,
          factCheckMode,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Show error toast if sending fails
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      toast.error('Failed to send message', {
        description: errorMessage,
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
      setIsExpanded(false)
    }
  }, [
    input,
    files,
    clipboardItems,
    references,
    setInput,
    setFiles,
    setClipboardItems,
    clearReferences,
    setValidationError,
    setIsLoading,
    setIsExpanded,
    prevInputLengthRef,
    convertFilesToAttachments,
    onSendMessage,
    isFeatureEnabled,
  ])

  return { handleSubmit }
}

