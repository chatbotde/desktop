import { addFilesToPrompt } from '@/components/prompt-input/prompt-files-bridge'
import { openRecordedVideoPlayer } from '@/lib/events/recorded-video-player'
import {
  generateAllChapterCodes,
  generateChapterCodeAtIndex,
  generateManimCodeFromPlan,
  generatePreviewCodeFromPlan,
  normalizeManimTopic,
  shouldRenderInChunks,
  type ManimChapterAssets,
  type ManimScriptPlan,
  type ManimVideoAssets,
} from '@/features/chat/lib/manim-video-request'
import { formatTimingMs, manimPipelineTimer, type ManimPipelineTiming } from '@/lib/manim/manim-timing'

export type { ManimScriptPlan }
export type { ManimPipelineTiming }

export const MANIM_GENERATION_EVENT = 'manim-generation-status'

export type ManimRenderProgress = {
  step: 'code' | 'render' | 'stitch' | 'preview'
  current: number
  total: number
  label: string
  elapsedMs?: number
}

export type ManimGenerationStatus =
  | { phase: 'idle' }
  | { phase: 'planning'; topic: string; startedAt?: number }
  | { phase: 'review'; topic: string; userPrompt: string; plan: ManimScriptPlan }
  | { phase: 'generating'; topic: string; progress?: ManimRenderProgress; startedAt?: number }
  | { phase: 'done'; topic: string; timing: ManimPipelineTiming }
  | {
      phase: 'error'
      error: string
      timing?: ManimPipelineTiming
      recover?: { topic: string; userPrompt: string; plan: ManimScriptPlan }
    }

export function emitManimGenerationStatus(status: ManimGenerationStatus) {
  window.dispatchEvent(
    new CustomEvent<ManimGenerationStatus>(MANIM_GENERATION_EVENT, { detail: status }),
  )
}

function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'manim-video'
}

export async function fetchManimVideoAsFile(videoUrl: string, topic: string): Promise<File> {
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(`Could not load rendered video (${response.status})`)
  }

  const blob = await response.blob()
  if (blob.size === 0) {
    throw new Error('Rendered video file is empty')
  }

  const typedBlob = blob.type ? blob : new Blob([blob], { type: 'video/mp4' })
  return new File([typedBlob], `${slugifyTopic(topic)}.mp4`, { type: 'video/mp4' })
}

export async function deliverManimVideoToPrompt(
  videoUrl: string,
  topic: string,
  meta: {
    mode: ManimPipelineTiming['mode']
    chapterCount: number
    targetDurationSeconds?: number
  },
) {
  await manimPipelineTimer.time('deliver', 'Load video into app', async () => {
    try {
      const file = await fetchManimVideoAsFile(videoUrl, topic)
      addFilesToPrompt([file])
      openRecordedVideoPlayer(file, file.name)
    } catch (error) {
      console.error('[Manim] Failed to deliver video to prompt:', error)
      throw error
    }
  })

  const timing = manimPipelineTimer.finish(meta.mode, meta.chapterCount, meta.targetDurationSeconds)
  emitManimGenerationStatus({ phase: 'done', topic, timing })
}

function emitProgress(topic: string, progress: Omit<ManimRenderProgress, 'elapsedMs'>) {
  emitManimGenerationStatus({
    phase: 'generating',
    topic,
    startedAt: manimPipelineTimer.getElapsedMs(),
    progress: { ...progress, elapsedMs: manimPipelineTimer.getElapsedMs() },
  })
}

async function getManimSupport() {
  if (!window.manimVideoAPI) {
    throw new Error('Manim renderer is not available in this Electron window.')
  }
  const support = await window.manimVideoAPI.checkSupport()
  if (!support.manim || !support.ffmpeg || !support.python) {
    throw new Error('Manim needs python, manim, and ffmpeg on PATH before rendering.')
  }
  return support
}

