'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GLOBAL_THEME } from '@/global/theme'
import CatBuddy from '@/components/lottie/cat'
import type { CatPosture } from '@/components/lottie/cat'
import { useLiveAssistant } from '@/components/assistant-animation/use-live-assistant'
import { ImageGenerationWindow } from '@/components/image-generation-window'
import { VideoGenerationWindow } from '@/components/video-generation-window'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_SIZE = 220            // px — rendered width/height

/** Right-side position where the cat sits (px from right edge). */
const REST_X_FROM_RIGHT = 160

/**
 * Talk animation — alternates open/close mouth while AI is speaking.
 * Each frame lasts a short duration for a natural chatting feel.
 */
const TALK_FRAMES: Array<{ posture: CatPosture; ms: number }> = [
    { posture: 'sitting-open-mouth', ms: 250 },
    { posture: 'sitting-close-mouth', ms: 200 },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CatAssistantOverlay — cat-based voice assistant.
 *
 * Only 3 postures:
 *  • Disconnected     → sleeping
 *  • Connected + AI speaking → talking (open/close mouth cycle)
 *  • Connected + not speaking → sitting-close-mouth
 *
 * Click to connect/disconnect. Drag to reposition.
 */
export function CatAssistantOverlay() {

    // ── Live Assistant hook (same one used by the sphere) ─────────────────────
    const {
        connect,
        disconnect,
        connected,
        isSpeaking,
        imageGeneration,
        videoGeneration,
        closeImageGeneration,
        closeVideoGeneration,
    } = useLiveAssistant()

    // ── Position ─────────────────────────────────────────────────────────────
    const initialX = typeof window !== 'undefined' ? window.innerWidth - REST_X_FROM_RIGHT : 800
    const [x, setX] = useState(initialX)
    const [y, setY] = useState(0)

    // ── Animation state ──────────────────────────────────────────────────────
    const [talkFrame, setTalkFrame] = useState(0)

    // ── Drag state ───────────────────────────────────────────────────────────
    const [isDragging, setIsDragging] = useState(false)
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const dragStartPosRef = useRef({ x: 0, y: 0 })
    const didDragRef = useRef(false)

    // ── Refs ─────────────────────────────────────────────────────────────────
    const xRef = useRef(initialX)
    const yRef = useRef(0)
    const talkFrameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isDraggingRef = useRef(false)

    // ── Visibility (toggle via event, same pattern as AssistantSphere) ────────
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleToggle = () => setIsVisible(prev => !prev)
        window.addEventListener('toggle-cat-assistant-visibility', handleToggle)
        return () => window.removeEventListener('toggle-cat-assistant-visibility', handleToggle)
    }, [])

    // Auto-disconnect when hidden
    useEffect(() => {
        if (!isVisible && connected) {
            disconnect()
        }
    }, [isVisible, connected, disconnect])

    // ── Talk-frame cycle (driven by isSpeaking) ──────────────────────────────
    useEffect(() => {
        if (isSpeaking) {
            // Start cycling talk frames
            let frame = 0
            setTalkFrame(frame)

            const scheduleNext = () => {
                frame = (frame + 1) % TALK_FRAMES.length
                setTalkFrame(frame)
                talkFrameTimerRef.current = setTimeout(scheduleNext, TALK_FRAMES[frame].ms)
            }

            talkFrameTimerRef.current = setTimeout(scheduleNext, TALK_FRAMES[0].ms)

            return () => {
                if (talkFrameTimerRef.current) {
                    clearTimeout(talkFrameTimerRef.current)
                    talkFrameTimerRef.current = null
                }
            }
        } else {
            // Stop talk cycle
            if (talkFrameTimerRef.current) {
                clearTimeout(talkFrameTimerRef.current)
                talkFrameTimerRef.current = null
            }
        }
    }, [isSpeaking])

    // ── Bootstrap position on mount ──────────────────────────────────────────
    useEffect(() => {
        const startX = window.innerWidth - REST_X_FROM_RIGHT
        xRef.current = startX
        yRef.current = 0
        setX(startX)
        setY(0)
    }, [])

    // ── Drag handlers ────────────────────────────────────────────────────────
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
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            didDragRef.current = true
        }

        const newX = e.clientX - dragOffsetRef.current.x
        const newBottom = window.innerHeight - e.clientY - (CAT_SIZE - dragOffsetRef.current.y)
        const newY = Math.max(0, newBottom)

        xRef.current = newX
        yRef.current = newY
        setX(newX)
        setY(newY)
    }, [])

    const onPointerUp = useCallback(() => {
        isDraggingRef.current = false
        setIsDragging(false)

        if (!didDragRef.current) {
            // Click → toggle connection
            if (connected) {
                disconnect()
            } else {
                connect()
            }
        }
    }, [connected, connect, disconnect])

    // ── Guard: don't render if not visible ─────────────────────────────────────
    if (!isVisible) return null

    // ── Determine active posture based on assistant state ─────────────────────
    let activePosture: CatPosture

    if (!connected) {
        activePosture = 'sleeping'
    } else if (isSpeaking) {
        activePosture = TALK_FRAMES[talkFrame].posture
    } else {
        activePosture = 'sitting-close-mouth'
    }

    return (
        <>
            <div
                className="fixed pointer-events-none"
                style={{
                    bottom: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: GLOBAL_THEME.zIndex.modal - 1,
                    overflow: 'visible',
                }}
            >
                <div
                    data-no-clickthrough
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    style={{
                        position: 'absolute',
                        bottom: 24 + y,
                        left: x,
                        pointerEvents: 'auto',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        willChange: 'transform',
                        touchAction: 'none',
                    }}
                >
                    <CatBuddy
                        posture={activePosture}
                        width={CAT_SIZE}
                        height={CAT_SIZE}
                    />

                </div>
            </div>

            {/* Tool Popups — same as AssistantSphere */}
            <ImageGenerationWindow
                isVisible={imageGeneration.isVisible}
                images={imageGeneration.images}
                isLoading={imageGeneration.isLoading}
                onClose={closeImageGeneration}
            />

            <VideoGenerationWindow
                isVisible={videoGeneration.isVisible}
                videos={videoGeneration.videos}
                isLoading={videoGeneration.isLoading}
                onClose={closeVideoGeneration}
            />
        </>
    )
}
