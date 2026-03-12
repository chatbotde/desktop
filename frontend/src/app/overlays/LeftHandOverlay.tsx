'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { LeftHand } from '@/components/lottie/left-hand'
import { GLOBAL_THEME } from '@/global/theme'

const HAND_SIZE = 200

export function LeftHandOverlay() {
    // Initial position at bottom left
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isScaled, setIsScaled] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Refs for drag logic
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const dragStartPosRef = useRef({ x: 0, y: 0 })
    const didDragRef = useRef(false)
    const isDraggingRef = useRef(false)
    const positionRef = useRef({ x: 0, y: 0 })

    // Bootstrap position on mount
    useEffect(() => {
        const startY = typeof window !== 'undefined' ? window.innerHeight - HAND_SIZE : 800
        setPosition({ x: 0, y: startY })
        positionRef.current = { x: 0, y: startY }
    }, [])

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)

        const rect = e.currentTarget.getBoundingClientRect()
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
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

        const newX = e.clientX - dragOffsetRef.current.x
        const newY = e.clientY - dragOffsetRef.current.y

        // Don't clamp strictly so user can drag it around freely, but keep it tracked
        positionRef.current = { x: newX, y: newY }
        setPosition({ x: newX, y: newY })
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
                @keyframes wave-left {
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

                .hand-wave-left {
                    transform-origin: 50% 100%;
                    animation: wave-left 2.8s ease-in-out infinite;
                    animation-delay: 0.4s;
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
                    // The wrapper handles the scale translation smoothly
                    transform: `scale(${isScaled ? 2 : 1})`,
                    transformOrigin: '50% 100%',
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <LeftHand
                    width={HAND_SIZE}
                    height={HAND_SIZE}
                    className="hand-wave-left"
                    style={{ pointerEvents: 'auto' }}
                />
            </div>
        </div>
    )
}
