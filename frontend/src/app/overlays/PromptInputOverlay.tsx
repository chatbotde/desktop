import { motion, useAnimation } from 'framer-motion'
import { useState, useSyncExternalStore, useCallback, useRef } from 'react'
import { PromptInputWithActions } from '@/components'
import { GLOBAL_THEME } from '@/global/theme'
import { useAppState } from '../context/AppContext'

export function PromptInputOverlay() {
    const { uiState, messageManager, handleSendMessage } = useAppState()
    const [hasMovedDown, setHasMovedDown] = useState(false)
    const constraintsRef = useRef(null)
    const dragControls = useAnimation()

    // Reset hasMovedDown when input becomes invisible - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (!uiState.isInputVisible) {
                setHasMovedDown(false)
            }
            return () => {}
        }, [uiState.isInputVisible]),
        () => null,
        () => null
    )

    // Reset drag position when base position shifts - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            dragControls.start({ x: 0, y: 0, transition: { type: "spring", damping: 30, stiffness: 300 } })
            return () => {}
        }, [hasMovedDown, dragControls]),
        () => null,
        () => null
    )

    const onSendWrapper = async (msg: string, attachments?: any[]) => {
        setHasMovedDown(true)
        await handleSendMessage(msg, attachments)
    }

    if (!uiState.isInputVisible) return null

    return (
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: GLOBAL_THEME.zIndex.input }}>
            <motion.div
                initial={{ y: "-40vh", x: "-50%", opacity: 0, scale: 0.95 }}
                animate={{
                    y: hasMovedDown ? 0 : "-40vh",
                    x: "-50%",
                    opacity: 1,
                    scale: 1
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
