import { useState } from 'react'
import { motion } from 'framer-motion'
import { PaperPlane } from '@/components/lottie/paperplane'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * PaperPlaneOverlay - Renders the paper plane animation as a global overlay.
 * Centered and non-blocking (click-through except for the plane itself).
 */
export function PaperPlaneOverlay() {
    const { isAnimationEnabled } = useAnimations()
    const [isDragging, setIsDragging] = useState(false)

    if (!isAnimationEnabled('paperplane')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <motion.div
                className="pointer-events-auto"
                data-no-clickthrough
                drag
                dragMomentum={false}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
                whileDrag={{ scale: 1.05 }}
                style={{ 
                    cursor: isDragging ? 'grabbing' : 'grab' 
                }}
            >
                <PaperPlane />
            </motion.div>
        </div>
    )
}
