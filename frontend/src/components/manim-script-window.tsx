import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clapperboard, ChevronDown, ChevronUp, GripVertical, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLOBAL_THEME } from '@/global/theme'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { ResizeHandle } from '@/features/output-window/components/ResizeHandle'
import { useDraggable } from '@/features/output-window/hooks'
import type { ResizeDirection } from '@/features/output-window/hooks/useResizable'
import type { Position, Size } from '@/features/output-window/types'
import {
  emitManimGenerationStatus,
  renderManimVideoFromPlan,
  previewManimSceneFromPlan,
  formatTimingMs,
  type ManimGenerationStatus,
  type ManimScriptPlan,
} from '@/lib/manim/manim-video-prompt'
import {
  applyTargetDurationToPlan,
  ensureChapters,
  formatDurationLabel,
  estimateNarrationDurationSeconds,
  minNarrationWordsForDuration,
  countNarrationWords,
  shouldRenderInChunks,
  DEFAULT_VIDEO_DURATION_SECONDS,
  LONG_VIDEO_THRESHOLD_SECONDS,
  TARGET_DURATION_OPTIONS,
} from '@/features/chat/lib/manim-video-request'
import { manimPipelineTimer, type ManimPipelineTiming } from '@/lib/manim/manim-timing'

interface ManimScriptWindowProps {
  status: Exclude<ManimGenerationStatus, { phase: 'idle' }>
  isDarkTheme?: boolean
  onClose: () => void
}

