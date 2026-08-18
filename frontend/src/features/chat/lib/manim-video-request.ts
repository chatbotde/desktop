import { sendMessageComplete } from '@/lib/ai'
import { getSelectedModel } from '@/lib/ai/model-config'

export interface ManimTimelineSection {
  title: string
  purpose: string
  durationSeconds: number
  visuals: string
  narrationCue: string
}

export interface ManimChapter {
  title: string
  narration: string
  durationSeconds: number
  visuals: string
  keySteps?: string[]
}

export interface ManimScriptPlan {
  topic: string
  audienceLevel?: string
  learningObjective?: string
  targetDurationSeconds?: number
  userContent?: string
  narration: string
  outline: string[]
  keySteps?: string[]
  timeline?: ManimTimelineSection[]
  chapters?: ManimChapter[]
}

export interface ManimVideoAssets {
  topic: string
  narration: string
  manimCode: string
}

export interface ManimChapterAssets {
  title: string
  narration: string
  manimCode: string
}

export const MIN_VIDEO_DURATION_SECONDS = 45
/** Hard cap — longer videos are more likely to fail during Manim render/stitch. */
export const MAX_VIDEO_DURATION_SECONDS = 180
/** Default when user does not specify length (at most 3 minutes). */
export const DEFAULT_VIDEO_DURATION_SECONDS = 180
/** ~75–90s per render part keeps each Manim scene reliable; long videos stitch many parts */
export const CHAPTER_TARGET_SECONDS = 75
export const SINGLE_SCENE_MAX_SECONDS = 90
export const LONG_VIDEO_THRESHOLD_SECONDS = 180
export const NARRATION_WORDS_PER_MINUTE = 130

export const TARGET_DURATION_OPTIONS = [
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
  { seconds: 180, label: '3 min' },
] as const

const NARRATION_LENGTH_TOLERANCE = 0.92

export function getChapterTargetSeconds(targetSeconds: number): number {
  if (targetSeconds >= 720) return 90
  if (targetSeconds >= 480) return 85
  return CHAPTER_TARGET_SECONDS
}

function maxNarrationExpansionPasses(targetSeconds: number): number {
  return Math.min(10, Math.max(3, Math.ceil(targetSeconds / 150)))
}

const MANIM_SCRIPT_MAX_TOKENS = 16384
const MANIM_CODE_MAX_TOKENS = 8192

function validateManimAiModel(): void {
  const model = getSelectedModel()
  if (!model) {
    throw new Error('Select a text model before generating Manim videos.')
  }
  if (model.category === 'image-generation' || model.category === 'video-generation') {
    throw new Error('Select a text or coding model — image/video models cannot write Manim scripts.')
  }
}

function friendlyManimAiError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error)
  if (msg.includes('No output generated') || msg.includes('NoOutputGenerated')) {
    return new Error(
      'AI model returned no response. Check your API key, switch to a text model (GPT-4o, Claude, Gemini, DeepSeek), or try a shorter video length first.',
    )
  }
  if (msg.includes('SorryComing Soon')) {
    return new Error('AI provider API key is not configured. Add your API key in settings or pick another model.')
  }
  return error instanceof Error ? error : new Error(msg)
}

async function manimAiComplete(
  prompt: string,
  systemPrompt: string,
  maxOutputTokens: number,
): Promise<string> {
  validateManimAiModel()
  try {
    const text = await sendMessageComplete(prompt, undefined, {
      bypassHistory: true,
      systemPromptOverride: systemPrompt,
      maxOutputTokens,
    })
    if (!text?.trim()) {
      throw new Error('AI returned an empty response. Try a different model or shorter video length.')
    }
    return text
  } catch (error) {
    throw friendlyManimAiError(error)
  }
}

export function countNarrationWords(narration: string): number {
  return narration.trim().split(/\s+/).filter(Boolean).length
}

export function estimateNarrationDurationSeconds(narration: string): number {
  const words = countNarrationWords(narration)
  if (words === 0) return 0
  return Math.round((words / NARRATION_WORDS_PER_MINUTE) * 60)
}

export function minNarrationWordsForDuration(seconds: number): number {
  return Math.round((seconds / 60) * NARRATION_WORDS_PER_MINUTE)
}

export function isManimVideoPrompt(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  return normalized.startsWith('/manim') || /\bmanim\b/.test(normalized)
}

