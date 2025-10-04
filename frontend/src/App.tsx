import { useEffect } from 'react'
import { Messages } from '@/components/Messages'
import { 
  AppBackground, 
  WelcomeScreen
} from '@/components'
import { 
  useChatManager, 
  useScrollManager 
} from '@/hooks'


// Note: Window API interface is now declared in types/electron.d.ts



function App() {
  // Use custom hooks for state management
  const chatManager = useChatManager()
  const scrollManager = useScrollManager()

  useEffect(() => {
    // Set up the message listener using the exposed API
    if (window.api?.onChatMessage) {
      console.log('Main Window: Setting up chat message listener');
      window.api.onChatMessage((messageData: any) => {
        chatManager.handleChatMessage(messageData);
      });
    } else {
      console.error('Main Window: window.api.onChatMessage not available');
    }

    // Return cleanup function for chat message listener
    return () => {
      // Clean up chat message listener if possible
      if (window.api?.removeAllListeners) {
        try {
          window.api.removeAllListeners('receive-chat-message');
          console.log('App: Chat message listener cleaned up');
        } catch (error) {
          console.log('App: Could not clean up chat message listener:', error);
        }
      }
    };
  }, [chatManager.handleChatMessage])

  // Listen for forwarded messages from Chat Input (floating Display 1 iframe)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data: any = event.data
      if (data && data.type === 'chat-input-message' && data.payload) {
        chatManager.handleChatMessage(data.payload)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [chatManager.handleChatMessage])

  // Show test page if enabled
  

  return (
    <div className="h-screen w-full flex flex-col bg-transparent">
      {/* Full Height Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Background */}
        <AppBackground />

        {/* Full Height Content Container */}
        <div className="relative z-10 h-full">
          {/* Chat Messages Area */}
          {chatManager.showChat && (
            <div className="flex flex-col h-full overflow-hidden">
              <Messages
                messages={chatManager.messages}
                isTyping={chatManager.isTyping}
                onCopyMessage={chatManager.copyToClipboard}
                messagesContainerRef={scrollManager.messagesContainerRef}
                messagesEndRef={scrollManager.messagesEndRef}
                onScroll={scrollManager.handleScroll}
                scrollToBottom={scrollManager.scrollToBottom}
                scrollToTop={scrollManager.scrollToTop}
                showScrollToTop={scrollManager.showScrollToTop}
                isNearBottom={scrollManager.isNearBottom}
              />
            </div>
          )}

          {/* Welcome Content (shown when no chat) */}
          {!chatManager.showChat && (
            <WelcomeScreen />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
