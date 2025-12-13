import { useState, useEffect, useCallback } from 'react'
import { PromptInputWithActions } from '@/components'
import ClickThrough from '@/components/click-through'
import RightTransparent from '@/components/right-transparent'
import { OutputMessages } from './components/output-messages'
import type { ChatMessage, MediaAttachment } from './components/output-window/types'
import { sendMessageComplete } from '@/lib/ai'

import { TextSelectionPopup } from '@/components/text-selection/TextSelectionPopup'
import { AudioRecorderPill } from '@/components/audio-recorder-pill'
import { AudioPreview } from '@/components/audio-preview'
import { VideoScroll } from '@/components/container'
import { AreaScreenshotOverlay } from '@/components/area-screenshot-overlay'
import { Explanation } from './components/explaination'

declare global {
  interface Window {
    addOutputMessage?: (message: string, role?: 'user' | 'assistant') => void;
  }
}

// Helper function to generate unique message IDs
const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Helper function to create a chat message
const createChatMessage = (
  content: string,
  role: 'user' | 'assistant' = 'assistant',
  attachments?: MediaAttachment[]
): ChatMessage => {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date(),
    attachments
  }
}

function App() {
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [isOutputVisible, setIsOutputVisible] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVideoScroll, setShowVideoScroll] = useState(false)
  const [showAreaScreenshot, setShowAreaScreenshot] = useState(false)
  const [areaScreenshotCallback, setAreaScreenshotCallback] = useState<((area: { x: number; y: number; width: number; height: number }) => void) | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [explanation, setExplanation] = useState<string | undefined>(undefined)
  const [explanationPosition, setExplanationPosition] = useState<{ x: number; y: number } | undefined>(undefined)

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

  // Expose function to add messages globally
  useEffect(() => {
    window.addOutputMessage = (message: string, role: 'user' | 'assistant' = 'assistant') => {
      const newMessage = createChatMessage(message, role)
      setOutputMessages(prev => [...prev, newMessage])
      setIsOutputVisible(true)
    }

    // Listen for area screenshot requests
    const handleShowAreaScreenshot = (event: CustomEvent) => {
      setAreaScreenshotCallback(() => event.detail.onCapture)
      setShowAreaScreenshot(true)
    }

    window.addEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)

    return () => {
      window.addOutputMessage = undefined
      window.removeEventListener('show-area-screenshot', handleShowAreaScreenshot as EventListener)
    }
  }, [])

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string, attachments?: MediaAttachment[]) => {
    setIsOutputVisible(true)
    // Add user message immediately
    const userMessage = createChatMessage(message, 'user', attachments)
    setOutputMessages(prev => [...prev, userMessage])

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
      const replyText = await sendMessageComplete(message, aiAttachments)
      const assistantMessage = createChatMessage(replyText, 'assistant')
      setOutputMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error'

      const errorResponse = createChatMessage(
        `Sorry, I could not get a response right now. (${errorMessage})`,
        'assistant'
      )
      setOutputMessages(prev => [...prev, errorResponse])
      console.error('AI response failed:', err)
    }
  }, [])

  const handleAddSelectedTextToPrompt = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    // Ensure prompt input is visible and append as a "clipboard item"
    setIsInputVisible(true)
    window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: trimmed } }))
  }, [])

  const handleAskSelectedText = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    await handleSendMessage(`Selected text:\n"${trimmed}"`)
  }, [handleSendMessage])

  const handleExplainSelectedText = useCallback(async (text: string, position?: { x: number; y: number }) => {
    const trimmed = text.trim()
    if (!trimmed) return
    
    // Store the position for dynamic positioning
    if (position) {
      setExplanationPosition(position)
    }
    
    try {
      // Request explanation from AI
      const explanationText = await sendMessageComplete(
        `Please explain the following text in a clear and concise way:\n\n"${trimmed}"`
      )
      setExplanation(explanationText)
      setIsOutputVisible(true)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error'
      setExplanation(`Sorry, I could not explain this text. (${errorMessage})`)
      setIsOutputVisible(true)
      console.error('Explanation failed:', err)
    }
  }, [])

  return (
    <div className="h-screen w-full items-center justify-center bg-transparent relative overflow-hidden">
      <ClickThrough />
      <TextSelectionPopup onSendMessage={handleSendMessage} />
      {/* Right Transparent Panel - Above everything */}
      <RightTransparent
        onClick={() => setIsInputVisible(true)}
        showInputHint={!isInputVisible}
        className="z-[100]"
      />
      <OutputMessages
        onThemeChange={setIsDarkTheme}
        messages={outputMessages}
        onClearMessages={() => {
          setOutputMessages([])
          setExplanation(undefined)
          setExplanationPosition(undefined)
        }}
        isVisible={isOutputVisible}
        onClose={() => setIsOutputVisible(false)}
        onAddSelectedTextToPrompt={handleAddSelectedTextToPrompt}
        onAskSelectedText={handleAskSelectedText}
        onExplainSelectedText={handleExplainSelectedText}
      />

      {/* Explanation component - appears dynamically positioned relative to selection */}
      {explanation && (
        <Explanation
          explanation={explanation}
          isDarkTheme={isDarkTheme}
          position={explanationPosition}
          onClose={() => {
            setExplanation(undefined)
            setExplanationPosition(undefined)
          }}
        />
      )}

      {showAudioRecorder && (
        <div data-no-clickthrough>
          <AudioRecorderPill
            onClose={() => setShowAudioRecorder(false)}
            isDarkTheme={isDarkTheme}
            onRecordingComplete={(blob) => {
              console.log('[App] Audio recording completed, size:', blob.size, 'bytes')
              setRecordedAudio(blob)
            }}
          />
        </div>
      )}

      {recordedAudio && (
        <AudioPreview
          audioBlob={recordedAudio}
          fileName={`recording-${Date.now()}.webm`}
          isDarkTheme={isDarkTheme}
          onClose={() => setRecordedAudio(null)}
          onDelete={() => setRecordedAudio(null)}
          onUse={(blob) => {
            // Convert blob to File and add to message
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
            // You can add this to a message or handle it as needed
            console.log('[App] Using audio recording:', file.name, file.size, 'bytes')
            setRecordedAudio(null)
            // TODO: Add to message or trigger file upload
          }}
        />
      )}

      {showVideoScroll && (
        <div data-no-clickthrough>
          <VideoScroll onClose={() => setShowVideoScroll(false)} />
        </div>
      )}

      {showAreaScreenshot && areaScreenshotCallback && (
        <AreaScreenshotOverlay
          onCapture={async (area) => {
            await areaScreenshotCallback(area)
            setShowAreaScreenshot(false)
            setAreaScreenshotCallback(null)
          }}
          onCancel={() => {
            setShowAreaScreenshot(false)
            setAreaScreenshotCallback(null)
          }}
        />
      )}

      {/* Prompt Input at Bottom */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        data-no-clickthrough
      >
        <PromptInputWithActions
          isVisible={isInputVisible}
          onVisibilityChange={setIsInputVisible}
          isDarkTheme={isDarkTheme}
          onSendMessage={handleSendMessage}
          onAudioClick={() => setShowAudioRecorder(prev => !prev)}
          onMoreClick={() => setShowVideoScroll(true)}
        />
      </div>
    </div>
  )
}

export default App
