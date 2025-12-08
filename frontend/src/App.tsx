import { useState, useEffect, useCallback } from 'react'
import { PromptInputWithActions } from '@/components'
import ClickThrough from '@/components/click-through'
import RightTransparent from '@/components/right-transparent'
import { OutputMessages } from './components/output-messages'
import type { ChatMessage } from './components/output-window/types'
import { sendMessageComplete } from '@/lib/ai'

declare global {
  interface Window {
    interfaceAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setIgnoreMouseEvents?: (ignore: boolean, options?: { forward?: boolean }) => void;
    }
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
  role: 'user' | 'assistant' = 'assistant'
): ChatMessage => {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date()
  }
}

function App() {
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])

  // Expose function to add messages globally
  useEffect(() => {
    window.addOutputMessage = (message: string, role: 'user' | 'assistant' = 'assistant') => {
      const newMessage = createChatMessage(message, role)
      setOutputMessages(prev => [...prev, newMessage])
    }

    return () => {
      window.addOutputMessage = undefined
    }
  }, [])

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message immediately
    const userMessage = createChatMessage(message, 'user')
    setOutputMessages(prev => [...prev, userMessage])

    // Request assistant response
    try {
      const replyText = await sendMessageComplete(message)
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

  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent relative">
      <ClickThrough />
      {/* Right Transparent Panel - Above everything */}
      <RightTransparent
        onClick={() => setIsInputVisible(true)}
        showInputHint={!isInputVisible}
        className="z-[100]"
      />
      <OutputMessages
        onThemeChange={setIsDarkTheme}
        messages={outputMessages}
        onClearMessages={() => setOutputMessages([])}
      />

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
        />
      </div>
    </div>
  )
}

export default App