export function normalizeManimTopic(message: string): string {
  let text = message.replace(/^\/manim\b/i, '').trim() || message.trim()
  text = text.replace(/\b\d+\s*(?:min(?:ute)?s?|m)\b/gi, '').trim()
  text = text.replace(/\b\d+\s*(?:sec(?:ond)?s?|s)\b/gi, '').trim()
  return text || message.trim()
}

export function parseTargetDurationFromPrompt(message: string): number | undefined {
  const normalized = message.toLowerCase()

  // Range: "2-3 min", "2 to 3 minutes" — use the upper bound (user wants up to that length)
  const rangeMatch = message.match(/\b(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:min(?:ute)?s?|m)\b/i)
  if (rangeMatch) {
    const high = parseInt(rangeMatch[2], 10) * 60
    return clampDuration(high)
  }

  const minuteMatch = message.match(/\b(\d+)\s*(?:min(?:ute)?s?|m)\b/i)
  if (minuteMatch) {
    return clampDuration(parseInt(minuteMatch[1], 10) * 60)
  }

  const secondMatch = message.match(/\b(\d+)\s*(?:sec(?:ond)?s?|s)\b/i)
  if (secondMatch) {
    return clampDuration(parseInt(secondMatch[1], 10))
  }

  // Implicit length intent without an exact number (always clamped to max 3 min)
  if (/\b(?:couple|few)\s+of\s+minutes?\b/.test(normalized)) {
    return clampDuration(180)
  }
  if (/\b(?:longer|long|detailed|in[- ]?depth|comprehensive|deep dive)\b/.test(normalized)) {
    return clampDuration(180)
  }
  if (/\b(?:full\s+lesson|complete\s+lesson|entire\s+topic|full\s+video|full\s+course)\b/.test(normalized)) {
    return clampDuration(180)
  }
  if (/\b(?:long|detailed|in[- ]?depth|comprehensive)\s+(?:video|lesson|explainer)\b/.test(normalized)) {
    return DEFAULT_VIDEO_DURATION_SECONDS
  }

  return undefined
}

