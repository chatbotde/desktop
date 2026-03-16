import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { PromptInputWithActions } from '@/components'
import { GLOBAL_THEME } from '@/global/theme'
import { useAppState } from '../context/AppContext'

export function PromptInputOverlay() {
    const { uiState, messageManager, handleSendMessage } = useAppState()
    const [hasMovedDown, setHasMovedDown] = useState(false)

    useEffect(() => {
        if (!uiState.isInputVisible) {
            setHasMovedDown(false)
        }
    }, [uiState.isInputVisible])

    const onSendWrapper = async (msg: string, attachments?: any[]) => {
        setHasMovedDown(true)
        await handleSendMessage(msg, attachments)
    }

    if (!uiState.isInputVisible) return null

    return (
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
            style={{ zIndex: GLOBAL_THEME.zIndex.input }}
        >
            <motion.div
                drag
                dragMomentum={false}
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
    )
}
