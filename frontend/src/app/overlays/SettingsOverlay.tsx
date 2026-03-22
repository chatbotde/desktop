import { SettingsCard } from '@/features/settings'
import { useAppState } from '../context/AppContext'
import { GLOBAL_THEME } from '@/global/theme'
import { motion, AnimatePresence } from 'framer-motion'

export function SettingsOverlay() {
    const { uiState, handleClearAllHistory } = useAppState()

    return (
        <AnimatePresence>
            {uiState.showSettings && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex shadow-2xl pointer-events-auto h-[85vh]"
                    style={{ zIndex: GLOBAL_THEME.zIndex.modal }}
                >

                    {/* Side Panel Content */}
                    <motion.div
                        className="relative w-[800px] h-full bg-transparent flex flex-col pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SettingsCard
                            onRequestClose={() => uiState.setShowSettings(false)}
                            onClearAllChatHistory={handleClearAllHistory}
                            className="w-full h-full rounded-2xl border"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
