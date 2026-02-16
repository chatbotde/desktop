import { motion, useDragControls } from 'framer-motion'
import { PromptInputWithActions } from '@/components'
import { GLOBAL_THEME } from '@/global/theme'
import { useAppState } from '../context/AppContext'

export function PromptInputOverlay() {
    const { uiState, messageManager, handleSendMessage } = useAppState()
    const dragControls = useDragControls()

    if (!uiState.isInputVisible) return null

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-xl"
            style={{ zIndex: GLOBAL_THEME.zIndex.input }}
            data-no-clickthrough
        >
            <PromptInputWithActions
                isVisible={uiState.isInputVisible}
                onVisibilityChange={uiState.setIsInputVisible}
                isDarkTheme={uiState.isDarkTheme}
                onSendMessage={handleSendMessage}
                onStop={messageManager.handleStop}
                onAudioClick={() => uiState.setShowAudioRecorder(prev => !prev)}
                onMoreClick={() => uiState.setShowVideoScroll(true)}
                isOutputVisible={uiState.isOutputVisible}
                onToggleOutput={() => uiState.setIsOutputVisible(!uiState.isOutputVisible)}
                dragControls={dragControls}
            />
        </motion.div>
    )
}
