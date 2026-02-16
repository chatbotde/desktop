import { SettingsCard } from '@/features/settings'
import { useAppState } from '../context/AppContext'
import { GLOBAL_THEME } from '@/global/theme'
import { motion, AnimatePresence } from 'framer-motion'

export function SettingsOverlay() {
    const { uiState } = useAppState()

    return (
        <AnimatePresence>
            {uiState.showSettings && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 flex justify-end"
                    style={{ zIndex: GLOBAL_THEME.zIndex.modal }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-transparent"
                        onClick={() => uiState.setShowSettings(false)}
                    />

                    {/* Side Panel Content */}
                    <motion.div
                        className="relative w-full max-w-2xl h-full bg-transparent flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-full overflow-hidden flex items-center justify-end p-4">
                            <SettingsCard onRequestClose={() => uiState.setShowSettings(false)} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
