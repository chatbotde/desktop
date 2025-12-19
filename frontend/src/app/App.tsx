import { useEffect } from 'react'
import { PromptInputWithActions } from '@/components'
import ClickThrough from '@/components/click-through'
import { RightTransparent } from '@/shared/components/common'
import { OutputMessages } from '../components/output-messages'
import type { MediaAttachment } from '@/features/output-window'
import { useFeature } from '@/contexts/FeatureContext'

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

function App() {
  const { isFeatureEnabled } = useFeature()
  const outputWindowEnabled = isFeatureEnabled('output-window')

  // UI state management
  const uiState = useUIState(outputWindowEnabled)

  // Message management
  const messageManager = useMessageManager(outputWindowEnabled)

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
    if (outputWindowEnabled) uiState.setIsOutputVisible(true)
    await messageManager.handleSendMessage(message, attachments)
  }

  const handleStop = () => {
    messageManager.handleStop()
  }

  const handleClearMessages = () => {
    messageManager.clearMessages()
    uiState.clearExplanation()
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
        />
      </div>
    </div>
  )
}

export default App