function buildMathLessonStructurePrompt(targetSeconds: number): string {
  if (targetSeconds > LONG_VIDEO_THRESHOLD_SECONDS) {
    const hook = Math.round(targetSeconds * 0.05)
    const conceptIntro = Math.round(targetSeconds * 0.14)
    const conceptDeep = Math.round(targetSeconds * 0.14)
    const problem1 = Math.round(targetSeconds * 0.18)
    const problem2 = Math.round(targetSeconds * 0.16)
    const problem3 = Math.round(targetSeconds * 0.14)
    const problem4 = Math.round(targetSeconds * 0.10)
    const applications = Math.round(targetSeconds * 0.05)
    const mistakes = Math.round(targetSeconds * 0.04)
    const recap = Math.max(30, targetSeconds - hook - conceptIntro - conceptDeep - problem1 - problem2 - problem3 - problem4 - applications - mistakes)

    return [
      `Structure a FULL ${formatDurationLabel(targetSeconds)} deep-dive math lesson. Timeline durations must sum to ${targetSeconds}s.`,
      `1. Hook (${hook}s): why this topic matters, real-world use.`,
      `2. Concept introduction (${conceptIntro}s): definitions, notation, intuition.`,
      `3. Concept deep dive (${conceptDeep}s): key formulas/theorems, when to use, worked mini-examples.`,
      `4. Worked Problem 1 (${problem1}s): full multi-step solution with every step on screen.`,
      `5. Worked Problem 2 (${problem2}s): harder variant or different technique.`,
      `6. Worked Problem 3 (${problem3}s): geometry/calculus/application problem with complete solution.`,
      `7. Worked Problem 4 or exam-style (${problem4}s): challenging problem solved to the end.`,
      `8. Applications (${applications}s): where students will use this.`,
      `9. Common mistakes (${mistakes}s): pitfalls and how to avoid them.`,
      `10. Recap (${recap}s): summary checklist and key takeaways.`,
      'Each timeline section needs long narrationCue text — not one sentence.',
      'keySteps must cover every on-screen step for all worked problems through final answers.',
      'This is a long video — cover the topic thoroughly from basics to advanced examples.',
    ].join('\n')
  }

  if (targetSeconds > 300) {
    const hook = Math.round(targetSeconds * 0.06)
    const concept = Math.round(targetSeconds * 0.20)
    const problem1 = Math.round(targetSeconds * 0.28)
    const problem2 = Math.round(targetSeconds * 0.22)
    const problem3 = Math.round(targetSeconds * 0.14)
    const tips = Math.round(targetSeconds * 0.05)
    const recap = Math.max(25, targetSeconds - hook - concept - problem1 - problem2 - problem3 - tips)

    return [
      `Structure a ${formatDurationLabel(targetSeconds)} math lesson. Timeline durations must sum to the target.`,
      `1. Hook (${hook}s): motivating example.`,
      `2. Core concept (${concept}s): definition, formulas, when to use — thorough and slow.`,
      `3. Worked Problem 1 (${problem1}s): full multi-step solution with every step.`,
      `4. Worked Problem 2 (${problem2}s): harder variant with complete solution.`,
      `5. Worked Problem 3 (${problem3}s): application or exam-style problem solved fully.`,
      `6. Tips (${tips}s): common mistakes.`,
      `7. Recap (${recap}s): checklist.`,
      'Each timeline section needs narrationCue text long enough for its duration.',
      'keySteps must list every on-screen step for all worked problems.',
    ].join('\n')
  }

  const hook = Math.round(targetSeconds * 0.08)
  const concept = Math.round(targetSeconds * 0.22)
  const problem1 = Math.round(targetSeconds * 0.35)
  const problem2 = Math.round(targetSeconds * 0.22)
  const tips = Math.round(targetSeconds * 0.08)
  const recap = Math.max(20, targetSeconds - hook - concept - problem1 - problem2 - tips)

  return [
    'Structure the lesson for clear math teaching (algebra, geometry, calculus, integrals). Timeline section durations must sum to the target.',
    `1. Hook (${hook}s): why this topic matters, one motivating example.`,
    `2. Core concept (${concept}s): definition, key formula or theorem, when to use it — slow and clear.`,
    `3. Worked Problem 1 (${problem1}s): a REAL multi-step problem with numbers. State givens, explain strategy, show every algebra/geometry step on screen, verify the answer.`,
    `4. Worked Problem 2 or variant (${problem2}s): harder twist, geometry proof, integral application, or exam-style question with full solution to the end.`,
    `5. Common mistakes + tips (${tips}s): what students get wrong and how to avoid it.`,
    `6. Recap (${recap}s): key formula + when to use + one-line checklist.`,
    'Each timeline section needs narrationCue text long enough for its duration (not one short sentence).',
    'keySteps must list every on-screen step for both worked problems through the final answer.',
    'For integrals: show the graph, shaded area, substitution steps, and evaluated result.',
    'For geometry: show constructions, labeled angles/sides, and proof steps in order.',
  ].join('\n')
}

export function clampDuration(seconds: number): number {
  return Math.max(MIN_VIDEO_DURATION_SECONDS, Math.min(MAX_VIDEO_DURATION_SECONDS, seconds))
}

function parseJsonObject<T>(text: string): T {
  const withoutFence = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  const start = withoutFence.indexOf('{')
  const end = withoutFence.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object.')
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as T
}

