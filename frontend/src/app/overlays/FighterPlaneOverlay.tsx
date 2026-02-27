import { FighterPlane } from '@/components/lottie/fighterplane'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * FighterPlaneOverlay - Renders the fighter plane animation as a global overlay.
 * Centered and non-blocking (click-through except for the plane itself).
 */
export function FighterPlaneOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('fighterplane')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <FighterPlane />
        </div>
    )
}
