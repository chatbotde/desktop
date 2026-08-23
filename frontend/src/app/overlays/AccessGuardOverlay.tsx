import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { GLOBAL_THEME } from '@/global/theme'
import { Button } from '@/shared/components/ui/button'

export function AccessGuardOverlay() {
    const { user, isLoading, accessExpired, subscriptionStatus, hostedAuthEnabled } = useAuth();

    if (isLoading || !hostedAuthEnabled || !accessExpired) {
        return null;
    }

    const isDarkTheme = document.documentElement.classList.contains('dark');
    const isGuestExpired = !user && subscriptionStatus?.isGuestTrial;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
            >
                <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full text-center ${isDarkTheme ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
                    <h2 className={`text-xl font-semibold mb-3 ${isDarkTheme ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {isGuestExpired ? 'Guest Trial Ended' : 'Access Expired'}
                    </h2>
                    <p className={`text-sm mb-6 ${isDarkTheme ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {isGuestExpired
                            ? `Your ${subscriptionStatus?.trialDaysTotal ?? 7}-day guest trial has ended. Sign in to start a full trial or upgrade to continue.`
                            : subscriptionStatus?.isVip 
                                ? "Your VIP access has expired. Please enter a new code to continue."
                                : "Your subscription or trial has expired. Please upgrade or enter a special code to continue using the app."}
                    </p>
                    <div className="flex flex-col gap-3">
                        {isGuestExpired ? (
                            <Button
                                onClick={() => window.authAPI?.login()}
                                className={isDarkTheme ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                            >
                                Sign In
                            </Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('buddy:open-settings'))
                                }}
                                className={isDarkTheme ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                            >
                                Open Settings to Redeem Code
                            </Button>
                        )}
                        {user && (
                            <Button
                                variant="outline"
                                onClick={() => window.authAPI?.logout()}
                                className={isDarkTheme ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}
                            >
                                Sign Out
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
