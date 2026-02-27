import { Basketball } from '@/components/lottie/basketball'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * BasketballOverlay - Renders the basketball animation as a global overlay.
 * Centered and non-blocking (click-through except for the basketball itself).
 */
export function BasketballOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('basketball')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <Basketball />
        </div>
    )
}
