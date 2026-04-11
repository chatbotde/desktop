'use client'

import { Suspense, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GLOBAL_THEME } from '@/global/theme'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { useConfig } from '@/shared/config/config-manager'
import type { AnimationEntry } from '@/shared/registry/animationRegistry'

// ─── Layout → CSS class mapping ──────────────────────────────────────────────

const LAYOUT_CLASSES: Record<string, string> = {
    centered: 'fixed inset-0 pointer-events-none flex items-center justify-center',
    'bottom-center': 'fixed inset-0 pointer-events-none flex items-end justify-center pb-10',
    'bottom-left': 'fixed inset-0 pointer-events-none flex items-end justify-start pb-10 pl-10',
    'bottom-right': 'fixed inset-0 pointer-events-none flex items-end justify-end pb-10 pr-10',
}

// ─── Motion → framer-motion props ────────────────────────────────────────────

function getMotionProps(entry: AnimationEntry) {
    const duration = entry.motionDuration ?? 15

    switch (entry.motion) {
        case 'left-to-right':
            return {
                initial: { x: '-100vw', opacity: 1 },
                animate: { x: '100vw', opacity: 1 },
                transition: { duration, repeat: Infinity, ease: 'linear' as const },
            }
        case 'right-to-left':
            return {
                initial: { x: '100vw', opacity: 1 },
                animate: { x: '-100vw', opacity: 1 },
                transition: { duration, repeat: Infinity, ease: 'linear' as const },
            }
        case 'diagonal-down':
            return {
                initial: { x: '100vw', y: '-100vh', opacity: 0 },
                animate: { x: '-100vw', y: '100vh', opacity: 1 },
                transition: { duration, repeat: Infinity, ease: 'linear' as const },
            }
        default:
            return undefined
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface GenericLottieOverlayProps {
    entry: AnimationEntry
}

/**
 * GenericLottieOverlay — renders any registry entry that does NOT use a
 * custom overlay. Handles layout, motion, and optional click-to-zoom
 * automatically based on the entry config.
 */
export function GenericLottieOverlay({ entry }: GenericLottieOverlayProps) {
    const { isAnimationEnabled } = useAnimations()
    const { animations: globalEnabled } = useConfig('ui')
    const [isSmall, setIsSmall] = useState(false)

    const handleClick = useCallback(() => {
        if (entry.clickToZoom) setIsSmall(prev => !prev)
    }, [entry.clickToZoom])

    if (!globalEnabled || !isAnimationEnabled(entry.id)) return null
    if (!entry.component) return null

    const LottieComponent = entry.component
    const layoutClass = LAYOUT_CLASSES[entry.layout ?? 'centered']
    const motionProps = getMotionProps(entry)
    const hasMotion = !!motionProps

    return (
        <div
            className={`${layoutClass} ${entry.wrapperClassName ?? ''}`}
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <Suspense fallback={null}>
                {hasMotion ? (
                    <motion.div
                        {...motionProps}
                        style={{ pointerEvents: 'none' }}
                    >
                        {entry.clickToZoom ? (
                            <motion.div
                                animate={{ scale: isSmall ? 0.5 : 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                onClick={handleClick}
                                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                            >
                                <LottieComponent />
                            </motion.div>
                        ) : (
                            <LottieComponent />
                        )}
                    </motion.div>
                ) : entry.clickToZoom ? (
                    <motion.div
                        animate={{ scale: isSmall ? 0.5 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={handleClick}
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                        <LottieComponent />
                    </motion.div>
                ) : (
                    <LottieComponent />
                )}
            </Suspense>
        </div>
    )
}
