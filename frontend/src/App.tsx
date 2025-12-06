import { useState, useEffect } from 'react'
import { PromptInputWithActions } from '@/components'

declare global {
  interface Window {
    interfaceAPI?: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    }
  }
}

function App() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home')

  // Click-through logic
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the element or any of its parents has the data-no-clickthrough attribute
      const isClickable = target.closest('[data-no-clickthrough]');
      
      if (isClickable) {
        // Disable click-through (capture mouse events)
        window.interfaceAPI?.setIgnoreMouseEvents(false);
      } else {
        // Enable click-through (pass mouse events to window behind)
        window.interfaceAPI?.setIgnoreMouseEvents(true);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    
    // Initial state: click-through enabled
    window.interfaceAPI?.setIgnoreMouseEvents(true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent relative">
      {/* Toggle Button (shows when card is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-no-clickthrough
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm text-white/90 backdrop-blur-md transition-all hover:scale-105"
        >
          Open Card
        </button>
      )}

      {/* Floating Card */}
      {isOpen && (
        <div 
          data-no-clickthrough
          className="w-80 rounded-xl border border-white/10 bg-blue-600 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Card Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">Floating Card</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Card Content */}
          <div className="p-4 space-y-3">
            {activeTab === 'home' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <p className="text-sm text-white/70">Welcome! Choose an action below.</p>
                <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors">
                  Primary Action
                </button>
                <button className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white/90 transition-colors">
                  Secondary Action
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Dark Mode</span>
                  <input type="checkbox" defaultChecked className="accent-blue-500" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Notifications</span>
                  <input type="checkbox" className="accent-blue-500" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Sound</span>
                  <input type="checkbox" defaultChecked className="accent-blue-500" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompt Input at Bottom */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4" data-no-clickthrough>
        <PromptInputWithActions />
      </div>
    </div>
  )
}

export default App
