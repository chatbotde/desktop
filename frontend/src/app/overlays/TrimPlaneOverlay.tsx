'use client'

import { useState, useCallback } from 'react'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { GLOBAL_THEME } from '@/global/theme'
import TrimPlane from '@/components/lottie/plane/trim-plane'

/**
 * TrimPlaneOverlay
 *
 * TrimPlane flies left → right across the screen on loop.
 * Click the plane while it's flying → it zooms to a large centred view.
 * Click again → shrinks back and resumes flying.
 */
export function TrimPlaneOverlay() {
    const { isAnimationEnabled } = useAnimations()
    const [zoomed, setZoomed] = useState(false)

    const toggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setZoomed(prev => !prev)
    }, [])

    if (!isAnimationEnabled('trimplane')) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
        >
            <style>{`
                @keyframes cruise-left-right {
                    0%   { transform: translateX(-260px); opacity: 0; }
                    6%   { opacity: 1; }
                    94%  { opacity: 1; }
                    100% { transform: translateX(calc(100vw + 260px)); opacity: 0; }
                }

                .trim-plane-fly {
                    position: absolute;
                    top: 20%;
                    left: 0;
                    pointer-events: auto;
                    cursor: pointer;
                    animation: cruise-left-right 13s linear infinite;
                    will-change: transform;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                                opacity  0.3s ease;
                }

                .trim-plane-fly:hover {
                    filter: drop-shadow(0 0 12px rgba(41,181,225,0.7));
                }

                /* ── Zoomed state — freezes + centres the plane ── */
                .trim-plane-fly.zoomed {
                    animation-play-state: paused;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(2.6) !important;
                    filter: drop-shadow(0 0 24px rgba(41,181,225,0.9));
                    z-index: 9999;
                }

                /* dim backdrop when zoomed */
                .trim-backdrop {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.45);
                    z-index: 9998;
                    pointer-events: auto;
                    cursor: zoom-out;
                }
                .trim-backdrop.active { display: block; }
            `}</style>

            {/* backdrop — click it to shrink back */}
            <div
                className={`trim-backdrop${zoomed ? ' active' : ''}`}
                onClick={toggle}
            />

            <div
                className={`trim-plane-fly${zoomed ? ' zoomed' : ''}`}
                onClick={toggle}
                title={zoomed ? 'Click to shrink' : 'Click to zoom in'}
            >
                <TrimPlane width={200} height={200} />
            </div>
        </div>
    )
}
