import {
  VOICE_CLEANUP_SYSTEM_PROMPT,
  buildVoiceCleanupUserMessage,
} from '@/lib/prompt'
import { ai } from './ai-sdk/service'
import { isProviderConfigured } from './ai-sdk/providers'

/** gpt-oss-120b follows edit instructions; llama3.1-8b often generates code instead */
const CEREBRAS_PRIMARY_MODEL = 'gpt-oss-120b'
const CEREBRAS_FALLBACK_MODEL = 'llama3.1-8b'

const PROMPT_LEAK_PATTERNS = [
  /strict rules/i,
  /live transcription/i,
  /transcribed audio/i,
  /speech-to-text/i,
  /^"""[\s\S]*"""$/,
  /^here('s| is) (the|your)/i,
  /^sure[,!.]/i,
  /^certainly/i,
  /^the corrected/i,
  /```/,
  /^\s*(def |class |import |from |#include|function\s+\w+\s*\()/m,
]

export function isCerebrasVoiceIntentConfigured(): boolean {
  return isProviderConfigured('cerebras')
}

function cleanModelOutput(text: string): string {
  let out = text.trim()

  // Strip wrapping quotes or markdown fences
  out = out.replace(/^["'`]+|["'`]+$/g, '')
  out = out.replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/i, '')

  // If model echoed triple quotes block, take inner content
  const quoted = out.match(/^"""([\s\S]*?)"""$/)
  if (quoted) out = quoted[1].trim()

  return out.trim()
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? []
}

/**
 * If Cerebras output looks wrong, keep the AssemblyAI transcript unchanged.
 * Allows dropping leading/corrected-away text — only checks output words come from original.
 */
export function validateCleanupOutput(original: string, candidate: string): string {
  const orig = original.trim()
  const cleaned = cleanModelOutput(candidate)

  if (!cleaned) {
    console.warn('[VoiceIntent] Empty output — using original transcript')
    return orig
  }

  if (PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    console.warn('[VoiceIntent] Prompt leakage detected — using original transcript')
    return orig
  }

  const origWords = tokenize(orig)
  const outWords = tokenize(cleaned)

  if (outWords.length >= 2) {
    const origSet = new Set(origWords)
    const fromOriginal = outWords.filter((word) => origSet.has(word)).length
    const fidelityRatio = fromOriginal / outWords.length

    if (fidelityRatio < 0.85) {
      console.warn('[VoiceIntent] Output added words not in original — using original transcript')
      return orig
    }
  }

  if (outWords.length < 2 && origWords.length >= 4) {
    console.warn('[VoiceIntent] Output too brief after cleanup — using original transcript')
    return orig
  }

  if (cleaned.length > orig.length * 2) {
    console.warn('[VoiceIntent] Output too long — using original transcript')
    return orig
  }

  return cleaned
}

async function generateCleanupWithModel(transcript: string, modelId: string): Promise<string> {
  const userMessage = buildVoiceCleanupUserMessage(transcript)
  const result = await ai.generate('cerebras', modelId, userMessage, {
    system: VOICE_CLEANUP_SYSTEM_PROMPT,
    temperature: 0,
    maxOutputTokens: Math.min(2048, Math.max(256, transcript.length * 2)),
  })

  return validateCleanupOutput(transcript, result.text)
}

/**
 * Light cleanup of live transcription via Cerebras.
 * Returns the original text if the model output looks bad.
 */
export async function rewriteTranscriptToIntent(transcript: string): Promise<string> {
  const cleaned = transcript.trim()
  if (!cleaned) return ''

  if (!isCerebrasVoiceIntentConfigured()) {
    throw new Error('Cerebras API key not configured. Add VITE_CEREBRAS_API_KEY to buddy/.env')
  }

  try {
    return await generateCleanupWithModel(cleaned, CEREBRAS_PRIMARY_MODEL)
  } catch (primaryError) {
    console.warn('[VoiceIntent] Primary model failed, trying fallback:', primaryError)
    return generateCleanupWithModel(cleaned, CEREBRAS_FALLBACK_MODEL)
  }
}

/**
 * Stream cleanup from Cerebras; validates the final result before returning.
 */
export async function* streamTranscriptToIntent(
  transcript: string
): AsyncGenerator<string, string, unknown> {
  const cleaned = transcript.trim()
  if (!cleaned) return ''

  if (!isCerebrasVoiceIntentConfigured()) {
    throw new Error('Cerebras API key not configured. Add VITE_CEREBRAS_API_KEY to buddy/.env')
  }

  const userMessage = buildVoiceCleanupUserMessage(cleaned)

  const streamWithModel = async function* (modelId: string) {
    const result = await ai.stream('cerebras', modelId, userMessage, {
      system: VOICE_CLEANUP_SYSTEM_PROMPT,
      temperature: 0,
      maxOutputTokens: Math.min(2048, Math.max(256, cleaned.length * 2)),
    })

    let full = ''
    for await (const chunk of result.textStream) {
      full += chunk
      yield chunk
    }
    return validateCleanupOutput(cleaned, full)
  }

  try {
    let full = ''
    for await (const chunk of streamWithModel(CEREBRAS_PRIMARY_MODEL)) {
      full += chunk
      yield chunk
    }
    return validateCleanupOutput(cleaned, full)
  } catch (primaryError) {
    console.warn('[VoiceIntent] Stream primary failed, trying fallback:', primaryError)
    let full = ''
    for await (const chunk of streamWithModel(CEREBRAS_FALLBACK_MODEL)) {
      full += chunk
      yield chunk
    }
    return validateCleanupOutput(cleaned, full)
  }
}
