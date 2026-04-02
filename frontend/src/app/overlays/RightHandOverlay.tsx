'use client'

import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { RightHand } from '@/components/lottie/right-hand'
import { GLOBAL_THEME } from '@/global/theme'

const HAND_SIZE = 200

export function RightHandOverlay() {
    // Initial position at bottom right
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isScaled, setIsScaled] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Refs for drag logic
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const dragStartPosRef = useRef({ x: 0, y: 0 })
    const didDragRef = useRef(false)
    const isDraggingRef = useRef(false)
    const positionRef = useRef({ x: 0, y: 0 })

    // Bootstrap position on mount - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (typeof window === 'undefined') return () => {}
            const startX = window.innerWidth - HAND_SIZE
            const startY = window.innerHeight - HAND_SIZE
            setPosition({ x: startX, y: startY })
            positionRef.current = { x: startX, y: startY }
            return () => {}
        }, []),
        () => null,
        () => null
    )

    const isScaledRef = useRef(isScaled)
    // Sync isScaled to ref - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            isScaledRef.current = isScaled
            return () => {}
        }, [isScaled]),
        () => null,
        () => null
    )

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)

        const rect = e.currentTarget.getBoundingClientRect()
        // Compute offset based on current scale so it doesn't jump when scaled
        const scale = isScaledRef.current ? 2 : 1
        dragOffsetRef.current = {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale,
        }

        dragStartPosRef.current = { x: e.clientX, y: e.clientY }
        didDragRef.current = false
        isDraggingRef.current = true
        setIsDragging(true)
    }, [])

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return

        const dx = e.clientX - dragStartPosRef.current.x
        const dy = e.clientY - dragStartPosRef.current.y
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            didDragRef.current = true
        }

        // When scaled, the drag logic changes because top/left defines the layout bounds
        // Compute new client top left corner based on the scale offset
        const newLeftXOrigin = e.clientX - dragOffsetRef.current.x

        setPosition({ x: newLeftXOrigin, y: e.clientY - dragOffsetRef.current.y })
    }, [])

    const onPointerUp = useCallback(() => {
        isDraggingRef.current = false
        setIsDragging(false)

        if (!didDragRef.current) {
            // It was a click, not a drag -> toggle scale
            setIsScaled(prev => !prev)
        }
    }, [])

    return (
        <div
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1, overflow: 'hidden' }}
        >
            <style>{`
                @keyframes wave-right {
                    0%   { transform: rotate(0deg); }
                    10%  { transform: rotate(-20deg); }
                    20%  { transform: rotate(10deg); }
                    30%  { transform: rotate(-18deg); }
                    40%  { transform: rotate(8deg); }
                    50%  { transform: rotate(-14deg); }
                    60%  { transform: rotate(4deg); }
                    70%  { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }

                .hand-wave-right {
                    transform-origin: 50% 100%;
                    animation: wave-right 2.8s ease-in-out infinite;
                    animation-delay: 1.0s;
                    display: block;
                }
            `}</style>

            <div
                data-no-clickthrough
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    pointerEvents: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    transform: `scale(${isScaled ? 2 : 1})`,
                    transformOrigin: '50% 100%',
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <RightHand
                    width={HAND_SIZE}
                    height={HAND_SIZE}
                    className="hand-wave-right"
                    style={{ pointerEvents: 'auto' }}
                />
            </div>
        </div>
    )
}
