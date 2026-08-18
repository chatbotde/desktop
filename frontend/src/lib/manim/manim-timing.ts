export interface ManimTimingEntry {
  label: string
  category: 'planning' | 'code' | 'render' | 'stitch' | 'deliver'
  durationMs: number
}

export interface ManimPipelineTiming {
  planningMs: number
  codeMs: number
  renderMs: number
  stitchMs: number
  deliverMs: number
  totalMs: number
  chapterCount: number
  mode: 'single' | 'chunked'
  targetDurationSeconds?: number
  entries: ManimTimingEntry[]
}

export function formatTimingMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

class ManimPipelineTimer {
  private startedAt = 0
  private planningMs = 0
  private codeMs = 0
  private renderMs = 0
  private stitchMs = 0
  private deliverMs = 0
  private entries: ManimTimingEntry[] = []

  start() {
    this.startedAt = performance.now()
    this.planningMs = 0
    this.codeMs = 0
    this.renderMs = 0
    this.stitchMs = 0
    this.deliverMs = 0
    this.entries = []
  }

  getElapsedMs(): number {
    if (!this.startedAt) return 0
    return Math.round(performance.now() - this.startedAt)
  }

  markPlanningEnd() {
    if (!this.startedAt || this.planningMs > 0) return
    this.planningMs = Math.round(performance.now() - this.startedAt)
    this.entries.push({ label: 'Script planning (AI)', category: 'planning', durationMs: this.planningMs })
    console.log(`[Manim Timing] Planning: ${formatTimingMs(this.planningMs)}`)
  }

  add(category: ManimTimingEntry['category'], label: string, durationMs: number) {
    const rounded = Math.round(durationMs)
    this.entries.push({ label, category, durationMs: rounded })
    if (category === 'code') this.codeMs += rounded
    if (category === 'render') this.renderMs += rounded
    if (category === 'stitch') this.stitchMs += rounded
    if (category === 'deliver') this.deliverMs += rounded
    console.log(`[Manim Timing] ${label}: ${formatTimingMs(rounded)}`)
  }

  async time<T>(category: ManimTimingEntry['category'], label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      this.add(category, label, performance.now() - start)
    }
  }

  finish(
    mode: ManimPipelineTiming['mode'],
    chapterCount: number,
    targetDurationSeconds?: number,
  ): ManimPipelineTiming {
    const totalMs = this.getElapsedMs()
    const timing: ManimPipelineTiming = {
      planningMs: this.planningMs,
      codeMs: this.codeMs,
      renderMs: this.renderMs,
      stitchMs: this.stitchMs,
      deliverMs: this.deliverMs,
      totalMs,
      chapterCount,
      mode,
      targetDurationSeconds,
      entries: [...this.entries],
    }
    console.log('[Manim Timing] Summary:', {
      total: formatTimingMs(totalMs),
      planning: formatTimingMs(this.planningMs),
      code: formatTimingMs(this.codeMs),
      render: formatTimingMs(this.renderMs),
      stitch: formatTimingMs(this.stitchMs),
      deliver: formatTimingMs(this.deliverMs),
      mode,
      chapters: chapterCount,
    })
    return timing
  }
}

export const manimPipelineTimer = new ManimPipelineTimer()
