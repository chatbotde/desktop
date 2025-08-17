import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Minimize2, Maximize2, X, Rocket, Settings, Monitor, Eye, EyeOff, Shield, ShieldOff, MessageSquare, Menu } from 'lucide-react'

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

      <div className="flex items-center gap-2 no-drag relative z-10">
        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400 ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}
              title="Menu"
            >
              <Menu className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={`${currentTheme === 'black' ? 'bg-gray-800 border-gray-700' : 'bg-black/80 backdrop-blur-md border-white/20'} text-white min-w-[200px]`}
          >
            {/* Opacity Control */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-3 h-3 text-white/70" />
                <span className="text-xs text-white/70">Opacity</span>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={opacity}
                  onValueChange={onOpacityChange}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-white/70 w-8 text-right">
                  {Math.round(opacity[0] * 100)}%
                </span>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/20" />

            {/* Content Protection */}
            <DropdownMenuItem
              onClick={onContentProtectionToggle}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              {contentProtection ? <Shield className="w-3 h-3 text-green-400" /> : <ShieldOff className="w-3 h-3 text-orange-400" />}
              <span className="text-sm">
                Content Protection: {contentProtection ? 'ON' : 'OFF'}
              </span>
            </DropdownMenuItem>

            {/* Chat Input Toggle */}
            <DropdownMenuItem
              onClick={onChatInputToggle}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              <MessageSquare className="w-3 h-3 text-blue-400" />
              <span className="text-sm">Toggle Chat Input</span>
            </DropdownMenuItem>

            {/* Clear Chat */}
            <DropdownMenuItem
              onClick={onClearChat}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              <X className="w-3 h-3 text-red-400" />
              <span className="text-sm">Clear Chat</span>
            </DropdownMenuItem>

            {/* Mouse Ignore Toggle */}
            <DropdownMenuItem
              onClick={onMouseIgnoreToggle}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              {mouseIgnore ? <EyeOff className="w-3 h-3 text-blue-400" /> : <Eye className="w-3 h-3 text-blue-400" />}
              <span className="text-sm">
                Mouse Ignore: {mouseIgnore ? 'ON' : 'OFF'}
              </span>
            </DropdownMenuItem>

            {/* Screen Capture */}
            <DropdownMenuItem
              onClick={onGetDesktopSources}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              <Monitor className="w-3 h-3 text-purple-400" />
              <span className="text-sm">Screen Capture</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/20" />

            {/* Window Controls */}
            <DropdownMenuItem
              onClick={onMinimize}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              <Minimize2 className="w-3 h-3 text-yellow-400" />
              <span className="text-sm">Minimize</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onMaximize}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/10"
            >
              <Maximize2 className="w-3 h-3 text-green-400" />
              <span className="text-sm">Maximize</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close Button */}
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
