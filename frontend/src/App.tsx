import { useState } from 'react'
import { PromptInputWithActions } from '@/components'
import ClickThrough from '@/components/click-through'
import RightTransparent from '@/components/right-transparent'
import { OutputMessages } from './components/output-messages'
import type { ChatMessage } from './components/output-messages'
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

function App() {
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [outputMessages, setOutputMessages] = useState<ChatMessage[]>([])

  // Expose function to add messages globally
  window.addOutputMessage = (message: string, role: 'user' | 'assistant' = 'assistant') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      role,
      content: message,
      timestamp: new Date()
    }
    setOutputMessages(prev => [...prev, newMessage])
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent relative">
      <ClickThrough />
      {/* Right Transparent Panel - Above everything */}
      <RightTransparent 
        onClick={() => setIsInputVisible(true)} 
        showInputHint={!isInputVisible}
        className="z-[100]"
      >
        {/* Add your content here */}
        <p className="text-gray-700"></p>
      </RightTransparent>
      <OutputMessages 
        onThemeChange={setIsDarkTheme} 
        messages={outputMessages}
        onClearMessages={() => setOutputMessages([])}
      />

      {/* Prompt Input at Bottom */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        data-no-clickthrough
      >
        <PromptInputWithActions 
          isVisible={isInputVisible} 
          onVisibilityChange={setIsInputVisible}
          isDarkTheme={isDarkTheme}
          onSendMessage={async (message) => {
            // Add user message immediately
            const userMessage: ChatMessage = {
              id: Date.now().toString() + Math.random(),
              role: 'user',
              content: message,
              timestamp: new Date()
            }
            setOutputMessages(prev => [...prev, userMessage])

            // Request assistant response
            try {
              const replyText = await sendMessageComplete(message)
              const assistantMessage: ChatMessage = {
                id: Date.now().toString() + Math.random(),
                role: 'assistant',
                content: replyText,
                timestamp: new Date()
              }
              setOutputMessages(prev => [...prev, assistantMessage])
            } catch (err: any) {
              const errorText = err?.message ? String(err.message) : 'Unknown error'
              const assistantMessage: ChatMessage = {
                id: Date.now().toString() + Math.random(),
                role: 'assistant',
                content: `Sorry, I could not get a response right now. (${errorText})`,
                timestamp: new Date()
              }
              setOutputMessages(prev => [...prev, assistantMessage])
              console.error('AI response failed:', err)
            }
          }}
        />
      </div>
    </div>
  )
}

export default App
