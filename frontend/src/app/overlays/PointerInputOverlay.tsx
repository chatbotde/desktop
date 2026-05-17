'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MousePointer2, Send, X, Loader2, AlertTriangle,
    CheckCircle2, Square, Circle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { GLOBAL_THEME } from '@/global/theme'
import { useFeature } from '@/contexts/FeatureContext'
import type { AgentStep } from './agent-engine'
import { runAgent, captureScreenshot, executeStep, performAction } from './agent-engine'



/* ── Step Progress Item ───────────────────────────────────────────────── */

function StepItem({ step, isCurrent }: { step: AgentStep; isCurrent: boolean }) {
    const statusIcon = {
        pending: <Circle size={12} style={{ color: '#5f6368' }} />,
        running: (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'flex', width: 12, height: 12 }}>
                <Loader2 size={12} style={{ color: '#8ab4f8' }} />
            </motion.div>
        ),
        done: <CheckCircle2 size={12} style={{ color: '#34a853' }} />,
        error: <AlertTriangle size={12} style={{ color: '#ea4335' }} />,
        skipped: <X size={12} style={{ color: '#5f6368' }} />,
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                borderLeft: isCurrent ? '2px solid #8ab4f8' : '2px solid transparent',
                paddingLeft: 8,
            }}
        >
            {statusIcon[step.status]}
            <span style={{
                fontSize: 11, color: step.status === 'done' ? '#9aa0a6' : (isCurrent ? '#e8eaed' : '#9aa0a6'),
                fontWeight: isCurrent ? 500 : 400, flex: 1,
                textDecoration: step.status === 'skipped' ? 'line-through' : 'none',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
                {step.instruction}
            </span>
            {step.result?.element_description && step.status === 'done' && (
                <span style={{ fontSize: 9, color: '#5f6368', fontStyle: 'italic' }}>
                    {step.result.element_description}
                </span>
            )}
        </motion.div>
    )
}

/* ── Main Overlay Component ───────────────────────────────────────────── */

