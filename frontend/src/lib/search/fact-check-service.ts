import { GoogleGenAI } from '@google/genai'
import { getProviderApiKey } from '@/lib/ai/ai-sdk/providers'
import { resolveEnvValue } from '@/lib/ai/env-utils'
import type { MediaAttachment } from '@/features/chat'
import type {
  FactCheckProgress,
  FactCheckResult,
  FactCheckSource,
  FactCheckVerdict,
} from './fact-check-types'

const TRANSCRIBE_MODEL = 'gemini-2.5-flash'
const SYNTHESIS_MODEL = 'gemini-2.5-flash'

const TRANSCRIBE_PROMPT =
  'Transcribe this audio verbatim in the language spoken. Do not translate. Return only the transcript text, nothing else.'

/** Placeholder text when sending attachments without typed input — not a real claim. */
const ATTACHMENT_PLACEHOLDERS = new Set([
  'see attached media',
  'see attachment',
  'attached media',
])

function normalizeClaimText(text?: string): string {
  const trimmed = text?.trim() ?? ''
  if (!trimmed) return ''
  if (ATTACHMENT_PLACEHOLDERS.has(trimmed.toLowerCase())) return ''
  return trimmed
}

function formatExaError(status: number, body: string): string {
  if (status === 402) {
    return 'Exa search credits are used up. Add credits at dashboard.exa.ai — this is a billing limit on your Exa API key, not something wrong with your recording.'
  }
  if (status === 401) {
    return 'Exa API key is invalid. Check VITE_EXA_API_KEY in your .env file.'
  }
  if (status === 429) {
    return 'Exa rate limit reached. Wait a moment and try again.'
  }
  const detail = body ? `: ${body.slice(0, 120)}` : ''
  return `Exa search failed (${status})${detail}`
}

function getExaApiKey(): string {
  const resolved = resolveEnvValue('VITE_EXA_API_KEY', { provider: 'exa' })
  return resolved.value.trim()
}

function getGoogleApiKey(): string {
  return getProviderApiKey('google')?.trim() ?? ''
}

function stripBase64Prefix(dataUrl: string): { mimeType: string; data: string } {
  if (dataUrl.includes('base64,')) {
    const [header, data] = dataUrl.split('base64,')
    const mimeMatch = header.match(/data:([^;]+)/)
    return { mimeType: mimeMatch?.[1] ?? 'audio/webm', data }
  }
  return { mimeType: 'audio/webm', data: dataUrl }
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatPublishedDate(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function mapExaCitation(raw: Record<string, unknown>, index: number): FactCheckSource {
  const url = String(raw.url ?? '')
  const text = typeof raw.text === 'string' ? raw.text : ''
  return {
    id: String(raw.id ?? `source-${index}`),
    url,
    title: String(raw.title ?? domainFromUrl(url)),
    snippet: text.slice(0, 280) || String(raw.title ?? url),
    publishedDate: formatPublishedDate(
      typeof raw.publishedDate === 'string' ? raw.publishedDate : undefined
    ),
    favicon:
      typeof raw.favicon === 'string'
        ? raw.favicon
        : `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`,
    image: typeof raw.image === 'string' ? raw.image : undefined,
    domain: domainFromUrl(url),
  }
}

export function isFactCheckConfigured(): boolean {
  const google = getGoogleApiKey()
  const exaResolved = resolveEnvValue('VITE_EXA_API_KEY', { provider: 'exa' })
  const exa = exaResolved.value.trim()
  return Boolean(google && exa && !exaResolved.isPlaceholder)
}

export async function transcribeAudioAttachment(
  attachment: MediaAttachment
): Promise<string> {
  const apiKey = getGoogleApiKey()
  if (!apiKey) {
    throw new Error('Google API key missing. Set VITE_GOOGLE_API_KEY in .env.')
  }

  const { mimeType, data } = stripBase64Prefix(attachment.data)
  const client = new GoogleGenAI({ apiKey })

  const response = await client.models.generateContent({
    model: TRANSCRIBE_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data } },
          { text: TRANSCRIBE_PROMPT },
        ],
      },
    ],
  })

  const text = response.text?.trim()
  if (!text) {
    throw new Error('Could not transcribe audio. Try speaking more clearly or use typed text.')
  }
  return text
}

interface ExaAnswerResponse {
  answer?: string | Record<string, unknown>
  citations?: Array<Record<string, unknown>>
}

async function fetchExaAnswer(claim: string): Promise<{ answer: string; sources: FactCheckSource[] }> {
  const apiKey = getExaApiKey()
  if (!apiKey) {
    throw new Error('Exa API key missing. Set VITE_EXA_API_KEY in .env.')
  }

  const response = await fetch('https://api.exa.ai/answer', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `Fact-check this claim with current web sources. Is it true, false, or mixed? Claim: ${claim}`,
      text: true,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(formatExaError(response.status, body))
  }

  const data = (await response.json()) as ExaAnswerResponse
  const answer =
    typeof data.answer === 'string'
      ? data.answer
      : JSON.stringify(data.answer ?? '')

  const sources = (data.citations ?? []).map(mapExaCitation)

  return { answer, sources }
}

async function synthesizeVerdict(
  claim: string,
  researchAnswer: string
): Promise<{ verdict: FactCheckVerdict; summary: string }> {
  const apiKey = getGoogleApiKey()
  if (!apiKey) {
    return { verdict: 'unverified', summary: researchAnswer }
  }

  const client = new GoogleGenAI({ apiKey })
  const prompt = `You are a fact-check editor.

Claim:
${claim}

Research from web sources:
${researchAnswer}

Respond with JSON only (no markdown):
{"verdict":"true"|"false"|"mixed"|"unverified","summary":"2-4 clear sentences for the user"}`

  try {
    const response = await client.models.generateContent({
      model: SYNTHESIS_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.trim() ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { verdict: 'unverified', summary: researchAnswer }
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      verdict?: string
      summary?: string
    }

    const verdictValues: FactCheckVerdict[] = ['true', 'false', 'mixed', 'unverified']
    const verdict = verdictValues.includes(parsed.verdict as FactCheckVerdict)
      ? (parsed.verdict as FactCheckVerdict)
      : 'unverified'

    return {
      verdict,
      summary: parsed.summary?.trim() || researchAnswer,
    }
  } catch {
    return { verdict: 'unverified', summary: researchAnswer }
  }
}

export async function runFactCheckPipeline(params: {
  text?: string
  audioAttachment?: MediaAttachment
  onProgress?: (progress: FactCheckProgress) => void
}): Promise<FactCheckResult> {
  const { text, audioAttachment, onProgress } = params

  let claim = normalizeClaimText(text)

  if (audioAttachment) {
    onProgress?.({ stage: 'transcribing' })
    const transcript = await transcribeAudioAttachment(audioAttachment)
    claim = claim ? `${claim}\n\n${transcript}` : transcript
    onProgress?.({ stage: 'transcribing', claim })
  }

  if (!claim) {
    throw new Error('Nothing to fact-check. Record audio or type a claim first.')
  }

  onProgress?.({ stage: 'checking', claim })

  const { answer, sources } = await fetchExaAnswer(claim)

  onProgress?.({ stage: 'synthesizing', claim })
  const { verdict, summary } = await synthesizeVerdict(claim, answer)

  const result: FactCheckResult = {
    claim,
    verdict,
    summary,
    sources,
    stage: 'complete',
  }

  onProgress?.({ stage: 'complete', claim })
  return result
}