async function renderSingleScene(
  plan: ManimScriptPlan,
  topic: string,
  recover: { topic: string; userPrompt: string; plan: ManimScriptPlan },
  manimCodeOverride?: string,
): Promise<void> {
  let assets: ManimVideoAssets
  if (manimCodeOverride) {
    assets = { topic, narration: plan.narration, manimCode: manimCodeOverride }
  } else {
    assets = await manimPipelineTimer.time('code', 'Generate Manim code (AI)', async () =>
      generateManimCodeFromPlan(plan, topic),
    )
  }

  emitProgress(topic, { step: 'render', current: 1, total: 1, label: 'Rendering video' })

  let result = await manimPipelineTimer.time('render', 'Manim render', async () =>
    window.manimVideoAPI!.render({
      topic: assets.topic,
      narration: assets.narration,
      manimCode: assets.manimCode,
      quality: 'qm',
    }),
  )

  if (!result.success || !result.videoUrl) {
    const firstError = result.error || 'Manim render failed.'
    assets = await manimPipelineTimer.time('code', 'Retry Manim code (AI)', async () =>
      generateManimCodeFromPlan(plan, topic, firstError),
    )
    result = await manimPipelineTimer.time('render', 'Manim render (retry)', async () =>
      window.manimVideoAPI!.render({
        topic: assets.topic,
        narration: assets.narration,
        manimCode: assets.manimCode,
        quality: 'qm',
      }),
    )
  }

  if (!result.success || !result.videoUrl) {
    const timing = manimPipelineTimer.finish('single', 1, plan.targetDurationSeconds)
    emitManimGenerationStatus({
      phase: 'error',
      error: result.error || 'Manim render failed. Try editing the script and converting again.',
      recover,
      timing,
    })
    return
  }

  if (result.warnings?.length) {
    console.warn('Manim video rendered with warnings:', result.warnings)
  }

  try {
    await deliverManimVideoToPrompt(result.videoUrl, assets.topic, {
      mode: 'single',
      chapterCount: 1,
      targetDurationSeconds: plan.targetDurationSeconds,
    })
  } catch (error) {
    const timing = manimPipelineTimer.finish('single', 1, plan.targetDurationSeconds)
    emitManimGenerationStatus({
      phase: 'error',
      error: error instanceof Error ? error.message : 'Video rendered but failed to load into app.',
      recover,
      timing,
    })
  }
}

async function renderChunkedScenes(
  plan: ManimScriptPlan,
  topic: string,
  recover: { topic: string; userPrompt: string; plan: ManimScriptPlan },
): Promise<void> {
  const chapters = shouldRenderInChunks(plan) ? plan.chapters?.length || 0 : 1
  const chapterAssets = await manimPipelineTimer.time(
    'code',
    `Generate code for ${chapters || 'all'} parts (AI)`,
    async () =>
      generateAllChapterCodes(plan, topic, (current, total, label) => {
        emitProgress(topic, { step: 'code', current, total, label })
      }),
  )

  const jobId = `${Date.now()}-${slugifyTopic(topic)}`
  const segmentPaths: string[] = []
  const warnings: string[] = []

  for (let i = 0; i < chapterAssets.length; i++) {
    const chapter = chapterAssets[i]
    emitProgress(topic, {
      step: 'render',
      current: i + 1,
      total: chapterAssets.length,
      label: chapter.title,
    })

    let result = await manimPipelineTimer.time(
      'render',
      `Render part ${i + 1}/${chapterAssets.length}: ${chapter.title}`,
      async () =>
        window.manimVideoAPI!.render({
          topic: `${topic} — ${chapter.title}`,
          narration: chapter.narration,
          manimCode: chapter.manimCode,
          quality: 'qm',
          jobId,
          chapterId: `chapter-${i + 1}`,
        }),
    )

    if (!result.success || !result.videoPath) {
      const retryAssets = await manimPipelineTimer.time(
        'code',
        `Retry code part ${i + 1} (AI)`,
        async () => generateChapterCodeAtIndex(plan, topic, i, result.error || 'Render failed'),
      )
      result = await manimPipelineTimer.time(
        'render',
        `Render part ${i + 1} (retry)`,
        async () =>
          window.manimVideoAPI!.render({
            topic: `${topic} — ${retryAssets.title}`,
            narration: retryAssets.narration,
            manimCode: retryAssets.manimCode,
            quality: 'qm',
            jobId,
            chapterId: `chapter-${i + 1}-retry`,
          }),
      )
      chapterAssets[i] = retryAssets
    }

    if (!result.success || !result.videoPath) {
      const timing = manimPipelineTimer.finish('chunked', chapterAssets.length, plan.targetDurationSeconds)
      emitManimGenerationStatus({
        phase: 'error',
        error: result.error || `Failed to render part ${i + 1}: ${chapter.title}`,
        recover,
        timing,
      })
      return
    }

    if (result.warnings?.length) {
      warnings.push(...result.warnings)
    }
    segmentPaths.push(result.videoPath)
  }

  emitProgress(topic, { step: 'stitch', current: 1, total: 1, label: 'Stitching parts together' })

  if (typeof window.manimVideoAPI?.concatSegments !== 'function') {
    const timing = manimPipelineTimer.finish('chunked', chapterAssets.length, plan.targetDurationSeconds)
    emitManimGenerationStatus({
      phase: 'error',
      error: 'Video stitch API is missing. Run `npm run build:interface` in the buddy folder, then restart the app.',
      recover,
      timing,
    })
    return
  }

  const concatResult = await manimPipelineTimer.time('stitch', 'Stitch parts (ffmpeg)', async () =>
    window.manimVideoAPI!.concatSegments({
      topic,
      segmentPaths,
      jobId,
    }),
  )

  if (!concatResult.success || !concatResult.videoUrl) {
    const timing = manimPipelineTimer.finish('chunked', chapterAssets.length, plan.targetDurationSeconds)
    emitManimGenerationStatus({
      phase: 'error',
      error: concatResult.error || 'Failed to stitch video parts together.',
      recover,
      timing,
    })
    return
  }

  if (warnings.length) {
    console.warn('Manim chunked render warnings:', warnings)
  }

  try {
    await deliverManimVideoToPrompt(concatResult.videoUrl, topic, {
      mode: 'chunked',
      chapterCount: chapterAssets.length,
      targetDurationSeconds: plan.targetDurationSeconds,
    })
  } catch (error) {
    const timing = manimPipelineTimer.finish('chunked', chapterAssets.length, plan.targetDurationSeconds)
    emitManimGenerationStatus({
      phase: 'error',
      error: error instanceof Error ? error.message : 'Video stitched but failed to load into app.',
      recover,
      timing,
    })
  }
}