export function PointerInputOverlay() {
    const { isFeatureEnabled } = useFeature()
    const isVisible = isFeatureEnabled('pointer-always-visible')

    const [isExpanded, setIsExpanded] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [steps, setSteps] = useState<AgentStep[]>([])
    const [currentStepIndex, setCurrentStepIndex] = useState(-1)
    const [stepsExpanded, setStepsExpanded] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const handleExpand = useCallback(() => {
        if (isDragging) return
        setIsExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 300)
    }, [isDragging])

    const handleCollapse = useCallback(() => {
        if (isLoading) return
        setIsExpanded(false)
        setInputValue('')
        setStatusText('')
        setSteps([])
        setCurrentStepIndex(-1)
    }, [isLoading])

    const handleMouseEnter = useCallback(() => {
        if (isDragging) return
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = setTimeout(() => {
            if (!isExpanded && !isDragging) handleExpand()
        }, 400)
    }, [isExpanded, handleExpand, isDragging])

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        if (inputValue.trim() || isLoading || steps.length > 0) return
        hoverTimeoutRef.current = setTimeout(() => { handleCollapse() }, 1200)
    }, [inputValue, isLoading, handleCollapse, steps.length])

    const handleDragStart = useCallback(() => {
        setIsDragging(true)
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }, [])

    const handleDragEnd = useCallback(() => {
        setTimeout(() => setIsDragging(false), 50)
    }, [])

    /* ── Stop agent ─────────────────────────────────────────────────────── */
    const handleStop = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }
        setIsLoading(false)
        setStatusText('Stopped by user')
        setTimeout(() => setStatusText(''), 2000)
    }, [])

    /* ── Single-step mode (backward compat for quick one-off actions) ──── */
    const handleSingleStep = useCallback(async () => {
        const text = inputValue.trim()
        if (!text || isLoading) return

        setIsLoading(true)
        setStatusText('Taking screenshot…')
        setSteps([])

        const ac = new AbortController()
        abortRef.current = ac

        try {
            const screenshot = await captureScreenshot()
            if (!screenshot) {
                setStatusText('Screenshot failed')
                setTimeout(() => { setIsLoading(false); setStatusText('') }, 1500)
                return
            }
            if (ac.signal.aborted) return

            setStatusText('Asking model…')

            const coords = await executeStep(text, screenshot, ac.signal)
            if (!coords) {
                setStatusText('Could not locate element')
                setTimeout(() => { setIsLoading(false); setStatusText('') }, 2000)
                return
            }

            const isClickEnabled = isFeatureEnabled('pointer-click')
            setStatusText(isClickEnabled ? 'Acting…' : 'Pointed!')

            await performAction(coords, isClickEnabled, ac.signal)

            setInputValue('')
            setStatusText('Done ✓')
            setTimeout(() => { setIsLoading(false); setStatusText(''); setIsExpanded(false) }, 1500)
        } catch (err: any) {
            if (err.name === 'AbortError') return
            console.error('[PointerInput] Error:', err)
            setStatusText('Error occurred')
            setTimeout(() => { setIsLoading(false); setStatusText('') }, 2000)
        }
    }, [inputValue, isLoading, isFeatureEnabled])

    /* ── Multi-step agent mode ─────────────────────────────────────────── */
    const handleAgentRun = useCallback(async () => {
        const text = inputValue.trim()
        if (!text || isLoading) return

        setIsLoading(true)
        setSteps([])
        setCurrentStepIndex(-1)
        setStepsExpanded(false)

        const ac = new AbortController()
        abortRef.current = ac
        const isClickEnabled = isFeatureEnabled('pointer-click')

        try {
            await runAgent(text, isClickEnabled, ac.signal, (newSteps, idx, status) => {
                setSteps([...newSteps])
                setCurrentStepIndex(idx)
                setStatusText(status)
            })

            setInputValue('')
            setTimeout(() => { setIsLoading(false) }, 1500)
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setStatusText('Stopped by user')
                setIsLoading(false)
                return
            }
            console.error('[PointerInput] Agent error:', err)
            setStatusText('Agent error')
            setTimeout(() => { setIsLoading(false); setStatusText('') }, 2000)
        }
    }, [inputValue, isLoading, isFeatureEnabled])

    /* ── Submit dispatcher ─────────────────────────────────────────────── */
    const handleSubmit = useCallback(async () => {
        const text = inputValue.trim()
        if (!text) return

        // Heuristic: if the task is complex (multiple verbs / long), use agent mode
        const wordCount = text.split(/\s+/).length
        const hasMultipleActions = /\b(and|then|after|next|also)\b/i.test(text)

        if (wordCount > 8 || hasMultipleActions) {
            handleAgentRun()
        } else {
            handleSingleStep()
        }
    }, [inputValue, handleAgentRun, handleSingleStep])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (e.ctrlKey) {
                    // Ctrl+Enter always forces multi-step agent
                    handleAgentRun()
                } else {
                    handleSubmit()
                }
            } else if (e.key === 'Escape') {
                if (isLoading) handleStop()
                else handleCollapse()
            }
        },
        [handleSubmit, handleAgentRun, handleCollapse, handleStop, isLoading],
    )

    if (!isVisible) return null

    const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif"

    return (
        <>
            <div
                className="fixed pointer-events-none"
                style={{ bottom: 28, left: 28, zIndex: GLOBAL_THEME.zIndex.assistant + 1 }}
            >
                <motion.div
                    className="pointer-events-auto"
                    data-no-clickthrough
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    drag dragMomentum={false} dragElastic={0.05}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }}
                    style={{ display: 'flex', cursor: isExpanded ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
                >
                    <AnimatePresence mode="wait">
                        {!isExpanded ? (
                            /* ── Collapsed Pill ──────────────────────────────── */
                            <motion.button
                                key="pill"
                                onClick={handleExpand}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 18px', borderRadius: 50,
                                    border: '1px solid #333338',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    background: '#1c1c1f',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    color: '#ffffff', fontSize: 13,
                                    fontFamily: FONT, fontWeight: 500, letterSpacing: '0.3px',
                                }}
                            >
                                <MousePointer2 size={16} style={{ color: '#8ab4f8' }} />
                                <span>Agent</span>
                            </motion.button>
                        ) : (
                            /* ── Expanded Input Bar ──────────────────────────── */
                            <motion.div
                                key="input-bar"
                                initial={{ opacity: 0, width: 80, scale: 0.9 }}
                                animate={{ opacity: 1, width: 440, scale: 1 }}
                                exit={{ opacity: 0, width: 80, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                style={{
                                    display: 'flex', flexDirection: 'column',
                                    borderRadius: 20, background: '#1c1c1f',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                                    border: '1px solid #333338', overflow: 'hidden',
                                    maxHeight: '70vh',
                                }}
                            >
                                {/* Main input row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 6px 16px' }}>
                                    <MousePointer2 size={18} style={{
                                        color: '#8ab4f8', flexShrink: 0,
                                        filter: 'drop-shadow(0 0 4px rgba(138,180,248,0.4))',
                                    }} />

                                    <input
                                        ref={inputRef} type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Describe a task… e.g. 'open notepad and type hello'"
                                        disabled={isLoading}
                                        style={{
                                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                            color: '#ffffff', fontSize: 14, fontFamily: FONT,
                                            fontWeight: 400, letterSpacing: '0.2px', caretColor: '#8ab4f8',
                                            opacity: isLoading ? 0.5 : 1,
                                        }}
                                    />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                        {isLoading ? (
                                            /* ── Stop Button ─────────────────────────── */
                                            <motion.button
                                                onClick={handleStop}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Stop agent (Esc)"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    border: 'none', cursor: 'pointer',
                                                    background: '#ea4335',
                                                    boxShadow: '0 2px 8px rgba(234,67,53,0.4)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <Square size={14} style={{ color: '#fff', fill: '#fff' }} />
                                            </motion.button>
                                        ) : (
                                            <>
                                                {/* Send */}
                                                <motion.button
                                                    onClick={handleSubmit}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    disabled={!inputValue.trim()}
                                                    title="Send (Enter) / Ctrl+Enter for multi-step"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        border: 'none',
                                                        cursor: inputValue.trim() ? 'pointer' : 'default',
                                                        background: inputValue.trim() ? '#4285f4' : '#2d2d32',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: inputValue.trim() ? '0 2px 8px rgba(66,133,244,0.4)' : 'none',
                                                    }}
                                                >
                                                    <Send size={16} style={{
                                                        color: inputValue.trim() ? '#fff' : '#5f6368',
                                                        transform: 'rotate(-45deg)', marginLeft: 2, marginBottom: 2,
                                                    }} />
                                                </motion.button>

                                                {/* Close */}
                                                <motion.button
                                                    onClick={handleCollapse}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        border: 'none', cursor: 'pointer', background: '#2d2d32',
                                                    }}
                                                >
                                                    <X size={16} style={{ color: '#9aa0a6' }} />
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status bar */}
                                <AnimatePresence>
                                    {statusText && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{
                                                padding: '0 16px 6px', fontSize: 12, color: '#8ab4f8',
                                                fontFamily: FONT, fontWeight: 400, letterSpacing: '0.3px',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}
                                        >
                                            {isLoading && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    style={{ display: 'flex', width: 12, height: 12 }}
                                                >
                                                    <Loader2 size={12} style={{ color: '#8ab4f8' }} />
                                                </motion.div>
                                            )}
                                            {statusText}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── Steps Panel ─────────────────────────────── */}
                                <AnimatePresence>
                                    {steps.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{ borderTop: '1px solid #2a2a2f' }}
                                        >
                                            {/* Steps header */}
                                            <button
                                                onClick={() => setStepsExpanded(p => !p)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    width: '100%', padding: '8px 16px',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#9aa0a6', fontSize: 11, fontFamily: FONT,
                                                    fontWeight: 600, letterSpacing: '0.5px',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {stepsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                Steps ({steps.filter(s => s.status === 'done').length}/{steps.length})

                                                {/* Progress bar */}
                                                <div style={{
                                                    flex: 1, height: 3, borderRadius: 2,
                                                    background: '#2a2a2f', marginLeft: 8, overflow: 'hidden',
                                                }}>
                                                    <motion.div
                                                        animate={{
                                                            width: `${(steps.filter(s => s.status === 'done').length / Math.max(steps.length, 1)) * 100}%`,
                                                        }}
                                                        transition={{ duration: 0.3 }}
                                                        style={{ height: '100%', background: '#34a853', borderRadius: 2 }}
                                                    />
                                                </div>
                                            </button>

                                            {/* Steps list */}
                                            <AnimatePresence>
                                                {stepsExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{
                                                            padding: '0 12px 10px',
                                                            maxHeight: 200, overflowY: 'auto',
                                                        }}
                                                    >
                                                        {steps.map((step, i) => (
                                                            <StepItem
                                                                key={step.id}
                                                                step={step}
                                                                isCurrent={i === currentStepIndex}
                                                            />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

        </>
    )
}
