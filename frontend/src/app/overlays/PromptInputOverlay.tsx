/**
 * @overlay PromptInputOverlay
 * @feature prompt
 * @description Main chat prompt input bar. Floats at center-bottom and slides
 *   down after first message. Draggable.
 * @placement fixed, center-bottom, draggable
 */

import { motion, useMotionValue, animate } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { PromptInputWithActions } from '@/components'
import { GLOBAL_THEME } from '@/global/theme'
import { useAppState } from '../context/AppContext'

type DragConstraintBox = {
  top: number
  left: number
  right: number
  bottom: number
}

const DEFAULT_DRAG_CONSTRAINTS: DragConstraintBox = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

export function PromptInputOverlay() {
  const { uiState, messageManager, handleSendMessage } = useAppState()
  const [hasMovedDown, setHasMovedDown] = useState(false)
  const [dragConstraints, setDragConstraints] = useState<DragConstraintBox>(DEFAULT_DRAG_CONSTRAINTS)
  const draggableRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // ✅ Legitimate useEffect: responding to external state change (input hiding)
  useEffect(() => {
    if (!uiState.isInputVisible) setHasMovedDown(false)
  }, [uiState.isInputVisible])

  const updateDragConstraints = useCallback(() => {
    const el = draggableRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const padding = 8

    // Framer Motion box constraints are relative to the element's layout
    // origin (where the drag offset is 0). getBoundingClientRect() includes
    // the current drag offset, so subtract it to recover that origin —
    // otherwise the reachable area shifts/shrinks every time we re-measure.
    const originLeft = rect.left - x.get()
    const originTop = rect.top - y.get()
    const originRight = rect.right - x.get()
    const originBottom = rect.bottom - y.get()

    setDragConstraints({
      top: -originTop + padding,
      left: -originLeft + padding,
      right: window.innerWidth - originRight - padding,
      bottom: window.innerHeight - originBottom - padding,
    })
  }, [x, y])

  // Re-measure drag bounds after the prompt moves or finishes its entrance animation.
  useEffect(() => {
    if (!uiState.isInputVisible) return

    updateDragConstraints()
    const settleTimer = window.setTimeout(updateDragConstraints, 450)

    window.addEventListener('resize', updateDragConstraints)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', updateDragConstraints)
    }
  }, [uiState.isInputVisible, hasMovedDown, updateDragConstraints])

  // ✅ Legitimate useEffect: imperative animation API (Framer Motion animate)
  useEffect(() => {
    const controls = [
      animate(x, 0, { type: 'spring', damping: 30, stiffness: 300 }),
      animate(y, 0, { type: 'spring', damping: 30, stiffness: 300 }),
    ]
    updateDragConstraints()
    return () => controls.forEach(c => c.stop())
  }, [hasMovedDown, x, y, updateDragConstraints])

  const onSendWrapper = useCallback(async (msg: string, attachments?: unknown[], options?: unknown) => {
    setHasMovedDown(true)
    await handleSendMessage(msg, attachments as never, options as never)
  }, [handleSendMessage])

  if (!uiState.isInputVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: GLOBAL_THEME.zIndex.input }}>
      <motion.div
        initial={{ y: '-55vh', x: '-50%', opacity: 0, scale: 0.95 }}
        animate={{
          y: hasMovedDown ? 0 : '-55vh',
          x: '-50%',
          opacity: 1,
          scale: 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onAnimationComplete={updateDragConstraints}
        className="absolute bottom-5 left-1/2 w-full max-w-xl pointer-events-none"
      >
        <motion.div
          ref={draggableRef}
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x, y }}
          onDragEnd={updateDragConstraints}
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
