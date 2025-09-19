import { useEffect } from 'react'
import { Messages } from '@/components/Messages'
import { 
  AppBackground, 
  WelcomeScreen, 
  ScreenCaptureModal, 
  ScrollToTopButton 
} from '@/components'
import { 
  useChatManager, 
  useWindowManager, 
  useScrollManager 
} from '@/hooks'

// Note: Window API interface is now declared in types/electron.d.ts



function App() {
  // Use custom hooks for state management
  const chatManager = useChatManager()
  const windowManager = useWindowManager()
  const scrollManager = useScrollManager()

  useEffect(() => {
    // Load screen info on mount
    if (window.api?.getScreenInfo) {
      window.api.getScreenInfo().then(info => {
        windowManager.setScreenInfo(info)
      })
    }

    // Load initial content protection state
    if (window.api?.getContentProtection) {
      window.api.getContentProtection().then(isEnabled => {
        windowManager.setContentProtection(isEnabled)
      })
    }

    // Load initial theme state
    if (window.api?.getTheme) {
      window.api.getTheme().then(theme => {
        windowManager.setCurrentTheme(theme as 'transparent' | 'black')
      })
    }

    // Listen for theme changes from backend
    if (window.api?.onThemeChanged) {
      window.api.onThemeChanged((theme: string) => {
        windowManager.setCurrentTheme(theme as 'transparent' | 'black')
      })
    }

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
  }, [chatManager.handleChatMessage, windowManager])

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

  return (
    <div className={`h-screen w-full flex flex-col ${windowManager.currentTheme === 'black' ? 'bg-black' : 'bg-transparent'}`}>
      {/* Full Height Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Background - Conditional based on theme */}
        <AppBackground currentTheme={windowManager.currentTheme} />

        {/* Full Height Content Container */}
        <div className="relative z-10 h-full scrollable-content" ref={scrollManager.mainContentRef} onScroll={scrollManager.handleScroll}>
          {/* Chat Messages Area */}
          {chatManager.showChat && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <Messages
                  messages={chatManager.messages}
                  isTyping={chatManager.isTyping}
                  onCopyMessage={chatManager.copyToClipboard}
                />
              </div>
            </div>
          )}

          {/* Welcome Content (shown when no chat) */}
          {!chatManager.showChat && (
            <WelcomeScreen currentTheme={windowManager.currentTheme} />
          )}
        </div>

        {/* Screen Capture Section - Overlay */}
        <ScreenCaptureModal
          isVisible={windowManager.showSettings}
          onClose={() => windowManager.setShowSettings(false)}
          isCapturing={windowManager.isCapturing}
          desktopSources={windowManager.desktopSources}
          selectedSource={windowManager.selectedSource}
          onSourceSelect={windowManager.handleSourceSelect}
          onRefreshSources={windowManager.handleGetDesktopSources}
          screenInfo={windowManager.screenInfo}
        />

        {/* Scroll to Top Button */}
        <ScrollToTopButton 
          isVisible={scrollManager.showScrollToTop}
          onClick={scrollManager.scrollToTop}
        />
      </div>
    </div>
  )
}

export default App
