import { useState } from 'react'
import { PromptInputWithActions } from '@/components'
import ClickThrough from '@/components/click-through'
import RightTransparent from '@/components/right-transparent'
import { OutputMessages } from './components/output-messages'

declare global {
  interface Window {
    interfaceAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setIgnoreMouseEvents?: (ignore: boolean, options?: { forward?: boolean }) => void;
    }
  }
}

function App() {
  const [isInputVisible, setIsInputVisible] = useState(true)

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
      <OutputMessages />

      {/* Prompt Input at Bottom */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        data-no-clickthrough
      >
        <PromptInputWithActions 
          isVisible={isInputVisible} 
          onVisibilityChange={setIsInputVisible} 
        />
      </div>
    </div>
  )
}

export default App
