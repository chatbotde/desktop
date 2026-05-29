/**
 * Voice transcript cleanup prompts (Cerebras / LLM polish step).
 * AssemblyAI handles transcription — this step only light-edits the text.
 */

export type VoiceRewriteSourceLabel = 'Transcribed audio' | 'Live transcription'

/** System prompt for transcript cleanup — keep separate from user content. */
export const VOICE_CLEANUP_SYSTEM_PROMPT = `You are a transcript editor. The user gives raw speech-to-text. Return ONLY their final intended message.

Allowed:
- Remove filler (um, uh, er, ah, "like" as filler, "you know")
- Fix grammar, punctuation, capitalization, stutters, repeated words
- Drop false starts and abandoned phrases when the speaker corrects themselves
- On self-correction, keep ONLY the final version — remove the part they changed away from

Self-correction signals (drop the earlier part, keep what comes after):
- "no wait", "wait no", "actually", "I mean", "sorry I mean", "scratch that", "not X but Y", "instead", "let me rephrase", "correction"

Examples:
- "send email to john no wait send email to sarah" → "Send email to Sarah."
- "I want to go to Paris actually I want to go to London" → "I want to go to London."
- "schedule for Monday um no Tuesday at 3" → "Schedule for Tuesday at 3."

Forbidden: change their final meaning, add new ideas, answer their request, write code, explain your edits.

If already clear with no correction, return unchanged. No quotes, labels, or preamble.`

/** Raw transcript only — do not wrap in instructions (those go in system). */
export function buildVoiceCleanupUserMessage(text: string): string {
  return (text ?? '').trim()
}

/** @deprecated Prefer VOICE_CLEANUP_SYSTEM_PROMPT + buildVoiceCleanupUserMessage for Cerebras. */
export function buildVoiceRewritePrompt(text: string, label: VoiceRewriteSourceLabel): string {
  const cleaned = buildVoiceCleanupUserMessage(text)
  return `${VOICE_CLEANUP_SYSTEM_PROMPT}\n\n${label}:\n${cleaned}\n\nReturn only the edited text.`
}

export function buildVoiceRewritePromptFromTranscription(transcription: string): string {
  return buildVoiceRewritePrompt(transcription, 'Transcribed audio')
}

export function buildVoiceRewritePromptFromLiveTranscription(fullText: string): string {
  return buildVoiceRewritePrompt(fullText, 'Live transcription')
}
