import { useState, useEffect } from 'react'
import { PromptInputWithActions } from '@/components'
import RightTransparent from '@/components/right-transparent'

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
  const [isInputVisible, setIsInputVisible] = useState(true)

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
      {/* Right Transparent Panel - Above everything */}
      <RightTransparent 
        onClick={() => setIsInputVisible(true)} 
        showInputHint={!isInputVisible}
        className="z-[100]"
      >
        {/* Add your content here */}
        <p className="text-gray-700"></p>
      </RightTransparent>

      {/* Prompt Input at Bottom */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4" data-no-clickthrough>
        <PromptInputWithActions 
          isVisible={isInputVisible} 
          onVisibilityChange={setIsInputVisible} 
        />
      </div>
    </div>
  )
}

export default App
