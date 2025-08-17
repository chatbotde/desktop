import { useEffect } from 'react'
import { Messages } from '@/components/Messages'
import { windowResizeManager } from '@/lib/window-resize'
import { 
  AppHeader, 
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
import { useIntelligentResize } from '@/hooks/useIntelligentResize'

// Note: Window API interface is now declared in types/electron.d.ts



function App() {
  // Use custom hooks for state management
  const chatManager = useChatManager()
  const windowManager = useWindowManager()
  const scrollManager = useScrollManager()
  
  // Use intelligent resizing with fixed width, ultra-minimal height
  const { forceResize } = useIntelligentResize({
    enabled: true,
    smoothResize: true,
    minWidth: 480, // Fixed width
    minHeight: 80, // Ultra-minimal height
    maxWidth: 480, // Same as minWidth for fixed width
    maxHeight: 500,
    paddingX: 5,  // Ultra-minimal horizontal padding
    paddingY: 5   // Ultra-minimal vertical padding
  })

  useEffect(() => {
    // Initialize window resize manager for dynamic sizing
    if (windowResizeManager) {
      console.log('App: Window resize manager initialized');
    }

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
        // Force resize when theme changes as it affects sizing requirements
        setTimeout(() => forceResize(), 300)
      })
    }

    // Set up the message listener using the exposed API
    if (window.api?.onChatMessage) {
      console.log('Main Window: Setting up chat message listener');
      window.api.onChatMessage((messageData: any) => {
        chatManager.handleChatMessage(messageData);
        // Force resize when new messages arrive to accommodate content
        setTimeout(() => forceResize(), 100);
      });
    } else {
      console.error('Main Window: window.api.onChatMessage not available');
    }

    // Return cleanup function for window resize manager and chat message listener
    return () => {
      if (windowResizeManager) {
        windowResizeManager.destroy();
        console.log('App: Window resize manager cleaned up');
      }
      
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

  return (
    <div className={`h-screen w-full flex flex-col ${windowManager.currentTheme === 'black' ? 'bg-black' : 'bg-transparent'}`}>
      {/* Fixed Header - Always on top */}
      <AppHeader
        currentTheme={windowManager.currentTheme}
        opacity={windowManager.opacity}
        onOpacityChange={windowManager.handleOpacityChange}
        contentProtection={windowManager.contentProtection}
        onContentProtectionToggle={windowManager.handleContentProtectionToggle}
        onChatInputToggle={windowManager.handleChatInputToggle}
        onClearChat={chatManager.clearChat}
        mouseIgnore={windowManager.mouseIgnore}
        onMouseIgnoreToggle={windowManager.handleMouseIgnoreToggle}
        onGetDesktopSources={windowManager.handleGetDesktopSources}
        onMinimize={windowManager.handleMinimize}
        onMaximize={windowManager.handleMaximize}
        onClose={windowManager.handleClose}
      />

      {/* Scrollable Content Area - Below Fixed Header */}
      <div className="relative overflow-hidden" style={{ marginTop: '32px' }}>
        {/* Background - Conditional based on theme */}
        <AppBackground currentTheme={windowManager.currentTheme} />

        {/* Scrollable Content Container */}
        <div className="relative z-10 scrollable-content" ref={scrollManager.mainContentRef} onScroll={scrollManager.handleScroll}>
          {/* Chat Messages Area */}
          {chatManager.showChat && (
            <div className="flex flex-col">
              <Messages
                messages={chatManager.messages}
                isTyping={chatManager.isTyping}
                onCopyMessage={chatManager.copyToClipboard}
              />
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
