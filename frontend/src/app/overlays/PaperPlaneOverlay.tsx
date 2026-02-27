import { PaperPlane } from '@/components/lottie/paperplane'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * PaperPlaneOverlay - Renders the paper plane animation as a global overlay.
 * Centered and non-blocking (click-through except for the plane itself).
 */
export function PaperPlaneOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('paperplane')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <PaperPlane />
        </div>
    )
}
