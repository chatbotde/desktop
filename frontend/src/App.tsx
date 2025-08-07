import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Minimize2, Maximize2, X, Rocket, Settings, Monitor, Camera, Eye, EyeOff, Shield, ShieldOff, Copy, MessageSquare } from 'lucide-react'
import { PromptInputWithActions } from '@/components/chat-input'
import { 
  Message, 
  MessageAvatar, 
  MessageContent, 
  MessageActions
} from '@/components/prompt-kit/message'
import { 
  Tooltip, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

// Declare the window.api interface for TypeScript
declare global {
  interface Window {
    api?: {
      closeWindow: () => void
      minimizeWindow: () => void
      maximizeWindow: () => void
      setOpacity: (opacity: number) => void
      toggleMouseIgnore: () => Promise<boolean>
      toggleContentProtection: () => Promise<boolean>
      getContentProtection: () => Promise<boolean>
      getDesktopSources: () => Promise<Array<{
        id: string
        name: string
        thumbnail: string
      }>>
      getScreenInfo: () => Promise<{
        displays: Array<{
          id: number
          bounds: { x: number, y: number, width: number, height: number }
          workArea: { x: number, y: number, width: number, height: number }
          scaleFactor: number
          rotation: number
          primary: boolean
        }>
        primaryDisplay: {
          id: number
          bounds: { x: number, y: number, width: number, height: number }
          workArea: { x: number, y: number, width: number, height: number }
          scaleFactor: number
        }
      }>
      ping: () => string
      getVersions: () => Promise<{ electron: string; node: string }>
    }
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function App() {
  const [count, setCount] = useState(0)
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [])

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setShowChat(true)
    setIsTyping(true)

    // Simulate AI response with typing indicator
    setTimeout(() => {
      setIsTyping(false)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${content.trim()}". This is a demo response from Buddy!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1500)
  }

  const clearChat = () => {
    setMessages([])
    setShowChat(false)
    setIsTyping(false)
  }

  return (
    <div className="h-screen w-full bg-transparent flex flex-col">
      {/* Custom Title Bar */}
      <div className="h-8 bg-black/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 drag-region relative overflow-hidden">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-lg"></div>

        <div className="flex items-center gap-2 text-white/90 text-sm font-medium relative z-10">
          <Rocket className="w-4 h-4" />
          Buddy
        </div>

        <div className="flex items-center gap-3 no-drag relative z-10">
          {/* Opacity Slider */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Settings className="w-3 h-3 text-white/70" />
            <Slider
              value={opacity}
              onValueChange={handleOpacityChange}
              max={1}
              min={0.1}
              step={0.1}
              className="w-16"
            />
            <span className="text-xs text-white/70 w-8 text-right">
              {Math.round(opacity[0] * 100)}%
            </span>
          </div>

          {/* Content Protection Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 text-white/60 transition-colors ${contentProtection
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'hover:bg-orange-500/20 hover:text-orange-400'
              }`}
            onClick={handleContentProtectionToggle}
            title={contentProtection ? "Content Protection: ON" : "Content Protection: OFF"}
          >
            {contentProtection ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
          </Button>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-500/20 text-white/60 hover:text-red-400"
              onClick={clearChat}
              title="Clear Chat"
            >
              <MessageSquare className="w-3 h-3" />
            </Button>
          )}

          {/* Window Controls */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-500/20 text-white/60 hover:text-blue-400"
            onClick={handleMouseIgnoreToggle}
            title="Toggle Mouse Ignore"
          >
            {mouseIgnore ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-purple-500/20 text-white/60 hover:text-purple-400"
            onClick={handleGetDesktopSources}
            title="Screen Capture"
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-yellow-500/20 text-white/60 hover:text-yellow-400"
            onClick={handleMinimize}
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-green-500/20 text-white/60 hover:text-green-400"
            onClick={handleMaximize}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-500/20 text-white/60 hover:text-red-400"
            onClick={handleClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Enhanced Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]"></div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Chat Messages Area */}
            {showChat && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scrollbar smooth-scroll">
                  {messages.map((message) => (
                    <Message key={message.id} className="max-w-4xl mx-auto message-appear">
                      <MessageAvatar
                        src={message.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
                        alt={message.role === 'user' ? 'User' : 'Assistant'}
                        fallback={message.role === 'user' ? 'U' : 'B'}
                        className="bg-white/10 backdrop-blur-sm border border-white/20"
                      />
                      <div className="flex-1 space-y-2">
                        <MessageContent 
                          markdown={message.role === 'assistant'}
                          className="bg-white/5 backdrop-blur-lg border border-white/20 text-white/90 transition-all duration-200 hover:bg-white/10"
                        >
                          {message.content}
                        </MessageContent>
                        <MessageActions>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-white/60 hover:text-white/90 hover:bg-white/10 transition-all duration-200"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                            </Tooltip>
                          </TooltipProvider>
                        </MessageActions>
                      </div>
                    </Message>
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <Message className="max-w-4xl mx-auto message-appear">
                      <MessageAvatar
                        src="/bot-avatar.png"
                        alt="Assistant"
                        fallback="B"
                        className="bg-white/10 backdrop-blur-sm border border-white/20"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/20 text-white/90 rounded-lg p-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </Message>
                  )}
                  
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
            )}

            {/* Welcome Content (shown when no chat) */}
            {!showChat && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-8 max-w-md mx-auto p-8">
                  {/* App Logo/Icon */}
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 p-4 rounded-full backdrop-blur-sm border border-white/20 shadow-2xl">
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                      Welcome to Buddy
                    </h1>
                    <p className="text-white/80 text-lg drop-shadow-sm">
                      Your transparent desktop companion
                    </p>
                  </div>

                  {/* Interactive Counter */}
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-2xl relative overflow-hidden">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 rounded-xl"></div>
                    <div className="relative z-10">
                      <p className="text-white/90 mb-4">Click to count</p>
                      <Button
                        onClick={() => setCount(count + 1)}
                        className="bg-blue-600/80 hover:bg-blue-700/80 text-white px-8 py-3 text-lg font-medium backdrop-blur-sm border border-blue-400/30 shadow-lg"
                        size="lg"
                      >
                        {count}
                      </Button>
                    </div>
                  </div>

                  {/* Simple Info */}
                  <div className="text-white/70 text-sm drop-shadow-sm">
                    Start chatting below to begin a conversation
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

          {/* Chat Input at Bottom - Enhanced */}
          <footer className="w-full px-8 py-6 border-t border-white/20 bg-black/10 backdrop-blur-lg">
            <div className="max-w-4xl mx-auto">
              <PromptInputWithActions onSendMessage={handleSendMessage} />
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App
