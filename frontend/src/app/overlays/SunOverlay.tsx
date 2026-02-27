import { Sun } from '@/components/lottie/sun'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * SunOverlay - Renders the sun animation as a global overlay.
 * Centered and non-blocking (click-through except for the sun itself).
 */
export function SunOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('sun')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <Sun />
        </div>
    )
}
