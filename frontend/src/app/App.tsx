import { useEffect, useState, useRef } from 'react'
import { PromptInputWithActions, ImageGenerationWindow } from '@/components'
import ClickThrough from '@/components/click-through'
import { RightTransparent } from '@/shared/components/common'
import { OutputMessages } from '../components/output-messages'
import type { MediaAttachment } from '@/features/output-window'
import { useFeature } from '@/contexts/FeatureContext'
import { getSelectedModel } from '@/lib/ai/model-config'

import { TextSelectionPopup } from '@/features/text-selection'
import {
  AudioRecordingSection,
  VideoScrollSection,
  AreaScreenshotSection,
  ExplanationSection
} from '@/components/sections'
import { useAutoScreenshot } from '@/hooks/useAutoScreenshot'
import { useAutoInsert } from '@/hooks/useAutoInsert'
import { useMessageManager } from '@/hooks/useMessageManager'
import { useUIState } from '@/hooks/useUIState'
import { useTextSelectionActions } from '@/hooks/useTextSelectionActions'
import { useGlobalWindowAPI } from '@/hooks/useGlobalWindowAPI'
import { useChatHistory } from '@/hooks/useChatHistory'

function App() {
  const { isFeatureEnabled } = useFeature()
  const outputWindowEnabled = isFeatureEnabled('output-window')

  // UI state management
  const uiState = useUIState(outputWindowEnabled)

  // Message management
  const messageManager = useMessageManager(outputWindowEnabled, {
    setGeneratedImages: uiState.setGeneratedImages,
    setIsImageWindowVisible: uiState.setIsImageWindowVisible,
    setIsGeneratingImages: uiState.setIsGeneratingImages,
  })

  // Chat History
  const { saveChat, updateChat } = useChatHistory()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const isAutoSavingRef = useRef(false)
  const messagesLengthRef = useRef(0)

  // Autosave when messages change
  useEffect(() => {
    // Skip if messages haven't changed length (avoid redundant saves on re-renders)
    // or if empty
    if (messageManager.outputMessages.length === 0) {
      if (messagesLengthRef.current > 0) {
        // Just cleared
        messagesLengthRef.current = 0
        // Logic for clear is handled in handleClearMessages
      }
      return
    }

    if (messageManager.outputMessages.length === messagesLengthRef.current) {
      return
    }

    // Debounce save
    const timeoutId = setTimeout(async () => {
      if (isAutoSavingRef.current) return
      isAutoSavingRef.current = true

      try {
        if (currentChatId) {
          await updateChat(currentChatId, messageManager.outputMessages)
        } else if (messageManager.outputMessages.length > 0) {
          // Create new chat if not exists
          const firstUserMessage = messageManager.outputMessages.find(m => m.role === 'user')
          const title = firstUserMessage ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '') : 'New Chat'
          const newId = await saveChat(title, messageManager.outputMessages)
          if (newId) setCurrentChatId(newId)
        }
        messagesLengthRef.current = messageManager.outputMessages.length
      } catch (e) {
        console.error('Autosave failed:', e)
      } finally {
        isAutoSavingRef.current = false
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [messageManager.outputMessages, currentChatId, saveChat, updateChat])

  const handleLoadHistory = (messages: any[], chatId?: string) => {
    // Parse dates if necessary
    const parsedMessages = messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
    messageManager.setOutputMessages(parsedMessages)
    if (chatId) setCurrentChatId(chatId) // Set current ID to allow updates
    else setCurrentChatId(null) // Should not happen usually

    messagesLengthRef.current = parsedMessages.length // Sync ref to avoid immediate resave
    uiState.setIsOutputVisible(true)
  }

  const handleClearMessages = () => {
    messageManager.clearMessages()
    setCurrentChatId(null)
    messagesLengthRef.current = 0
    uiState.clearExplanation()
  }

  // Auto-screenshot feature - automatically takes screenshots when user starts typing
  useAutoScreenshot({
    onScreenshot: (file, isAutoScreenshot) => {
      console.log('[App] Auto-screenshot captured, adding to prompt:', file.name, 'isAuto:', isAutoScreenshot)
      // Dispatch custom event to add file to prompt input
      window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
      uiState.setIsInputVisible(true)
    },
  })

  // Auto-insert feature - automatically inserts assistant messages into external applications
  // Works independently of output window state (collapsed/expanded, open/close)
  useAutoInsert({ messages: messageManager.outputMessages })

  // Global window API setup
  useGlobalWindowAPI({
    outputWindowEnabled,
    addMessage: messageManager.addMessage,
    setIsOutputVisible: uiState.setIsOutputVisible,
    setAreaScreenshotCallback: uiState.setAreaScreenshotCallback,
    setShowAreaScreenshot: uiState.setShowAreaScreenshot
  })

  // Text selection actions
  const textSelectionActions = useTextSelectionActions({
    onSendMessage: async (message: string) => {
      if (outputWindowEnabled) uiState.setIsOutputVisible(true)
      await messageManager.handleSendMessage(message)
    },
    outputWindowEnabled,
    setExplanation: uiState.setExplanation,
    setExplanationPosition: uiState.setExplanationPosition,
    setIsInputVisible: uiState.setIsInputVisible,
    setIsOutputVisible: uiState.setIsOutputVisible
  })

  // Debug: Check if CaptureAPI is available on mount
  useEffect(() => {
    console.log('[App] Component mounted, checking for CaptureAPI...');
    console.log('[App] window.CaptureAPI:', window.CaptureAPI);
    console.log('[App] window.interfaceAPI:', window.interfaceAPI);

    // Check after a short delay in case preload hasn't finished
    const timeout = setTimeout(() => {
      console.log('[App] After delay - window.CaptureAPI:', window.CaptureAPI);
      if (!window.CaptureAPI) {
        console.error('[App] CaptureAPI is still not available after delay');
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Wrapper for handleSendMessage that also manages output window visibility
  const handleSendMessage = async (message: string, attachments?: MediaAttachment[]) => {
    // Check if it's an image generation model - don't open output window for images
    const selectedModel = getSelectedModel()
    const isImageModel = selectedModel?.category === 'image-generation' || selectedModel?.provider === 'replicate'

    // Show image window immediately for image models (before generation starts)
    if (isImageModel) {
      uiState.setIsImageWindowVisible(true)
      uiState.setIsGeneratingImages(true)
    }

    // Only open output window for non-image models
    if (outputWindowEnabled && !isImageModel) {
      uiState.setIsOutputVisible(true)
    }
    await messageManager.handleSendMessage(message, attachments)
  }

  const handleStop = () => {
    messageManager.handleStop()
  }

  const handleAreaScreenshotCapture = async (area: { x: number; y: number; width: number; height: number }) => {
    if (uiState.areaScreenshotCallback) {
      await uiState.areaScreenshotCallback(area)
    }
    uiState.setShowAreaScreenshot(false)
    uiState.setAreaScreenshotCallback(null)
  }

  const handleAreaScreenshotCancel = () => {
    uiState.setShowAreaScreenshot(false)
    uiState.setAreaScreenshotCallback(null)
  }

  const handleAudioRecordingComplete = (blob: Blob) => {
    console.log('[App] Audio recording completed, size:', blob.size, 'bytes')
    uiState.setRecordedAudio(blob)
  }

  const handleAudioUse = (blob: Blob) => {
    // Convert blob to File and add to message
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
    // You can add this to a message or handle it as needed
    console.log('[App] Using audio recording:', file.name, file.size, 'bytes')
    uiState.setRecordedAudio(null)
    // TODO: Add to message or trigger file upload
  }

  return (
    <div className="h-screen w-full items-center justify-center bg-transparent relative overflow-hidden">
      <ClickThrough />
      <TextSelectionPopup
        onSendMessage={handleSendMessage}
        onAddToPrompt={textSelectionActions.handleAddSelectedTextToPrompt}
      />
      {/* Right Transparent Panel - Above everything */}
      <RightTransparent
        onClick={() => uiState.setIsInputVisible(true)}
        showInputHint={!uiState.isInputVisible}
        className="z-[100]"
      />
      {outputWindowEnabled && (
        <OutputMessages
          onThemeChange={uiState.setIsDarkTheme}
          messages={messageManager.outputMessages}
          isWaitingForResponse={messageManager.isWaitingForResponse}
          onClearMessages={handleClearMessages}
          isVisible={uiState.isOutputVisible}
          onClose={() => uiState.setIsOutputVisible(false)}
          onAddSelectedTextToPrompt={textSelectionActions.handleAddSelectedTextToPrompt}
          onAskSelectedText={textSelectionActions.handleAskSelectedText}
          onExplainSelectedText={textSelectionActions.handleExplainSelectedText}
          isDarkTheme={uiState.isDarkTheme}
          onSelectHistory={handleLoadHistory}
        />
      )}

      <ExplanationSection
        explanation={uiState.explanation}
        explanationPosition={uiState.explanationPosition}
        isDarkTheme={uiState.isDarkTheme}
        onClose={uiState.clearExplanation}
      />

      <AudioRecordingSection
        showAudioRecorder={uiState.showAudioRecorder}
        recordedAudio={uiState.recordedAudio}
        isDarkTheme={uiState.isDarkTheme}
        onCloseRecorder={() => uiState.setShowAudioRecorder(false)}
        onRecordingComplete={handleAudioRecordingComplete}
        onClosePreview={() => uiState.setRecordedAudio(null)}
        onDeletePreview={() => uiState.setRecordedAudio(null)}
        onUsePreview={handleAudioUse}
      />

      <VideoScrollSection
        showVideoScroll={uiState.showVideoScroll}
        onClose={() => uiState.setShowVideoScroll(false)}
      />

      <AreaScreenshotSection
        showAreaScreenshot={uiState.showAreaScreenshot}
        areaScreenshotCallback={uiState.areaScreenshotCallback}
        onCapture={handleAreaScreenshotCapture}
        onCancel={handleAreaScreenshotCancel}
      />

      {/* Image Generation Window - Above Prompt Input */}
      <ImageGenerationWindow
        images={uiState.generatedImages}
        isVisible={uiState.isImageWindowVisible}
        isLoading={uiState.isGeneratingImages}
        onClose={() => {
          uiState.setIsImageWindowVisible(false)
          uiState.setIsGeneratingImages(false)
          uiState.setGeneratedImages([])
        }}
        isDarkTheme={uiState.isDarkTheme}
      />

      {/* Prompt Input at Bottom */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        data-no-clickthrough
      >
        <PromptInputWithActions
          isVisible={uiState.isInputVisible}
          onVisibilityChange={uiState.setIsInputVisible}
          isDarkTheme={uiState.isDarkTheme}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          onAudioClick={() => uiState.setShowAudioRecorder(prev => !prev)}
          onMoreClick={() => uiState.setShowVideoScroll(true)}
          onThemeChange={uiState.setIsDarkTheme}
          isOutputVisible={uiState.isOutputVisible}
          onToggleOutput={() => uiState.setIsOutputVisible(!uiState.isOutputVisible)}
        />
      </div>
    </div>
  )
}

export default App
