import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { GLOBAL_THEME } from '@/global/theme'
import { Button } from '@/shared/components/ui/button'

export function AccessGuardOverlay() {
    const { user, isLoading, accessExpired, subscriptionStatus } = useAuth();

    // If still checking auth or user is valid and unexpired, don't show the guard
    if (isLoading || (user && !accessExpired)) {
        return null;
    }

    // Don't show if there's no user (not logged in) - the AccountSection handles that
    if (!user) {
        return null;
    }

    const isDarkTheme = document.documentElement.classList.contains('dark');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // z-index placed just below the SettingsOverlay so Settings is still usable!
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
            >
                <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full text-center ${isDarkTheme ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
                    <h2 className={`text-xl font-semibold mb-3 ${isDarkTheme ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        Access Expired
                    </h2>
                    <p className={`text-sm mb-6 ${isDarkTheme ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {subscriptionStatus?.isVip 
                            ? "Your VIP access has expired. Please enter a new code to continue."
                            : "Your subscription or trial has expired. Please upgrade or enter a special code to continue using the app."}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                // Dispatch custom event to open settings
                                window.dispatchEvent(new CustomEvent('buddy:open-settings'))
                            }}
                            className={isDarkTheme ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                        >
                            Open Settings to Redeem Code
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.authAPI?.logout()}
                            className={isDarkTheme ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
