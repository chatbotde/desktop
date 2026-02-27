'use client'

import { useState, useCallback } from 'react'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { GLOBAL_THEME } from '@/global/theme'
import PitchDownPlane from '@/components/lottie/plane/pitch-down'

/**
 * PitchDownPlaneOverlay
 *
 * PitchDownPlane descends from the top-right corner toward the bottom,
 * simulating a landing approach on loop.
 * Click the plane → zooms large and centred.
 * Click again → shrinks back and resumes descending.
 */
export function PitchDownPlaneOverlay() {
    const { isAnimationEnabled } = useAnimations()
    const [zoomed, setZoomed] = useState(false)

    const toggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setZoomed(prev => !prev)
    }, [])

    if (!isAnimationEnabled('pitchdownplane')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <style>{`
                /*
                 * Plane is anchored at top:0 / right:0 (top-right corner).
                 * Keyframe moves it diagonally: starts off-screen above-right,
                 * sweeps across the full viewport to off-screen below-left.
                 *
                 * translateX goes from 0 → -100vw  (full width left)
                 * translateY goes from -220px → 100vh (full height down)
                 * Rotation -35deg matches the actual diagonal angle.
                 */
                @keyframes landing-approach {
                    0%   {
                        transform: translate(200px, -220px);
                        opacity: 0;
                    }
                    7%   { opacity: 1; }
                    93%  { opacity: 1; }
                    100% {
                        transform: translate(calc(-100vw - 200px), calc(100vh + 100px));
                        opacity: 0;
                    }
                }

                .pitch-plane-fly {
                    position: fixed;
                    top: 0;
                    right: 0;
                    pointer-events: auto;
                    cursor: pointer;
                    animation: landing-approach 15s linear infinite;
                    animation-delay: 2s;
                    will-change: transform;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                                opacity  0.3s ease;
                }

                .pitch-plane-fly:hover {
                    filter: drop-shadow(0 0 12px rgba(43,178,167,0.75));
                }

                /* ── Zoomed state ── */
                .pitch-plane-fly.zoomed {
                    animation-play-state: paused;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(2.6) !important;
                    filter: drop-shadow(0 0 28px rgba(43,178,167,0.95));
                    z-index: 9999;
                }

                /* dim backdrop */
                .pitch-backdrop {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.45);
                    z-index: 9998;
                    pointer-events: auto;
                    cursor: zoom-out;
                }
                .pitch-backdrop.active { display: block; }
            `}</style>

            {/* Backdrop — click to dismiss zoom */}
            <div
                className={`pitch-backdrop${zoomed ? ' active' : ''}`}
                onClick={toggle}
            />

            <div
                className={`pitch-plane-fly${zoomed ? ' zoomed' : ''}`}
                onClick={toggle}
                title={zoomed ? 'Click to shrink' : 'Click to zoom in'}
            >
                <PitchDownPlane width={190} height={190} />
            </div>
        </div>
    )
}
