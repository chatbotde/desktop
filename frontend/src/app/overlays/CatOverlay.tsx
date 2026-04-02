'use client'

import { useSyncExternalStore, useRef, useState, useCallback } from 'react'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { GLOBAL_THEME } from '@/global/theme'
import CatBuddy from '@/components/lottie/cat'
import type { CatPosture } from '@/components/lottie/cat'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_SIZE = 220            // px — rendered width/height

/** Right-side position where the cat sits (px from right edge). */
const REST_X_FROM_RIGHT = 160

/** Idle sequence the cat cycles through repeatedly. */
interface IdleStep { posture: CatPosture; duration: number }
const IDLE_SEQUENCE: IdleStep[] = [
    { posture: 'sit', duration: 2000 },
    { posture: 'sit', duration: 3000 },
    { posture: 'sleeping', duration: 5000 },
    { posture: 'sit', duration: 1500 },
    { posture: 'sit', duration: 1500 },
]

/**
 * Talking animation — alternates open/close mouth to simulate speech.
 * Each frame lasts a short duration for a natural "chatting" feel.
 */
const TALK_FRAMES: Array<{ posture: CatPosture; ms: number }> = [
    { posture: 'sitting-open-mouth', ms: 250 },
    { posture: 'sitting-close-mouth', ms: 200 },
]

/** Total duration of one talk session before returning to idle (ms). */
const TALK_DURATION = 4000

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CatOverlay — the cat sits at the bottom-right of the screen and cycles
 * through idle postures (stand → sit → sleeping → sit → stand) repeatedly.
 * Click the cat to make it talk (open/close mouth animation).
 * Can be dragged freely — hold and drag to reposition.
 */