const LATEX_MOBJECT_PATTERN = /\b(MathTex|Tex|Title|BulletedList|TexTemplate)\s*\(/

export function usesLatex(code: string): boolean {
  return LATEX_MOBJECT_PATTERN.test(code || '')
}

const UNSAFE_MANIM_API_PATTERN =
  /\b(TransformMatchingStrings|TransformMatchingTex|MarkupText|Code|SVGMobject|ImageMobject|ThreeDScene)\s*\(/

export function usesUnsafeManimAPI(code: string): boolean {
  return UNSAFE_MANIM_API_PATTERN.test(code || '')
}

const CODING_SYSTEM_PROMPT =
  'You are the coding model for math teaching videos. Return only valid JSON. Use Text() with unicode math symbols (x², ∫, √, π, ±, ≤). NEVER use MathTex, Tex, or TransformMatchingTex. Use Axes/NumberPlane for graphs and animate every step until the final answer.'

function chapterCodeRules(durationSeconds: number): string {
  const maxPlays = durationSeconds > 120 ? 28 : 22
  return [
    'Hard requirements for reliable Manim Community code (single chapter only):',
    '- Define exactly one class GeneratedScene(Scene) with construct().',
    '- Start with: from manim import *',
    '- Use Text() with unicode math symbols for all equations (e.g. "x² − 5x + 6 = 0", "∫ f(x) dx").',
    '- Do NOT use MathTex, Tex, TransformMatchingTex, or any LaTeX.',
    '- Use Axes, NumberPlane, FunctionGraph, ParametricFunction, Area for graphs and integrals.',
    '- Use Polygon, Line, Dot, Angle, RightAngle, Arc for geometry proofs and constructions.',
    '- Use Brace, SurroundingRectangle, VGroup to organize step-by-step solutions.',
    '- Animations: Write, FadeIn, FadeOut, Create, Transform, ReplacementTransform, GrowFromCenter, Indicate, Circumscribe.',
    '- Show every algebra step on screen until the problem is fully solved — do not skip steps.',
    `- This chapter must fill about ${durationSeconds} seconds of screen time.`,
    `- Use run_time on self.play() and self.wait() so total animation time is at least ${Math.max(30, durationSeconds - 5)} seconds.`,
    `- At most ${maxPlays} self.play() calls; prefer longer run_time over many fast cuts.`,
    '- Do not use files, network, subprocess, eval, exec, or open().',
  ].join('\n')
}

function buildCodeFixRule(reason: string): string {
  return [
    `CRITICAL FIX REQUIRED: ${reason}`,
    'Rewrite with Text() and unicode math only. No MathTex, Tex, or LaTeX.',
    'Use Write, FadeIn, FadeOut, Transform, ReplacementTransform, Axes, and NumberPlane.',
  ].join(' ')
}

export function ensureChapters(plan: ManimScriptPlan): ManimChapter[] {
  const target = plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS
  const chapterTarget = getChapterTargetSeconds(target)
  const existing = plan.chapters?.filter((c) => c.narration?.trim()) || []

  if (existing.length > 0) {
    const chapterDurationSum = existing.reduce((sum, c) => sum + (c.durationSeconds || 0), 0)
    const narrationEstimate = estimateNarrationDurationSeconds(plan.narration)
    const longEnough =
      chapterDurationSum >= target * 0.75 &&
      narrationEstimate >= target * 0.7 &&
      (existing.length > 1 || target <= SINGLE_SCENE_MAX_SECONDS)

    if (longEnough) {
      return existing
    }
  }

  const sections = plan.timeline || []

  if (target <= SINGLE_SCENE_MAX_SECONDS && sections.length <= 1) {
    return [{
      title: plan.topic,
      narration: plan.narration,
      durationSeconds: target,
      visuals: sections.map((s) => s.visuals).join('; ') || 'Text and shapes',
      keySteps: plan.keySteps,
    }]
  }

  if (sections.length > 1) {
    const chapters: ManimChapter[] = []
    let bucket: ManimTimelineSection[] = []
    let bucketDuration = 0

    const flush = () => {
      if (bucket.length === 0) return
      chapters.push({
        title: bucket[0].title,
        narration: bucket.map((s) => s.narrationCue).join(' '),
        durationSeconds: bucketDuration,
        visuals: bucket.map((s) => s.visuals).join('; '),
        keySteps: bucket.map((s) => s.title),
      })
      bucket = []
      bucketDuration = 0
    }

    for (const section of sections) {
      const sectionDuration = section.durationSeconds || chapterTarget
      if (bucket.length > 0 && bucketDuration + sectionDuration > chapterTarget + 15) {
        flush()
      }
      bucket.push(section)
      bucketDuration += sectionDuration
    }
    flush()

    if (chapters.length > 0) {
      return rebalanceChapterDurations(chapters, target)
    }
  }

  return splitNarrationIntoChapters(plan)
}

function rebalanceChapterDurations(chapters: ManimChapter[], targetSeconds: number): ManimChapter[] {
  if (chapters.length === 0) return chapters
  const perChapter = Math.round(targetSeconds / chapters.length)
  return chapters.map((chapter) => ({
    ...chapter,
    durationSeconds: chapter.durationSeconds || perChapter,
  }))
}

function splitNarrationIntoChapters(plan: ManimScriptPlan): ManimChapter[] {
  const target = plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS
  const chapterTarget = getChapterTargetSeconds(target)
  const chapterCount = Math.max(2, Math.ceil(target / chapterTarget))
  const narration = plan.narration.trim()
  const sentences =
    narration.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)?.map((s) => s.trim()).filter(Boolean) || [narration]

  const chapters: ManimChapter[] = []
  const sentencesPerChapter = Math.max(1, Math.ceil(sentences.length / chapterCount))
  const durationPerChapter = Math.round(target / chapterCount)

  for (let i = 0; i < chapterCount; i++) {
    const chunk = sentences.slice(i * sentencesPerChapter, (i + 1) * sentencesPerChapter).join(' ').trim()
    if (!chunk) continue

    chapters.push({
      title: i === 0 ? plan.topic : `${plan.topic} — Part ${i + 1}`,
      narration: chunk,
      durationSeconds: durationPerChapter,
      visuals: plan.outline?.[i] || plan.outline?.[plan.outline.length - 1] || 'Text and shapes',
      keySteps: plan.keySteps?.slice(i * 2, (i + 1) * 2),
    })
  }

  if (chapters.length === 0) {
    return [{
      title: plan.topic,
      narration: plan.narration,
      durationSeconds: target,
      visuals: 'Text and shapes',
      keySteps: plan.keySteps,
    }]
  }

  return chapters
}

async function expandNarrationIfTooShort(
  plan: ManimScriptPlan,
  topic: string,
  targetSeconds: number,
): Promise<void> {
  const minWords = minNarrationWordsForDuration(targetSeconds)
  const wordGoal = Math.round(minWords * NARRATION_LENGTH_TOLERANCE)
  const expansionPasses = maxNarrationExpansionPasses(targetSeconds)

  for (let pass = 0; pass < expansionPasses; pass++) {
    const currentWords = countNarrationWords(plan.narration)
    if (currentWords >= wordGoal) return

    const passHint =
      targetSeconds > LONG_VIDEO_THRESHOLD_SECONDS
        ? pass === 0
          ? 'Add concept deep-dive and Worked Problem 1 with full step-by-step narration.'
          : pass === 1
            ? 'Add Worked Problems 2 and 3 with complete spoken solutions.'
            : pass === 2
              ? 'Add Worked Problem 4, applications section, and common mistakes.'
              : 'Expand every timeline section — more spoken algebra steps, longer recap.'
        : pass === 0
          ? 'Add a full multi-step problem with givens, method, calculation, and verified answer.'
          : pass === 1
            ? 'Add a second worked problem (harder variant) and slow down the concept section.'
            : 'Expand every timeline section — more spoken steps, more algebra narration, longer recap.'

    const expandedText = await manimAiComplete(
      [
        `Expand this teaching script for a ${formatDurationLabel(targetSeconds)} Manim math video: ${plan.topic || topic}`,
        `Pass ${pass + 1}/${expansionPasses}. ${passHint}`,
        `Current narration: ${currentWords} words (~${formatDurationLabel(estimateNarrationDurationSeconds(plan.narration))} spoken).`,
        `Required: at least ${wordGoal} words (~${formatDurationLabel(targetSeconds)} at ${NARRATION_WORDS_PER_MINUTE} wpm).`,
        '',
        'Current narration:',
        plan.narration,
        '',
        plan.outline?.length ? `Outline: ${plan.outline.join(' | ')}` : '',
        plan.userContent ? `User content to keep: ${plan.userContent}` : '',
        buildMathLessonStructurePrompt(targetSeconds),
        'Return JSON only: {"narration":"...","outline":["..."],"keySteps":["..."],"timeline":[{"title":"...","purpose":"...","durationSeconds":60,"visuals":"...","narrationCue":"..."}]}',
      ].filter(Boolean).join('\n'),
      'You are the script model for math Manim lessons. Return only valid JSON. Write spoken teaching — full problems with numbers through the complete solution.',
      MANIM_SCRIPT_MAX_TOKENS,
    )

    const expanded = parseJsonObject<
      Pick<ManimScriptPlan, 'narration' | 'outline' | 'keySteps' | 'timeline'>
    >(expandedText)

    if (expanded.narration?.trim()) {
      plan.narration = expanded.narration.trim()
    }
    if (expanded.outline?.length) {
      plan.outline = expanded.outline
    }
    if (expanded.keySteps?.length) {
      plan.keySteps = expanded.keySteps
    }
    if (expanded.timeline?.length) {
      plan.timeline = expanded.timeline
    }
    plan.chapters = undefined
  }
}

export function shouldRenderInChunks(plan: ManimScriptPlan): boolean {
  const target = plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS
  const chapters = ensureChapters(plan)
  return target > SINGLE_SCENE_MAX_SECONDS || chapters.length > 1
}

async function generateChapterCode(
  chapter: ManimChapter,
  plan: ManimScriptPlan,
  topic: string,
  chapterIndex: number,
  totalChapters: number,
  extraRule = '',
): Promise<ManimChapterAssets> {
  const codeText = await manimAiComplete(
    [
      `Write Manim Python code for chapter ${chapterIndex + 1} of ${totalChapters}.`,
      `Video topic: ${plan.topic || topic}`,
      `Chapter title: ${chapter.title}`,
      `Chapter duration: ${chapter.durationSeconds} seconds`,
      `Chapter narration: ${chapter.narration}`,
      `Visual direction: ${chapter.visuals}`,
      `Key steps: ${(chapter.keySteps || []).join(' | ')}`,
      plan.userContent ? `User-provided content to respect: ${plan.userContent}` : '',
      plan.learningObjective ? `Learning objective: ${plan.learningObjective}` : '',
      '',
      'Return JSON only: {"title":"...","narration":"...","manimCode":"..."}',
      chapterCodeRules(chapter.durationSeconds),
      extraRule,
    ].filter(Boolean).join('\n'),
    CODING_SYSTEM_PROMPT,
    MANIM_CODE_MAX_TOKENS,
  )

  const assets = parseJsonObject<ManimChapterAssets>(codeText)
  if (!assets.manimCode?.includes('class GeneratedScene')) {
    throw new Error(`Chapter ${chapterIndex + 1} code is missing class GeneratedScene(Scene).`)
  }
  return {
    title: assets.title || chapter.title,
    narration: assets.narration || chapter.narration,
    manimCode: assets.manimCode,
  }
}

async function sanitizeChapterAssets(
  chapter: ManimChapter,
  plan: ManimScriptPlan,
  topic: string,
  chapterIndex: number,
  totalChapters: number,
  renderError = '',
): Promise<ManimChapterAssets> {
  const extra = renderError ? buildCodeFixRule(renderError) : ''
  let assets = await generateChapterCode(chapter, plan, topic, chapterIndex, totalChapters, extra)

  if (usesUnsafeManimAPI(assets.manimCode) || usesLatex(assets.manimCode)) {
    assets = await generateChapterCode(
      chapter,
      plan,
      topic,
      chapterIndex,
      totalChapters,
      buildCodeFixRule(
        usesLatex(assets.manimCode)
          ? 'Code used MathTex/LaTeX — use Text() with unicode math only.'
          : 'Code used unsupported Manim APIs.',
      ),
    )
  }

  return assets
}

async function generateSingleSceneCode(
  plan: ManimScriptPlan,
  topic: string,
  extraRule = '',
): Promise<ManimVideoAssets> {
  const target = plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS
  const timeline = (plan.timeline || [])
    .map((section, index) => [
      `${index + 1}. ${section.title} (${section.durationSeconds}s)`,
      `Purpose: ${section.purpose}`,
      `Visuals: ${section.visuals}`,
      `Narration cue: ${section.narrationCue}`,
    ].join(' | '))
    .join('\n')

  const codeText = await manimAiComplete(
    [
      'Write production-ready Python Manim Community code for this script plan.',
      `Topic: ${plan.topic || topic}`,
      `Target duration: ${target} seconds`,
      `Narration: ${plan.narration}`,
      plan.userContent ? `User-provided content: ${plan.userContent}` : '',
      `Outline: ${(plan.outline || []).join(' | ')}`,
      `Key steps: ${(plan.keySteps || []).join(' | ')}`,
      timeline ? `Timeline:\n${timeline}` : '',
      '',
      'Return JSON only: {"topic":"...","narration":"...","manimCode":"..."}',
      chapterCodeRules(target),
      extraRule,
    ].filter(Boolean).join('\n'),
    CODING_SYSTEM_PROMPT,
    MANIM_CODE_MAX_TOKENS,
  )

  const assets = parseJsonObject<ManimVideoAssets>(codeText)
  if (!assets.manimCode?.includes('class GeneratedScene')) {
    throw new Error('Generated code is missing class GeneratedScene(Scene).')
  }
  return assets
}

export async function generateManimScriptPlan(userPrompt: string): Promise<{ plan: ManimScriptPlan; topic: string }> {
  validateManimAiModel()
  const topic = normalizeManimTopic(userPrompt)
  const requestedDuration = parseTargetDurationFromPrompt(userPrompt)
  const targetHint = requestedDuration ?? DEFAULT_VIDEO_DURATION_SECONDS
  const useChapters = targetHint > SINGLE_SCENE_MAX_SECONDS
  const chapterTarget = getChapterTargetSeconds(targetHint)
  const minWords = minNarrationWordsForDuration(targetHint)
  const splitScriptGeneration = minWords > 520

  const userContentBlock = userPrompt.length > topic.length + 10
    ? `The user also provided this content to include:\n${userPrompt.replace(/^\/manim\b/i, '').trim()}`
    : ''

  const structureSystemPrompt = [
    'You are the script model for structured math teaching animations (algebra, geometry, calculus, integrals).',
    splitScriptGeneration
      ? 'Return JSON only with this shape (NO narration field yet — structure only):'
      : 'Return JSON only with this shape:',
    splitScriptGeneration
      ? '{"topic":"...","audienceLevel":"high school / college","learningObjective":"...","targetDurationSeconds":180,"userContent":"...","outline":["..."],"keySteps":["..."],"timeline":[{"title":"...","purpose":"...","durationSeconds":45,"visuals":"...","narrationCue":"..."}],"chapters":[{"title":"...","durationSeconds":75,"visuals":"...","keySteps":["..."]}]}'
      : '{"topic":"...","audienceLevel":"high school / college","learningObjective":"...","targetDurationSeconds":180,"userContent":"...","narration":"...","outline":["..."],"keySteps":["..."],"timeline":[{"title":"...","purpose":"...","durationSeconds":45,"visuals":"...","narrationCue":"..."}],"chapters":[{"title":"...","narration":"...","durationSeconds":75,"visuals":"...","keySteps":["..."]}]}',
    `Target duration: ${targetHint} seconds (${formatDurationLabel(targetHint)}). Must be between ${MIN_VIDEO_DURATION_SECONDS} and ${MAX_VIDEO_DURATION_SECONDS}.`,
    splitScriptGeneration
      ? 'Do NOT include narration yet — only outline, timeline, and keySteps.'
      : `The "narration" field MUST be at least ${minWords} words. Short scripts are rejected.`,
    buildMathLessonStructurePrompt(targetHint),
    useChapters
      ? `Split into ${Math.ceil(targetHint / chapterTarget)} to ${Math.ceil(targetHint / chapterTarget) + 3} chapters (~${chapterTarget}s each, stitched into one video).`
      : 'For short videos only, chapters may be omitted.',
    targetHint > LONG_VIDEO_THRESHOLD_SECONDS
      ? 'This is a long-form lesson — cover the topic thoroughly with multiple worked problems from basic to advanced.'
      : 'Worked problems MUST include concrete numbers, givens, and step-by-step algebra/geometry.',
    'Every problem must be solved completely on screen through the final answer.',
    splitScriptGeneration
      ? 'Timeline narrationCue fields should preview what will be spoken in each section.'
      : `The full "narration" field is the complete voiceover read aloud from start to finish (${NARRATION_WORDS_PER_MINUTE} wpm).`,
    'Visuals should use Text labels, coordinate graphs, geometric diagrams, and step labels.',
  ].join('\n')

  const structureText = await manimAiComplete(
    [
      `Create a structured teaching plan for a Manim math explainer about: ${topic}`,
      requestedDuration
        ? `The user wants a ${formatDurationLabel(requestedDuration)} video.`
        : `Aim for a ${formatDurationLabel(targetHint)} video unless the topic is very narrow.`,
      userContentBlock,
    ].filter(Boolean).join('\n\n'),
    structureSystemPrompt,
    MANIM_SCRIPT_MAX_TOKENS,
  )

  const plan = parseJsonObject<ManimScriptPlan>(structureText)

  if (splitScriptGeneration || !plan.narration?.trim()) {
    const narrationText = await manimAiComplete(
      [
        `Write the complete voiceover narration for a ${formatDurationLabel(targetHint)} Manim math video about: ${plan.topic || topic}`,
        `Required: at least ${minWords} words (${NARRATION_WORDS_PER_MINUTE} wpm).`,
        `Learning objective: ${plan.learningObjective || 'Teach the topic step by step'}`,
        plan.outline?.length ? `Outline: ${plan.outline.join(' | ')}` : '',
        plan.timeline?.length
          ? `Timeline:\n${plan.timeline.map((s) => `${s.title} (${s.durationSeconds}s): ${s.narrationCue}`).join('\n')}`
          : '',
        plan.keySteps?.length ? `Key steps: ${plan.keySteps.join(' | ')}` : '',
        userContentBlock,
        buildMathLessonStructurePrompt(targetHint),
        'Return JSON only: {"narration":"..."}',
      ].filter(Boolean).join('\n\n'),
      'You are the script model. Return only valid JSON with a single "narration" field — the full spoken script from start to finish with every problem solved completely.',
      MANIM_SCRIPT_MAX_TOKENS,
    )
    const narrationResult = parseJsonObject<Pick<ManimScriptPlan, 'narration'>>(narrationText)
    if (narrationResult.narration?.trim()) {
      plan.narration = narrationResult.narration.trim()
    }
  }

  if (!plan.narration?.trim()) {
    throw new Error('Script model did not return narration text. Try a different AI model or shorter video length.')
  }

  if (requestedDuration) {
    plan.targetDurationSeconds = requestedDuration
  } else if (plan.targetDurationSeconds) {
    const aiTarget = clampDuration(plan.targetDurationSeconds)
    plan.targetDurationSeconds = aiTarget < 150 ? DEFAULT_VIDEO_DURATION_SECONDS : aiTarget
  } else {
    plan.targetDurationSeconds = DEFAULT_VIDEO_DURATION_SECONDS
  }

  await expandNarrationIfTooShort(plan, topic, plan.targetDurationSeconds)
  plan.chapters = ensureChapters(plan)

  return { plan, topic }
}

/** Apply a new target length before render (e.g. from review UI). Re-splits chapters. */
export function applyTargetDurationToPlan(plan: ManimScriptPlan, targetSeconds: number): ManimScriptPlan {
  const next = {
    ...plan,
    targetDurationSeconds: clampDuration(targetSeconds),
  }
  next.chapters = ensureChapters(next)
  return next
}

export async function generateAllChapterCodes(
  plan: ManimScriptPlan,
  topic: string,
  onProgress?: (current: number, total: number, label: string) => void,
): Promise<ManimChapterAssets[]> {
  const chapters = ensureChapters(plan)
  const results: ManimChapterAssets[] = []

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    onProgress?.(i + 1, chapters.length, chapter.title)
    results.push(await sanitizeChapterAssets(chapter, plan, topic, i, chapters.length))
  }

  return results
}

