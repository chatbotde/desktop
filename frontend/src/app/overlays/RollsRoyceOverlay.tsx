import { RollsRoyce } from '@/components/lottie/RR'
import { motion } from 'framer-motion'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { useState } from 'react'

/**
 * RollsRoyceOverlay - Renders the rolls royce animation as a global overlay.
 * Click-through: clicks pass through to content behind.
 * Click on the car itself to toggle between small and big size.
 */
export function RollsRoyceOverlay() {
    const { isAnimationEnabled } = useAnimations()
    const [isSmall, setIsSmall] = useState(false)

    if (!isAnimationEnabled('rollsroyce')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-end justify-center pb-10"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <motion.div
                initial={{ x: '-100vw', opacity: 1 }}
                animate={{ x: '100vw', opacity: 1 }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="w-full max-w-[800px]"
                style={{ pointerEvents: 'none' }}
            >
                <motion.div
                    animate={{ scale: isSmall ? 0.5 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => setIsSmall(!isSmall)}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                    <RollsRoyce />
                </motion.div>
            </motion.div>
        </div>
    )
}