function ManimTimingSummary({
  timing,
  isDarkTheme,
}: {
  timing: ManimPipelineTiming
  isDarkTheme: boolean
}) {
  const rows = [
    { label: 'Script planning (AI)', ms: timing.planningMs },
    { label: 'Code generation (AI)', ms: timing.codeMs },
    { label: 'Manim render', ms: timing.renderMs },
    { label: 'Stitch parts', ms: timing.stitchMs },
    { label: 'Load into app', ms: timing.deliverMs },
  ].filter((row) => row.ms > 0)

  const maxMs = Math.max(timing.totalMs, ...rows.map((r) => r.ms), 1)

  return (
    <div className="space-y-3 p-3">
      <div className="text-center">
        <p className={cn('text-2xl font-bold tabular-nums', isDarkTheme ? 'text-purple-200' : 'text-purple-900')}>
          {formatTimingMs(timing.totalMs)}
        </p>
        <p className={cn('text-xs', isDarkTheme ? 'text-zinc-400' : 'text-zinc-600')}>
          Total pipeline time
          {timing.targetDurationSeconds
            ? ` · target video ~${formatDurationLabel(timing.targetDurationSeconds)}`
            : ''}
          {timing.mode === 'chunked' ? ` · ${timing.chapterCount} parts` : ''}
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className={isDarkTheme ? 'text-zinc-400' : 'text-zinc-600'}>{row.label}</span>
              <span className={cn('tabular-nums font-medium', isDarkTheme ? 'text-zinc-200' : 'text-zinc-800')}>
                {formatTimingMs(row.ms)}
              </span>
            </div>
            <div className={cn('h-1.5 overflow-hidden rounded-full', isDarkTheme ? 'bg-zinc-800' : 'bg-zinc-200')}>
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${Math.max(4, (row.ms / maxMs) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className={cn('text-[11px] leading-relaxed', isDarkTheme ? 'text-zinc-500' : 'text-zinc-500')}>
        Render is usually the slowest step. Check the browser console for a full per-part log.
      </p>
    </div>
  )
}

const PANEL_Z = GLOBAL_THEME.zIndex.modal
const COLLAPSED_SIZE: Size = { width: 320, height: 76 }
const EXPANDED_SIZE: Size = { width: 480, height: 640 }
const MIN_WIDTH = 280
const MIN_HEIGHT_COLLAPSED = 72
const MIN_HEIGHT_EXPANDED = 320
const MAX_WIDTH = 640
const MAX_HEIGHT = 860
const RESIZE_DIRECTIONS: ResizeDirection[] = ['se', 's', 'e']
const VIEWPORT_MARGIN = 12

const SURFACE_DARK = 'border-purple-500/30 bg-zinc-900'
const SURFACE_LIGHT = 'border-purple-300/50 bg-zinc-50'

function defaultPosition(panelSize: Size): Position {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  return {
    x: Math.round((w - panelSize.width) / 2),
    y: Math.round((h - panelSize.height) / 2),
  }
}

function clampPosition(pos: Position, panelSize: Size): Position {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  return {
    x: Math.max(VIEWPORT_MARGIN, Math.min(pos.x, w - panelSize.width - VIEWPORT_MARGIN)),
    y: Math.max(VIEWPORT_MARGIN, Math.min(pos.y, h - panelSize.height - VIEWPORT_MARGIN)),
  }
}

function clampSize(size: Size, expanded: boolean): Size {
  const minH = expanded ? MIN_HEIGHT_EXPANDED : MIN_HEIGHT_COLLAPSED
  return {
    width: Math.max(MIN_WIDTH, Math.min(size.width, MAX_WIDTH)),
    height: Math.max(minH, Math.min(size.height, MAX_HEIGHT)),
  }
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function arrayToLines(items: string[] | undefined): string {
  return (items || []).join('\n')
}

export function ManimScriptWindow({
  status,
  isDarkTheme = true,
  onClose,
}: ManimScriptWindowProps) {
  const [expanded, setExpanded] = useState(false)
  const [size, setSize] = useState<Size>(COLLAPSED_SIZE)
  const [position, setPosition] = useState<Position>(() => defaultPosition(COLLAPSED_SIZE))
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [resizing, setResizing] = useState(false)

  const isReview = status.phase === 'review'
  const isPlanning = status.phase === 'planning'
  const isGenerating = status.phase === 'generating'
  const isDone = status.phase === 'done'
  const isError = status.phase === 'error'

  const [liveElapsedMs, setLiveElapsedMs] = useState(0)

  useEffect(() => {
    if (!isPlanning && !isGenerating) return
    const tick = () => setLiveElapsedMs(manimPipelineTimer.getElapsedMs())
    tick()
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [isPlanning, isGenerating])

  useEffect(() => {
    if (isPlanning || isGenerating) {
      setExpanded(false)
      setSize(COLLAPSED_SIZE)
      return
    }
    if (isReview) {
      setExpanded(true)
      setSize((prev) => clampSize(
        { width: Math.max(prev.width, EXPANDED_SIZE.width), height: EXPANDED_SIZE.height },
        true,
      ))
    }
    if (isDone) {
      setLiveElapsedMs(manimPipelineTimer.getElapsedMs())
    }
  }, [status.phase, isPlanning, isGenerating, isReview, isDone])

  const reviewStatus = isReview ? status : null
  const [editedTopic, setEditedTopic] = useState('')
  const [narration, setNarration] = useState('')
  const [outlineText, setOutlineText] = useState('')
  const [keyStepsText, setKeyStepsText] = useState('')
  const [userContentText, setUserContentText] = useState('')
  const [targetDurationSeconds, setTargetDurationSeconds] = useState(DEFAULT_VIDEO_DURATION_SECONDS)
  const [isRendering, setIsRendering] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewCode, setPreviewCode] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [lastReview, setLastReview] = useState<{
    topic: string
    userPrompt: string
    plan: ManimScriptPlan
  } | null>(null)

  useEffect(() => {
    if (!reviewStatus) return
    const { plan, topic } = reviewStatus
    setEditedTopic(plan.topic || topic)
    setNarration(plan.narration || '')
    setUserContentText(plan.userContent || '')
    setOutlineText(arrayToLines(plan.outline))
    setKeyStepsText(arrayToLines(plan.keySteps))
    setTargetDurationSeconds(plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS)
    setPreviewCode('')
    setPreviewUrl(null)
    setPreviewError(null)
  }, [reviewStatus])

  const reviewPlan = reviewStatus?.plan
  const planForPreview = reviewPlan
    ? applyTargetDurationToPlan(
        { ...reviewPlan, narration, outline: linesToArray(outlineText), keySteps: linesToArray(keyStepsText) },
        targetDurationSeconds,
      )
    : null
  const chapterPreview = planForPreview ? ensureChapters(planForPreview) : []
  const usesChunks = planForPreview ? shouldRenderInChunks(planForPreview) : false
  const isLongVideo = targetDurationSeconds >= LONG_VIDEO_THRESHOLD_SECONDS
  const durationLabel = formatDurationLabel(targetDurationSeconds)
  const narrationEstimateSeconds = narration ? estimateNarrationDurationSeconds(narration) : 0
  const narrationWordCount = narration ? countNarrationWords(narration) : 0
  const narrationTargetSeconds = targetDurationSeconds
  const narrationTooShort =
    narrationTargetSeconds > 0 && narrationEstimateSeconds < narrationTargetSeconds * 0.75

  const progressLabel = (() => {
    if (status.phase !== 'generating' || !status.progress) return null
    const { step, current, total, label } = status.progress
    if (step === 'preview') return `Preview: ${label} (${current}/${total})`
    if (step === 'code') return `Writing code: part ${current} of ${total} — ${label}`
    if (step === 'render') return `Rendering: part ${current} of ${total} — ${label}`
    return 'Stitching parts into final video…'
  })()

  const elapsedLabel = formatTimingMs(
    isDone && status.phase === 'done'
      ? status.timing.totalMs
      : status.phase === 'generating' && status.progress?.elapsedMs
        ? status.progress.elapsedMs
        : liveElapsedMs,
  )

  const handleExpand = useCallback(() => {
    setExpanded(true)
    setSize((prev) => clampSize(
      { width: Math.max(prev.width, EXPANDED_SIZE.width), height: EXPANDED_SIZE.height },
      true,
    ))
  }, [])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
    setSize(COLLAPSED_SIZE)
  }, [])

  const collapsedHint = (() => {
    if (isPreviewing) return 'Rendering animation preview…'
    if (isPlanning) return 'Writing teaching script…'
    if (isGenerating) return progressLabel || 'Converting to video…'
    if (isReview) return 'Script ready — expand to edit'
    if (isDone && status.phase === 'done') return `Done in ${formatTimingMs(status.timing.totalMs)}`
    if (isError) return status.error
    return 'Manim video'
  })()

  const setClampedPosition = useCallback(
    (pos: Position) => setPosition(clampPosition(pos, size)),
    [size],
  )

  const { handleDragMouseDown, isDragging } = useDraggable(setClampedPosition, containerRef)

  const surface = isDarkTheme ? SURFACE_DARK : SURFACE_LIGHT

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-manim-scroll], [data-no-drag], input, textarea, button')) return
      window.interfaceAPI?.setIgnoreMouseEvents(false)
      handleDragMouseDown(e)
    },
    [handleDragMouseDown],
  )

  useEffect(() => {
    setPosition((prev) => clampPosition(prev, size))
  }, [size.width, size.height])

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault()
      e.stopPropagation()
      window.interfaceAPI?.setIgnoreMouseEvents(false)
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      }
      setResizing(true)

      const onMove = (ev: MouseEvent) => {
        if (!resizeStartRef.current) return
        const dx = ev.clientX - resizeStartRef.current.x
        const dy = ev.clientY - resizeStartRef.current.y
        let w = resizeStartRef.current.width
        let h = resizeStartRef.current.height
        if (direction.includes('e')) w += dx
        if (direction.includes('s')) h += dy
        setSize(clampSize({ width: w, height: h }, expanded))
      }

      const onUp = () => {
        resizeStartRef.current = null
        setResizing(false)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [size.width, size.height, expanded],
  )

  const handleCancel = useCallback(() => {
    emitManimGenerationStatus({ phase: 'idle' })
    onClose()
  }, [onClose])

  const handleBackToScript = useCallback(() => {
    const ctx = status.phase === 'error' ? status.recover : lastReview
    if (!ctx) {
      handleCancel()
      return
    }
    emitManimGenerationStatus({
      phase: 'review',
      topic: ctx.topic,
      userPrompt: ctx.userPrompt,
      plan: ctx.plan,
    })
  }, [status, lastReview, handleCancel])

  const handleRetry = useCallback(async () => {
    const ctx = status.phase === 'error' ? status.recover : lastReview
    if (!ctx) return
    setIsRendering(true)
    try {
      await renderManimVideoFromPlan(ctx.plan, ctx.userPrompt)
    } catch {
      // Error status is emitted by renderManimVideoFromPlan
    } finally {
      setIsRendering(false)
    }
  }, [status, lastReview])

  const handlePreview = useCallback(async () => {
    if (!reviewStatus) return

    const editedPlan = applyTargetDurationToPlan(
      {
        ...reviewStatus.plan,
        topic: editedTopic.trim() || reviewStatus.topic,
        narration: narration.trim(),
        userContent: userContentText.trim() || undefined,
        outline: linesToArray(outlineText),
        keySteps: linesToArray(keyStepsText),
      },
      targetDurationSeconds,
    )

    if (!editedPlan.narration) {
      setPreviewError('Narration cannot be empty.')
      return
    }

    setLastReview({
      topic: editedPlan.topic || reviewStatus.topic,
      userPrompt: reviewStatus.userPrompt,
      plan: editedPlan,
    })

    setIsPreviewing(true)
    setPreviewError(null)
    setPreviewUrl(null)
    try {
      const result = await previewManimSceneFromPlan(editedPlan, reviewStatus.userPrompt)
      setPreviewCode(result.code)
      if (result.videoUrl) {
        setPreviewUrl(result.videoUrl)
      }
      if (result.error) {
        setPreviewError(result.error)
      }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsPreviewing(false)
    }
  }, [reviewStatus, editedTopic, narration, userContentText, outlineText, keyStepsText, targetDurationSeconds])

  const handleConvert = useCallback(async () => {
    if (!reviewStatus) return

    const editedPlan = applyTargetDurationToPlan(
      {
        ...reviewStatus.plan,
        topic: editedTopic.trim() || reviewStatus.topic,
        narration: narration.trim(),
        userContent: userContentText.trim() || undefined,
        outline: linesToArray(outlineText),
        keySteps: linesToArray(keyStepsText),
      },
      targetDurationSeconds,
    )

    if (!editedPlan.narration) {
      emitManimGenerationStatus({ phase: 'error', error: 'Narration cannot be empty.' })
      return
    }

    setLastReview({
      topic: editedPlan.topic || reviewStatus.topic,
      userPrompt: reviewStatus.userPrompt,
      plan: editedPlan,
    })

    setIsRendering(true)
    try {
      const useSingleSceneOverride =
        previewCode.trim() &&
        !usesChunks
      await renderManimVideoFromPlan(editedPlan, reviewStatus.userPrompt, {
        manimCodeOverride: useSingleSceneOverride ? previewCode.trim() : undefined,
      })
    } catch {
      // Error status is emitted by renderManimVideoFromPlan
    } finally {
      setIsRendering(false)
    }
  }, [reviewStatus, editedTopic, narration, userContentText, outlineText, keyStepsText, targetDurationSeconds, previewCode, usesChunks])

  const labelClass = cn(
    'text-[11px] font-medium uppercase tracking-wide',
    isDarkTheme ? 'text-zinc-400' : 'text-zinc-600',
  )

  const inputClass = cn(
    'text-sm',
    isDarkTheme
      ? 'border-purple-500/20 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500'
      : 'border-purple-300/40 bg-white text-zinc-900',
  )

  const topicLabel =
    status.phase === 'planning' || status.phase === 'generating' || status.phase === 'review'
      ? status.topic
      : 'Manim video'

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        onMouseDown={startDrag}
        className={cn(
          'fixed flex flex-col overflow-hidden rounded-2xl border shadow-2xl',
          surface,
          (resizing || isDragging) && 'select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: PANEL_Z,
        }}
        data-on-clickthrough
      >
        {expanded && RESIZE_DIRECTIONS.map((dir) => (
          <ResizeHandle
            key={dir}
            direction={dir}
            onMouseDown={handleResizeMouseDown}
          />
        ))}

        <div
          className={cn(
            'flex shrink-0 items-center gap-2 border-b px-3 py-2',
            isDarkTheme ? 'border-purple-500/20 bg-purple-950/30' : 'border-purple-200 bg-purple-50/80',
          )}
        >
          <GripVertical className={cn('size-4 shrink-0', isDarkTheme ? 'text-zinc-500' : 'text-zinc-400')} />
          <div className="min-w-0 flex-1">
            <p className={cn('truncate text-sm font-semibold', isDarkTheme ? 'text-purple-100' : 'text-purple-900')}>
              Manim video
            </p>
            <p className={cn('truncate text-xs', isDarkTheme ? 'text-zinc-400' : 'text-zinc-600')}>
              {topicLabel}
              {durationLabel ? ` · ~${durationLabel}` : ''}
            </p>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums',
              isDarkTheme ? 'bg-purple-950/60 text-purple-200' : 'bg-purple-100 text-purple-800',
            )}
            data-no-drag
          >
            {elapsedLabel}
          </span>

          <button
            type="button"
            onClick={expanded ? handleCollapse : handleExpand}
            className={cn(
              'shrink-0 rounded-full p-1.5 transition-colors',
              isDarkTheme
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800',
            )}
            aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
            data-no-drag
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isRendering || isGenerating}
            className={cn(
              'shrink-0 rounded-full p-1.5 transition-colors',
              isDarkTheme
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800',
            )}
            aria-label="Close"
            data-no-drag
          >
            <X className="size-4" />
          </button>
        </div>

        {!expanded ? (
          <button
            type="button"
            onClick={handleExpand}
            className={cn(
              'flex min-h-0 flex-1 items-center gap-2 px-3 py-2 text-left transition-colors',
              isDarkTheme ? 'hover:bg-purple-950/30' : 'hover:bg-purple-50',
            )}
            data-no-drag
          >
            {(isPlanning || isGenerating) && (
              <Loader2 className="size-4 shrink-0 animate-spin text-purple-400" />
            )}
            <span className={cn('line-clamp-2 text-xs', isDarkTheme ? 'text-zinc-300' : 'text-zinc-700')}>
              {collapsedHint}
            </span>
          </button>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col" data-manim-scroll>
          {isPlanning && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <Loader2 className="size-8 animate-spin text-purple-400" />
              <p className={cn('text-sm', isDarkTheme ? 'text-zinc-300' : 'text-zinc-700')}>
                Generating teaching script…
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <Loader2 className="size-8 animate-spin text-purple-400" />
              <p className={cn('text-sm font-medium', isDarkTheme ? 'text-zinc-200' : 'text-zinc-800')}>
                {progressLabel || 'Converting to video…'}
              </p>
              <p className={cn('text-xs', isDarkTheme ? 'text-zinc-500' : 'text-zinc-500')}>
                Collapse to keep working — timer stays in the header.
              </p>
            </div>
          )}

          {isDone && (
            <div className="flex min-h-0 flex-1 flex-col">
              <ManimTimingSummary timing={status.timing} isDarkTheme={isDarkTheme} />
              <div className="flex shrink-0 justify-end border-t border-purple-500/20 px-3 py-2.5" data-no-drag>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCancel}
                  className="bg-purple-600 text-white hover:bg-purple-500"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <div>
                <p className={cn('text-sm font-medium', isDarkTheme ? 'text-red-300' : 'text-red-600')}>
                  Video conversion failed
                </p>
                <p className="mt-2 text-sm text-red-400">{status.error}</p>
                {status.timing && (
                  <p className={cn('mt-2 text-xs tabular-nums', isDarkTheme ? 'text-zinc-500' : 'text-zinc-500')}>
                    Failed after {formatTimingMs(status.timing.totalMs)}
                    {status.timing.renderMs > 0 ? ` · render ${formatTimingMs(status.timing.renderMs)}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2" data-no-drag>
                {(status.recover || lastReview) && (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={handleBackToScript}>
                      Back to script
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRendering}
                      className="bg-purple-600 text-white hover:bg-purple-500"
                    >
                      {isRendering ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Try again'
                      )}
                    </Button>
                  </>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {isReview && (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {durationLabel && (
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs',
                      narrationTooShort
                        ? isDarkTheme
                          ? 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                          : 'border-amber-300 bg-amber-50 text-amber-900'
                        : isDarkTheme
                          ? 'border-purple-500/20 bg-purple-950/20 text-zinc-300'
                          : 'border-purple-200 bg-purple-50 text-zinc-700',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p>
                        Target ~{durationLabel}
                        {' · '}
                        Narration ~{formatDurationLabel(narrationEstimateSeconds)} ({narrationWordCount} words)
                      </p>
                      <select
                        value={targetDurationSeconds}
                        onChange={(e) => setTargetDurationSeconds(Number(e.target.value))}
                        disabled={isRendering}
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-purple-500/40',
                          isDarkTheme
                            ? 'border-purple-500/30 bg-zinc-900 text-zinc-200'
                            : 'border-purple-200 bg-white text-zinc-800',
                        )}
                        data-no-drag
                      >
                        {TARGET_DURATION_OPTIONS.map((opt) => (
                          <option key={opt.seconds} value={opt.seconds}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {narrationTooShort && (
                      <p className="mt-1 text-amber-300">
                        For a {durationLabel} video with 2 full problems, expand narration (aim for ~
                        {minNarrationWordsForDuration(narrationTargetSeconds)} words) before converting.
                      </p>
                    )}
                  </div>
                )}

                {(previewUrl || previewError || previewCode) && (
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2',
                      isDarkTheme ? 'border-purple-500/20 bg-purple-950/20' : 'border-purple-200 bg-purple-50',
                    )}
                  >
                    <p className={cn('text-xs font-medium', isDarkTheme ? 'text-purple-200' : 'text-purple-800')}>
                      Animation preview (first part, low quality, no voiceover)
                    </p>
                    {previewUrl && (
                      <video
                        src={previewUrl}
                        controls
                        className="mt-2 w-full rounded-md border border-purple-500/20"
                        data-no-drag
                      />
                    )}
                    {previewError && (
                      <p className="mt-2 text-xs text-amber-400">{previewError}</p>
                    )}
                    {previewCode && (
                      <div className="mt-2">
                        <label className={labelClass}>Generated Manim code (editable)</label>
                        <Textarea
                          value={previewCode}
                          onChange={(e) => setPreviewCode(e.target.value)}
                          disabled={isRendering}
                          rows={8}
                          className={cn('mt-1 min-h-[120px] resize-y font-mono text-[11px]', inputClass)}
                          data-no-drag
                        />
                      </div>
                    )}
                  </div>
                )}

                {usesChunks && chapterPreview.length > 1 && (
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs',
                      isDarkTheme ? 'border-purple-500/20 bg-purple-950/20 text-zinc-300' : 'border-purple-200 bg-purple-50 text-zinc-700',
                    )}
                  >
                    <p className="font-medium text-purple-300">Renders as {chapterPreview.length} parts (~{durationLabel} total)</p>
                    {isLongVideo && (
                      <p className="mt-1 text-zinc-400">
                        Long video — rendering may take 30–60+ minutes. You can collapse this panel and keep working.
                      </p>
                    )}
                    <ul className="mt-1 space-y-0.5">
                      {chapterPreview.map((chapter, index) => (
                        <li key={`${chapter.title}-${index}`}>
                          {index + 1}. {chapter.title} (~{chapter.durationSeconds}s)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Topic</label>
                  <input
                    type="text"
                    value={editedTopic}
                    onChange={(e) => setEditedTopic(e.target.value)}
                    disabled={isRendering}
                    className={cn(
                      'mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/40',
                      inputClass,
                    )}
                    data-no-drag
                  />
                </div>

                <div>
                  <label className={labelClass}>Your content (facts, examples, steps to include)</label>
                  <Textarea
                    value={userContentText}
                    onChange={(e) => setUserContentText(e.target.value)}
                    disabled={isRendering}
                    rows={4}
                    className={cn('mt-1 min-h-[80px] resize-y', inputClass)}
                    placeholder="Paste a specific problem (with numbers), your solution steps, or facts to cover. Example: Solve ∫₀¹ x² dx step by step with graph, or prove the Pythagorean theorem."
                    data-no-drag
                  />
                </div>

                <div>
                  <label className={labelClass}>Narration (voiceover)</label>
                  <Textarea
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    disabled={isRendering}
                    rows={6}
                    className={cn('mt-1 min-h-[120px] resize-y', inputClass)}
                    placeholder="What the narrator will say in the video..."
                    data-no-drag
                  />
                </div>

                <div>
                  <label className={labelClass}>Lesson outline (one point per line)</label>
                  <Textarea
                    value={outlineText}
                    onChange={(e) => setOutlineText(e.target.value)}
                    disabled={isRendering}
                    rows={4}
                    className={cn('mt-1 min-h-[80px] resize-y', inputClass)}
                    placeholder={'Hook\nCore concept\nWorked example\nRecap'}
                    data-no-drag
                  />
                </div>

                <div>
                  <label className={labelClass}>Key steps on screen (one per line)</label>
                  <Textarea
                    value={keyStepsText}
                    onChange={(e) => setKeyStepsText(e.target.value)}
                    disabled={isRendering}
                    rows={4}
                    className={cn('mt-1 min-h-[80px] resize-y', inputClass)}
                    placeholder={'Step 1: ...\nStep 2: ...'}
                    data-no-drag
                  />
                </div>
              </div>

              <div
                className={cn(
                  'flex shrink-0 flex-wrap justify-end gap-2 border-t px-3 py-2.5',
                  isDarkTheme ? 'border-purple-500/20' : 'border-purple-200',
                )}
                data-no-drag
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isRendering || isPreviewing}
                  className={isDarkTheme ? 'text-zinc-300 hover:text-white' : undefined}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isRendering || isPreviewing || !narration.trim()}
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Previewing...
                    </>
                  ) : (
                    'Preview animation'
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConvert}
                  disabled={isRendering || isPreviewing || !narration.trim()}
                  className="bg-purple-600 text-white hover:bg-purple-500"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Clapperboard className="mr-1.5 h-4 w-4" />
                      Render full video
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