export async function generateChapterCodeAtIndex(
  plan: ManimScriptPlan,
  topic: string,
  chapterIndex: number,
  renderError = '',
): Promise<ManimChapterAssets> {
  const chapters = ensureChapters(plan)
  const chapter = chapters[chapterIndex]
  if (!chapter) {
    throw new Error(`Chapter ${chapterIndex + 1} not found.`)
  }
  return sanitizeChapterAssets(chapter, plan, topic, chapterIndex, chapters.length, renderError)
}

export async function generateManimCodeFromPlan(
  plan: ManimScriptPlan,
  topic: string,
  renderError = '',
): Promise<ManimVideoAssets> {
  const extra = renderError ? buildCodeFixRule(renderError) : ''
  let assets = await generateSingleSceneCode(plan, topic, extra)

  if (usesUnsafeManimAPI(assets.manimCode) || usesLatex(assets.manimCode)) {
    assets = await generateSingleSceneCode(
      plan,
      topic,
      buildCodeFixRule(
        usesLatex(assets.manimCode)
          ? 'Code used MathTex/LaTeX — use Text() with unicode math only.'
          : 'Code used unsupported APIs.',
      ),
    )
  }

  return {
    topic: assets.topic || plan.topic || topic,
    narration: assets.narration || plan.narration,
    manimCode: assets.manimCode,
  }
}

/** Generate code for the first chapter only — used for preview before full render. */
export async function generatePreviewCodeFromPlan(
  plan: ManimScriptPlan,
  topic: string,
): Promise<ManimChapterAssets | ManimVideoAssets> {
  const chapters = ensureChapters(plan)
  if (chapters.length <= 1 && (plan.targetDurationSeconds || DEFAULT_VIDEO_DURATION_SECONDS) <= SINGLE_SCENE_MAX_SECONDS) {
    return generateManimCodeFromPlan(plan, topic)
  }
  return generateChapterCodeAtIndex(plan, topic, 0)
}

export async function generateManimVideoAssets(userPrompt: string): Promise<ManimVideoAssets> {
  const { plan, topic } = await generateManimScriptPlan(userPrompt)
  return generateManimCodeFromPlan(plan, topic)
}

export function formatDurationLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins} min`
  return `${mins}m ${secs}s`
}