export type ManimPreviewResult = {
  code: string
  narration: string
  title: string
  videoUrl?: string
  error?: string
}

/** Generate code and render a quick low-quality preview of the first part — no narration/TTS. */
export async function previewManimSceneFromPlan(
  plan: ManimScriptPlan,
  userPrompt: string,
): Promise<ManimPreviewResult> {
  const topic = plan.topic || normalizeManimTopic(userPrompt)
  emitManimGenerationStatus({ phase: 'generating', topic, startedAt: manimPipelineTimer.getElapsedMs() })
  emitProgress(topic, { step: 'preview', current: 1, total: 2, label: 'Generating preview code' })

  try {
    await getManimSupport()

    const assets = await manimPipelineTimer.time('code', 'Preview code (AI)', async () =>
      generatePreviewCodeFromPlan(plan, topic),
    ) as ManimChapterAssets | ManimVideoAssets

    const code = assets.manimCode
    const narrationText = 'narration' in assets ? assets.narration : plan.narration
    const title = 'title' in assets ? assets.title : (plan.topic || topic)

    emitProgress(topic, { step: 'preview', current: 2, total: 2, label: 'Rendering preview' })

    const result = await window.manimVideoAPI!.render({
      topic: `${topic} — preview`,
      manimCode: code,
      quality: 'ql',
      skipNarration: true,
      chapterId: 'preview',
    })

    emitManimGenerationStatus({
      phase: 'review',
      topic,
      userPrompt,
      plan,
    })

    if (!result.success || !result.videoUrl) {
      return {
        code,
        narration: narrationText,
        title,
        error: result.error || 'Preview render failed.',
      }
    }

    return { code, narration: narrationText, title, videoUrl: result.videoUrl }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    emitManimGenerationStatus({
      phase: 'review',
      topic,
      userPrompt,
      plan,
    })
    return {
      code: '',
      narration: plan.narration,
      title: plan.topic || topic,
      error: errorMessage,
    }
  }
}

export async function renderManimVideoFromPlan(
  plan: ManimScriptPlan,
  userPrompt: string,
  options?: { manimCodeOverride?: string },
) {
  const topic = plan.topic || normalizeManimTopic(userPrompt)
  const recover = { topic, userPrompt, plan }
  emitManimGenerationStatus({ phase: 'generating', topic, startedAt: manimPipelineTimer.getElapsedMs() })

  try {
    await getManimSupport()

    if (shouldRenderInChunks(plan) && !options?.manimCodeOverride) {
      await renderChunkedScenes(plan, topic, recover)
    } else {
      await renderSingleScene(plan, topic, recover, options?.manimCodeOverride)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Manim] Render pipeline error:', errorMessage)
    const timing = manimPipelineTimer.finish(
      shouldRenderInChunks(plan) ? 'chunked' : 'single',
      plan.chapters?.length || 1,
      plan.targetDurationSeconds,
    )
    emitManimGenerationStatus({ phase: 'error', error: errorMessage, recover, timing })
  }
}

export { formatTimingMs }
