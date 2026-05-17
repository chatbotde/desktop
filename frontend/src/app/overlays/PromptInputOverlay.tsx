/**
 * @overlay PromptInputOverlay
 * @feature prompt
 * @description Main chat prompt input bar. Floats at center-bottom and slides
 *   down after first message. Draggable.
 * @placement fixed, center-bottom, draggable
 */

import { motion, useAnimation } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { PromptInputWithActions } from '@/components'
import { GLOBAL_THEME } from '@/global/theme'
import { useAppState } from '../context/AppContext'

export function PromptInputOverlay() {
  const { uiState, messageManager, handleSendMessage } = useAppState()
  const [hasMovedDown, setHasMovedDown] = useState(false)
  const constraintsRef = useRef(null)
  const dragControls = useAnimation()

  // ✅ Legitimate useEffect: responding to external state change (input hiding)
  useEffect(() => {
    if (!uiState.isInputVisible) setHasMovedDown(false)
  }, [uiState.isInputVisible])

  // ✅ Legitimate useEffect: imperative animation API (Framer Motion animate)
  useEffect(() => {
    dragControls.start({ x: 0, y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } })
  }, [hasMovedDown, dragControls])

  const onSendWrapper = useCallback(async (msg: string, attachments?: unknown[]) => {
    setHasMovedDown(true)
    await handleSendMessage(msg, attachments as never)
  }, [handleSendMessage])

  if (!uiState.isInputVisible) return null

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: GLOBAL_THEME.zIndex.input }}>
      <motion.div
        initial={{ y: '-55vh', x: '-50%', opacity: 0, scale: 0.95 }}
        animate={{
          y: hasMovedDown ? 0 : '-55vh',
          x: '-50%',
          opacity: 1,
          scale: 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-5 left-1/2 w-full max-w-xl pointer-events-none"
      >
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          dragMomentum={false}
          animate={dragControls}
          className="w-full !cursor-auto pointer-events-auto"
          data-no-clickthrough
        >
          <PromptInputWithActions
            isVisible={uiState.isInputVisible}
            onVisibilityChange={uiState.setIsInputVisible}
            isDarkTheme={uiState.isDarkTheme}
            onSendMessage={onSendWrapper}
            onStop={messageManager.handleStop}
            onAudioClick={() => uiState.setShowAudioRecorder(prev => !prev)}
            onMoreClick={() => uiState.setShowVideoScroll(true)}
            isOutputVisible={uiState.isOutputVisible}
            onToggleOutput={() => {
              if (!uiState.isOutputVisible) setHasMovedDown(true)
              uiState.setIsOutputVisible(!uiState.isOutputVisible)
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
