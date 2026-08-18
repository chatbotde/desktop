'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointer2, ArrowUp, X, Square } from 'lucide-react'
import { toast } from 'sonner'
import { GLOBAL_THEME } from '@/global/theme'
import { useFeature } from '@/contexts/FeatureContext'
import { useIsDark } from '@/shared/providers'
import { runAgent } from './agent-engine'
import { isCuaDriverReady } from '@/features/cua'

const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif"
const PILL_RADIUS = 9999

function setAgentRunning(running: boolean) {
    window.dispatchEvent(new CustomEvent('assistant-agent-state', { detail: { running } }))
}

export function PointerInputOverlay() {
    const { isFeatureEnabled } = useFeature()
    const isVisible = isFeatureEnabled('pointer-always-visible')
    const isDark = useIsDark()

    const theme = GLOBAL_THEME.vars

    const [isExpanded, setIsExpanded] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [statusText, setStatusText] = useState('Working…')

    const inputRef = useRef<HTMLInputElement>(null)
    const abortRef = useRef<AbortController | null>(null)
    const runIdRef = useRef(0)
    const silentRunRef = useRef(false)

    const canSubmit = inputValue.trim().length > 0

    const shellStyle = useMemo(() => ({
        border: `1px solid ${theme.border}`,
        background: theme.background,
        borderRadius: PILL_RADIUS,
        boxShadow: isDark
            ? '0 8px 28px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.04) inset'
            : '0 8px 28px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.65) inset',
    }), [isDark, theme.background, theme.border])

    const handleExpand = useCallback(() => {
        if (isDragging || isLoading) return
        setIsExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 200)
    }, [isDragging, isLoading])

    const handleCollapse = useCallback(() => {
        if (isLoading) return
        setIsExpanded(false)
        setInputValue('')
    }, [isLoading])

    const handleDragStart = useCallback(() => {
        setIsDragging(true)
    }, [])

    const handleDragEnd = useCallback(() => {
        setTimeout(() => setIsDragging(false), 50)
    }, [])

    const finishRun = useCallback((runId: number, reopenInput = true) => {
        if (runId !== runIdRef.current) return

        if (!silentRunRef.current) {
            setAgentRunning(false)
        }
        silentRunRef.current = false
        abortRef.current = null
        setIsLoading(false)

        if (reopenInput) {
            setIsExpanded(true)
            setInputValue('')
            setTimeout(() => inputRef.current?.focus(), 150)
        }
    }, [])

    const handleStop = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }
        finishRun(runIdRef.current, false)
        setIsExpanded(false)
        setInputValue('')
    }, [finishRun])

    useEffect(() => {
        if (!isLoading) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                handleStop()
            }
        }
        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
    }, [isLoading, handleStop])

    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort()
            setAgentRunning(false)
        }
    }, [])

    const beginRun = useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }

        const runId = ++runIdRef.current
        const silent = await isCuaDriverReady()
        silentRunRef.current = silent

        setIsLoading(true)
        setIsExpanded(false)
        if (!silent) {
            setAgentRunning(true)
        }

        const ac = new AbortController()
        abortRef.current = ac
        return { ac, runId }
    }, [])

    const handleAgentRun = useCallback(async () => {
        const text = (inputRef.current?.value ?? inputValue).trim()
        if (!text || isLoading) return

        const { ac, runId } = await beginRun()
        setStatusText('Starting…')
        const isClickEnabled = isFeatureEnabled('pointer-click')

        try {
            const result = await runAgent(text, isClickEnabled, ac.signal, (steps, idx) => {
                if (idx >= 0 && steps[idx]) {
                    setStatusText(steps[idx].instruction)
                } else if (steps.length === 0) {
                    setStatusText('Analyzing screen…')
                }
            })

            if (result.status === 'completed') {
                toast.success(result.message ?? 'Task completed')
            } else if (result.status === 'failed') {
                toast.error(result.message ?? 'Agent could not complete the task')
            } else if (result.status === 'max_steps') {
                toast.warning(result.message ?? 'Stopped at step limit')
            } else if (result.status === 'stopped') {
                toast.info('Agent stopped')
            }

            if (!result.usedCua && result.steps.length === 0) {
                toast.message('Tip: open Notepad or Edge first, or enable Auto-Click in Features for robotjs fallback.')
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            console.error('[PointerInput] Agent error:', err)
        } finally {
            finishRun(runId, true)
        }
    }, [inputValue, isLoading, isFeatureEnabled, beginRun, finishRun])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSubmit) handleAgentRun()
            } else if (e.key === 'Escape') {
                if (isLoading) handleStop()
                else handleCollapse()
            }
        },
        [canSubmit, handleAgentRun, handleCollapse, handleStop, isLoading],
    )

    if (!isVisible) return null

    // Cua runs in the background — no pointer animation or status pill while working.
    if (isLoading && silentRunRef.current) return null

    const mutedBtnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

    return (
        <div
            className="fixed pointer-events-none"
            style={{ bottom: 28, left: 28, zIndex: GLOBAL_THEME.zIndex.assistant + 1 }}
        >
            <motion.div
                className="pointer-events-auto"
                data-no-clickthrough
                drag
                dragMomentum={false}
                dragElastic={0.05}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.02 }}
                style={{ display: 'flex', cursor: isDragging ? 'grabbing' : 'default' }}
            >
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="running"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                height: 44,
                                padding: '0 8px 0 16px',
                                ...shellStyle,
                            }}
                        >
                            <MousePointer2 size={16} style={{ color: theme.accent, flexShrink: 0 }} />
                            <span
                                style={{
                                    color: theme.textMuted,
                                    fontSize: 12,
                                    fontFamily: FONT,
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={statusText}
                            >
                                {statusText}
                            </span>
                            <motion.button
                                type="button"
                                onClick={handleStop}
                                whileTap={{ scale: 0.96 }}
                                title="Stop agent (Esc)"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    height: 32,
                                    padding: '0 14px',
                                    borderRadius: PILL_RADIUS,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: '#ea4335',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontFamily: FONT,
                                    fontWeight: 600,
                                }}
                            >
                                <Square size={11} style={{ fill: '#fff' }} />
                                Stop
                            </motion.button>
                        </motion.div>
                    ) : !isExpanded ? (
                        <motion.button
                            key="pill"
                            type="button"
                            onClick={handleExpand}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 44,
                                padding: '0 18px',
                                cursor: isDragging ? 'grabbing' : 'pointer',
                                color: theme.text,
                                fontSize: 13,
                                fontFamily: FONT,
                                fontWeight: 500,
                                letterSpacing: '0.2px',
                                ...shellStyle,
                            }}
                        >
                            <MousePointer2 size={16} style={{ color: theme.accent }} />
                            <span>Agent</span>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="input-pill"
                            initial={{ opacity: 0, scale: 0.94, width: 120 }}
                            animate={{ opacity: 1, scale: 1, width: 420 }}
                            exit={{ opacity: 0, scale: 0.94, width: 120 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 48,
                                padding: '0 6px 0 16px',
                                overflow: 'hidden',
                                ...shellStyle,
                            }}
                        >
                            <MousePointer2
                                size={17}
                                style={{ color: theme.accent, flexShrink: 0 }}
                            />

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What should I do?"
                                className={`min-w-0 flex-1 bg-transparent outline-none ${isDark ? 'placeholder:text-zinc-500' : 'placeholder:text-zinc-400'}`}
                                style={{
                                    height: '100%',
                                    border: 'none',
                                    color: theme.text,
                                    fontSize: 14,
                                    fontFamily: FONT,
                                    fontWeight: 400,
                                    letterSpacing: '0.15px',
                                    caretColor: theme.accent,
                                }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <motion.button
                                    type="button"
                                    onClick={handleAgentRun}
                                    whileTap={{ scale: canSubmit ? 0.92 : 1 }}
                                    disabled={!canSubmit}
                                    title="Run (Enter)"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 34,
                                        height: 34,
                                        borderRadius: PILL_RADIUS,
                                        border: 'none',
                                        cursor: canSubmit ? 'pointer' : 'default',
                                        background: canSubmit ? theme.accent : mutedBtnBg,
                                        color: canSubmit ? '#fff' : theme.textMuted,
                                        transition: 'background 0.2s ease, color 0.2s ease',
                                    }}
                                >
                                    <ArrowUp size={17} strokeWidth={2.25} />
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={handleCollapse}
                                    whileTap={{ scale: 0.92 }}
                                    title="Close (Esc)"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 34,
                                        height: 34,
                                        borderRadius: PILL_RADIUS,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: mutedBtnBg,
                                        color: theme.textMuted,
                                    }}
                                >
                                    <X size={16} strokeWidth={2} />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
