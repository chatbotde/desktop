import { Start } from '@/components/lottie/start'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'

/**
 * StartOverlay - Renders the start animation as a global overlay.
 * Centered and non-blocking (click-through except for the star itself).
 */
export function StartOverlay() {
    const { isAnimationEnabled } = useAnimations()
    if (!isAnimationEnabled('start')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <Start />
        </div>
    )
}