export function CatOverlay() {
    const { isAnimationEnabled } = useAnimations()

    // Position
    const initialX = typeof window !== 'undefined' ? window.innerWidth - REST_X_FROM_RIGHT : 800
    const [x, setX] = useState(initialX)
    const [y, setY] = useState(0)               // vertical offset from bottom (positive = up)

    // Animation state
    const [idlePosture, setIdlePosture] = useState<CatPosture>('sit')
    const [isTalking, setIsTalking] = useState(false)
    const [talkFrame, setTalkFrame] = useState(0)

    // Drag state
    const [isDragging, setIsDragging] = useState(false)
    const dragOffsetRef = useRef({ x: 0, y: 0 })   // cursor offset within the cat at drag start
    const dragStartPosRef = useRef({ x: 0, y: 0 }) // track if pointer moved (click vs drag)
    const didDragRef = useRef(false)                // true if the user actually moved during this press

    // Animation refs
    const xRef = useRef(initialX)
    const yRef = useRef(0)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const talkFrameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const talkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isDraggingRef = useRef(false)
    const isTalkingRef = useRef(false)

    // ── Talk-frame cycle ─────────────────────────────────────────────────────
    const startTalkCycle = useCallback(() => {
        let frame = 0
        setTalkFrame(frame)

        const scheduleNext = () => {
            frame = (frame + 1) % TALK_FRAMES.length
            setTalkFrame(frame)
            talkFrameTimerRef.current = setTimeout(scheduleNext, TALK_FRAMES[frame].ms)
        }

        talkFrameTimerRef.current = setTimeout(scheduleNext, TALK_FRAMES[0].ms)
    }, [])

    const stopTalkCycle = useCallback(() => {
        if (talkFrameTimerRef.current) {
            clearTimeout(talkFrameTimerRef.current)
            talkFrameTimerRef.current = null
        }
        if (talkTimeoutRef.current) {
            clearTimeout(talkTimeoutRef.current)
            talkTimeoutRef.current = null
        }
    }, [])

    // ── Idle sequence ────────────────────────────────────────────────────────
    const startIdleSequence = useCallback(() => {
        let step = 0
        setIdlePosture(IDLE_SEQUENCE[0].posture)

        const advance = () => {
            step++
            if (step >= IDLE_SEQUENCE.length) {
                // Loop: restart the idle sequence
                step = 0
            }
            setIdlePosture(IDLE_SEQUENCE[step].posture)
            idleTimerRef.current = setTimeout(advance, IDLE_SEQUENCE[step].duration)
        }

        idleTimerRef.current = setTimeout(advance, IDLE_SEQUENCE[0].duration)
    }, [])

    const stopIdleSequence = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current)
            idleTimerRef.current = null
        }
    }, [])

    // ── Start / stop talking ─────────────────────────────────────────────────
    const startTalking = useCallback(() => {
        // Stop any current idle or existing talk
        stopIdleSequence()
        stopTalkCycle()

        isTalkingRef.current = true
        setIsTalking(true)
        startTalkCycle()

        // Auto-stop talking after TALK_DURATION, return to idle
        talkTimeoutRef.current = setTimeout(() => {
            isTalkingRef.current = false
            setIsTalking(false)
            stopTalkCycle()
            startIdleSequence()
        }, TALK_DURATION)
    }, [stopIdleSequence, stopTalkCycle, startTalkCycle, startIdleSequence])

    const stopTalking = useCallback(() => {
        isTalkingRef.current = false
        setIsTalking(false)
        stopTalkCycle()
    }, [stopTalkCycle])

    // Bootstrap on mount and animation enabled change - using syncExternalStore
    useSyncExternalStore(
        useCallback(() => {
            if (!isAnimationEnabled('cat')) return () => {}

            const startX = window.innerWidth - REST_X_FROM_RIGHT
            xRef.current = startX
            yRef.current = 0
            setX(startX)
            setY(0)

            startIdleSequence()

            return () => {
                stopIdleSequence()
                stopTalkCycle()
            }
        }, [isAnimationEnabled, startIdleSequence, stopIdleSequence, stopTalkCycle]),
        () => null,
        () => null
    )

    // ── Drag handlers ────────────────────────────────────────────────────────
    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)

        // Record where within the cat the user clicked
        const rect = e.currentTarget.getBoundingClientRect()
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }

        // Track start position to distinguish click vs drag
        dragStartPosRef.current = { x: e.clientX, y: e.clientY }
        didDragRef.current = false

        isDraggingRef.current = true
        setIsDragging(true)

        // Pause posture animations during drag
        stopIdleSequence()
        stopTalking()
    }, [stopIdleSequence, stopTalking])

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return

        // Check if the pointer moved enough to count as a drag (5px threshold)
        const dx = e.clientX - dragStartPosRef.current.x
        const dy = e.clientY - dragStartPosRef.current.y
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            didDragRef.current = true
        }

        const newX = e.clientX - dragOffsetRef.current.x
        // Convert screen Y to our bottom-anchored Y (positive = up from bottom)
        const newBottom = window.innerHeight - e.clientY - (CAT_SIZE - dragOffsetRef.current.y)
        const newY = Math.max(0, newBottom)   // clamp: can't drag below screen

        xRef.current = newX
        yRef.current = newY
        setX(newX)
        setY(newY)
    }, [])

    const onPointerUp = useCallback(() => {
        isDraggingRef.current = false
        setIsDragging(false)

        if (!didDragRef.current) {
            // It was a click, not a drag → toggle talking
            startTalking()
        } else {
            // It was a drag → resume idle
            startIdleSequence()
        }
    }, [startTalking, startIdleSequence])

    if (!isAnimationEnabled('cat')) return null

    // Determine active posture
    const activePosture: CatPosture = isTalking
        ? TALK_FRAMES[talkFrame].posture
        : idlePosture

    return (
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
                // data-no-clickthrough tells ClickThrough to NOT ignore mouse events here
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
                    touchAction: 'none',   // prevent scroll interference on touch
                }}
            >
                <CatBuddy
                    posture={activePosture}
                    width={CAT_SIZE}
                    height={CAT_SIZE}
                />
            </div>
        </div>
    )
}
