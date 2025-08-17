import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Minimize2, Maximize2, X, Rocket, Settings, Monitor, Eye, EyeOff, Shield, ShieldOff, MessageSquare } from 'lucide-react'

interface AppHeaderProps {
  currentTheme: 'transparent' | 'black'
  opacity: number[]
  onOpacityChange: (value: number[]) => void
  contentProtection: boolean
  onContentProtectionToggle: () => void
  onChatInputToggle: () => void
  onClearChat: () => void
  mouseIgnore: boolean
  onMouseIgnoreToggle: () => void
  onGetDesktopSources: () => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export function AppHeader({
  currentTheme,
  opacity,
  onOpacityChange,
  contentProtection,
  onContentProtectionToggle,
  onChatInputToggle,
  onClearChat,
  mouseIgnore,
  onMouseIgnoreToggle,
  onGetDesktopSources,
  onMinimize,
  onMaximize,
  onClose
}: AppHeaderProps) {
  return (
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
            onValueChange={onOpacityChange}
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
          onClick={onContentProtectionToggle}
          title={contentProtection ? "Content Protection: ON" : "Content Protection: OFF"}
        >
          {contentProtection ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
        </Button>

        {/* Toggle Chat Input Window */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onChatInputToggle}
          title="Toggle Chat Input Window"
        >
          <MessageSquare className="w-3 h-3" />
        </Button>

        {/* Clear Chat Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onClearChat}
          title="Clear Chat"
        >
          <X className="w-3 h-3" />
        </Button>

        {/* Window Controls */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onMouseIgnoreToggle}
          title="Toggle Mouse Ignore"
        >
          {mouseIgnore ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-purple-500/20 hover:text-purple-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onGetDesktopSources}
          title="Screen Capture"
        >
          <Monitor className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-yellow-500/20 hover:text-yellow-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onMinimize}
        >
          <Minimize2 className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-green-500/20 hover:text-green-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onMaximize}
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
          onClick={onClose}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
