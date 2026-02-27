import { Skateboard } from '@/components/lottie/skateboard'
import { motion } from 'framer-motion'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * SkateboardOverlay - Renders the skateboarder animation as a global overlay.
 * Centered and non-blocking (click-through except for the skater itself).
 */
export function SkateboardOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('skateboard')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-end justify-center pb-20"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <motion.div
                initial={{ x: '-100vw', opacity: 1 }}
                animate={{ x: '100vw', opacity: 1 }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <Skateboard />
            </motion.div>
        </div>
    )
}
