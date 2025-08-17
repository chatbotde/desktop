import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Minimize2, Maximize2, X, Rocket, Settings, Monitor, Camera, Eye, EyeOff, Shield, ShieldOff, MessageSquare, ArrowUp, AlertCircle } from 'lucide-react'
import { Messages } from '@/components/Messages'
import type { ChatMessage } from '@/components/Messages'
import { windowResizeManager } from '@/lib/window-resize'
import { sendToGemini } from '@/lib/ai/gemini'
import { isGeminiConfigured, getGeminiConfigStatus } from '@/lib/ai/gemini-utils'

// Note: Window API interface is now declared in types/electron.d.ts



function App() {
  
  const [opacity, setOpacity] = useState([1])
  const [showSettings, setShowSettings] = useState(false)
  const [mouseIgnore, setMouseIgnore] = useState(false)
  const [desktopSources, setDesktopSources] = useState<Array<{
    id: string
    name: string
    thumbnail: string
  }>>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [screenInfo, setScreenInfo] = useState<any>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [contentProtection, setContentProtection] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<'transparent' | 'black'>('transparent')
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const messageCounterRef = useRef(0)
  const processedMessageIds = useRef(new Set<string>())

  const handleChatMessage = useCallback(async (messageData: any) => {
    console.log('Main Window: Received message from chat input window:', messageData);
    
    // Generate a unique message ID
    const messageId = messageData.id || `msg_${Date.now()}_${++messageCounterRef.current}`;
    
    // Prevent duplicate messages by checking if message with same ID already exists
    if (processedMessageIds.current.has(messageId)) {
      console.log('Main Window: Duplicate message detected, ignoring:', messageId);
      return;
    }
    
    // Mark this message ID as processed
    processedMessageIds.current.add(messageId);
    
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageData.content,
      timestamp: new Date(messageData.timestamp || Date.now())
    }

    console.log('Main Window: Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage])
    setShowChat(true)
    setIsTyping(true)

    // Trigger window resize after content change
    setTimeout(() => {
      if (windowResizeManager) {
        windowResizeManager.forceResize();
      }
    }, 100)

    try {
      // Send message to Gemini and handle streaming response
      const responseStream = await sendToGemini(messageData.content);
      
      setIsTyping(false);
      
      // Create assistant message with empty content initially
      const assistantMessageId = `assistant_${Date.now()}_${++messageCounterRef.current}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      console.log('Main Window: Adding assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      // Stream the response content
      let fullResponse = '';
      for await (const chunk of responseStream) {
        fullResponse += chunk;
        
        // Update the assistant message with accumulated content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      }
      
      // Trigger window resize after content change
      setTimeout(() => {
        if (windowResizeManager) {
          windowResizeManager.forceResize();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error getting response from Gemini:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}_${++messageCounterRef.current}`,
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your message. Please make sure your Gemini API key is configured correctly. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Trigger window resize after content change
      setTimeout(() => {
        if (windowResizeManager) {
          windowResizeManager.forceResize();
        }
      }, 100);
    }
  }, [windowResizeManager])

  useEffect(() => {
    // Initialize window resize manager for dynamic sizing
    if (windowResizeManager) {
      console.log('App: Window resize manager initialized');
    }

    // Load screen info on mount
    if (window.api?.getScreenInfo) {
      window.api.getScreenInfo().then(info => {
        setScreenInfo(info)
      })
    }

    // Load initial content protection state
    if (window.api?.getContentProtection) {
      window.api.getContentProtection().then(isEnabled => {
        setContentProtection(isEnabled)
      })
    }

    // Load initial theme state
    if (window.api?.getTheme) {
      window.api.getTheme().then(theme => {
        setCurrentTheme(theme as 'transparent' | 'black')
      })
    }

    // Listen for theme changes from backend
    if (window.api?.onThemeChanged) {
      window.api.onThemeChanged((theme: string) => {
        setCurrentTheme(theme as 'transparent' | 'black')
      })
    }

    // Set up the message listener using the exposed API
    if (window.api?.onChatMessage) {
      console.log('Main Window: Setting up chat message listener');
      window.api.onChatMessage(handleChatMessage);
    } else {
      console.error('Main Window: window.api.onChatMessage not available');
    }

    // Cleanup is handled automatically by the contextBridge
    
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
  }, [handleChatMessage])

  // Handle scroll events for scroll-to-top button
  const handleScroll = () => {
    if (mainContentRef.current) {
      const scrollTop = mainContentRef.current.scrollTop;
      const scrollHeight = mainContentRef.current.scrollHeight;
      const clientHeight = mainContentRef.current.clientHeight;
      
      console.log('Scroll event:', { scrollTop, scrollHeight, clientHeight, canScroll: scrollHeight > clientHeight });
      setShowScrollToTop(scrollTop > 100);
    }
  };

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };


  const handleClose = () => {
    if (window.api?.closeWindow) {
      window.api.closeWindow()
    }
  }

  const handleMinimize = () => {
    if (window.api?.minimizeWindow) {
      window.api.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (window.api?.maximizeWindow) {
      window.api.maximizeWindow()
    }
  }

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value)
    if (window.api?.setOpacity) {
      window.api.setOpacity(value[0])
    }
  }

  const handleMouseIgnoreToggle = async () => {
    if (window.api?.toggleMouseIgnore) {
      const newState = await window.api.toggleMouseIgnore()
      setMouseIgnore(newState)
    }
  }

  const handleGetDesktopSources = async () => {
    if (window.api?.getDesktopSources) {
      setIsCapturing(true)
      try {
        const sources = await window.api.getDesktopSources()
        setDesktopSources(sources)
        setShowSettings(true)
      } catch (error) {
        console.error('Error getting desktop sources:', error)
      } finally {
        setIsCapturing(false)
      }
    }
  }

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId)
    console.log('Selected source:', sourceId)
    // Here you could start screen capture with the selected source
  }

  const handleContentProtectionToggle = async () => {
    if (window.api?.toggleContentProtection) {
      try {
        const newState = await window.api.toggleContentProtection()
        setContentProtection(newState)
        console.log('Content protection:', newState ? 'enabled' : 'disabled')
      } catch (error) {
        console.error('Error toggling content protection:', error)
      }
    }
  }



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Text copied to clipboard')
      // You could add a toast notification here
      // toast.success('Message copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // You could add an error toast here
      // toast.error('Failed to copy message')
    }
  }



  const clearChat = () => {
    setMessages([])
    setShowChat(false)
    setIsTyping(false)
    
    // Clear processed message IDs to allow new messages
    processedMessageIds.current.clear()
    messageCounterRef.current = 0
    
    // Trigger window resize after content change
    setTimeout(() => {
      if (windowResizeManager) {
        windowResizeManager.forceResize();
      }
    }, 100)
  }

  return (
    <div className={`h-screen w-full flex flex-col ${currentTheme === 'black' ? 'bg-black' : 'bg-transparent'}`}>
      {/* Fixed Header - Always on top */}
      <div className={`h-8 flex-shrink-0 fixed-header ${currentTheme === 'black' ? 'bg-gray-900 border-b border-gray-700' : 'bg-black/5 backdrop-blur-md border-b border-white/10'} flex items-center justify-between px-4 drag-region relative overflow-hidden`}>
        {/* Glassmorphism overlay */}
        {currentTheme === 'transparent' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-lg"></div>
        )}

        <div className="flex items-center gap-2 text-white/90 text-sm font-medium relative z-10">
          <Rocket className="w-4 h-4" />
          Buddy
        </div>

        <div className="flex items-center gap-3 no-drag relative z-10">
          {/* Opacity Slider */}
          <div className={`flex items-center gap-2 px-3 py-1 ${currentTheme === 'black' ? 'bg-gray-700 border-gray-600' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-full border`}>
            <Settings className={`w-3 h-3 ${currentTheme === 'black' ? 'text-gray-300' : 'text-white/70'}`} />
            <Slider
              value={opacity}
              onValueChange={handleOpacityChange}
              max={1}
              min={0.1}
              step={0.1}
              className="w-16"
            />
            <span className={`text-xs ${currentTheme === 'black' ? 'text-gray-300' : 'text-white/70'} w-8 text-right`}>
              {Math.round(opacity[0] * 100)}%
            </span>
          </div>

          {/* Content Protection Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 transition-colors ${contentProtection
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : `${currentTheme === 'black' ? 'text-gray-400 hover:bg-orange-500/20 hover:text-orange-400' : 'text-white/60 hover:bg-orange-500/20 hover:text-orange-400'}`
              }`}
            onClick={handleContentProtectionToggle}
            title={contentProtection ? "Content Protection: ON" : "Content Protection: OFF"}
          >
            {contentProtection ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
          </Button>

          {/* Toggle Chat Input Window */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={() => {
              if (window.api?.sendChatInputToggle) {
                window.api.sendChatInputToggle();
              }
            }}
            title="Toggle Chat Input Window"
          >
            <MessageSquare className="w-3 h-3" />
          </Button>

          {/* Clear Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={clearChat}
            title="Clear Chat"
          >
            <X className="w-3 h-3" />
          </Button>

          {/* Window Controls */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={handleMouseIgnoreToggle}
            title="Toggle Mouse Ignore"
          >
            {mouseIgnore ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-purple-500/20 hover:text-purple-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={handleGetDesktopSources}
            title="Screen Capture"
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-yellow-500/20 hover:text-yellow-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={handleMinimize}
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-green-500/20 hover:text-green-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={handleMaximize}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
            onClick={handleClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area - Below Fixed Header */}
      <div className="flex-1 relative overflow-hidden mt-8">
        {/* Background - Conditional based on theme */}
        {currentTheme === 'transparent' ? (
          <>
            {/* Enhanced Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 backdrop-blur-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]"></div>
          </>
        ) : (
          <>
            {/* Black Theme Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10"></div>
          </>
        )}

        {/* Scrollable Content Container */}
        <div className="relative z-10 h-full scrollable-content" ref={mainContentRef} onScroll={handleScroll}>
          {/* Chat Messages Area */}
          {showChat && (
            <div className="min-h-full flex flex-col">
              <Messages
                messages={messages}
                isTyping={isTyping}
                onCopyMessage={copyToClipboard}
              />
            </div>
          )}

          {/* Welcome Content (shown when no chat) */}
          {!showChat && (
            <div className="min-h-full flex items-start justify-center py-8">
              <div className="text-center space-y-8 max-w-md mx-auto p-8 w-full">
                <div className="space-y-4">
                  <div className={`text-6xl ${currentTheme === 'black' ? 'text-white/20' : 'text-white/30'}`}>
                    <Rocket className="w-16 h-16 mx-auto mb-4" />
                  </div>
                  <h1 className={`text-2xl font-bold ${currentTheme === 'black' ? 'text-white/90' : 'text-white/90'}`}>
                    Welcome to Buddy
                  </h1>
                  <p className={`text-lg ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/70'}`}>
                    Your AI desktop companion
                  </p>
                  
                  {/* Gemini Configuration Status */}
                  <div className={`p-3 rounded-lg border ${
                    isGeminiConfigured() 
                      ? `${currentTheme === 'black' ? 'bg-green-900/20 border-green-700' : 'bg-green-500/10 border-green-400/30'}`
                      : `${currentTheme === 'black' ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-500/10 border-orange-400/30'}`
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`w-4 h-4 ${
                        isGeminiConfigured() 
                          ? 'text-green-400' 
                          : 'text-orange-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isGeminiConfigured() 
                          ? 'text-green-400' 
                          : 'text-orange-400'
                      }`}>
                        Gemini AI Status
                      </span>
                    </div>
                    <p className={`text-xs ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}>
                      {getGeminiConfigStatus().message}
                    </p>
                    {!isGeminiConfigured() && (
                      <div className={`mt-2 text-xs ${currentTheme === 'black' ? 'text-gray-500' : 'text-white/50'} space-y-1`}>
                        {getGeminiConfigStatus().instructions?.map((instruction, index) => (
                          <div key={index}>• {instruction}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-sm ${currentTheme === 'black' ? 'text-gray-500' : 'text-white/50'} space-y-2`}>
                    <p>Click the <MessageSquare className="w-4 h-4 inline mx-1" /> button to open the floating chat input</p>
                    <p>Start typing to begin your conversation with Gemini AI</p>
                  </div>
                  
                  {/* Test content to demonstrate scrolling */}
                  <div className="space-y-4 mt-8">
                    <div className={`text-sm ${currentTheme === 'black' ? 'text-gray-600' : 'text-white/40'} space-y-2`}>
                      <p>Scroll down to see more content...</p>
                      <p>This demonstrates the main window scrolling functionality</p>
                    </div>
                    
                
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Screen Capture Section - Overlay */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 rounded-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/90 text-lg font-medium">Screen Capture</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="text-white/60 hover:text-white/90"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {isCapturing ? (
                  <div className="text-center py-4">
                    <div className="text-white/70">Loading available sources...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-white/70 text-sm">
                      {screenInfo ? `Found ${screenInfo.displays.length} display(s)` : 'Getting screen info...'}
                    </div>

                    {desktopSources.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {desktopSources.map((source) => (
                          <div
                            key={source.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSource === source.id
                              ? 'border-blue-400 bg-blue-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            onClick={() => handleSourceSelect(source.id)}
                          >
                            <img
                              src={source.thumbnail}
                              alt={source.name}
                              className="w-full h-16 object-cover rounded mb-2"
                            />
                            <div className="text-white/80 text-xs truncate">
                              {source.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleGetDesktopSources}
                        className="bg-purple-600/80 hover:bg-purple-700/80 text-white px-4 py-2 text-sm backdrop-blur-sm border border-purple-400/30"
                        size="sm"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Refresh Sources
                      </Button>

                      {selectedSource && (
                        <Button
                          onClick={() => console.log('Start capture with:', selectedSource)}
                          className="bg-green-600/80 hover:bg-green-700/80 text-white px-4 py-2 text-sm backdrop-blur-sm border border-green-400/30"
                          size="sm"
                        >
                          Start Capture
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-6 right-6 h-10 w-10 bg-blue-500/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-blue-500/30 transition-all duration-200 z-30"
            onClick={scrollToTop}
            title="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default App
