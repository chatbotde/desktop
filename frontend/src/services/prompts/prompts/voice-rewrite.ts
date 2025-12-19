/**
 * Voice prompt helpers
 *
 * Centralizes the small prompt used to rewrite speech-to-text into a clean
 * single text prompt the user can send to an AI assistant.
 */

export type VoiceRewriteSourceLabel = 'Transcribed audio' | 'Live transcription'

export function buildVoiceRewritePrompt(text: string, label: VoiceRewriteSourceLabel): string {
  const cleaned = (text ?? '').trim()
  return (
    `You are an expert at converting spoken thoughts into the clearest, most effective prompt for a large language model.\n\n` +
    `${label}:\n"""${cleaned}"""\n\n` +
    `Transform this into the best possible prompt so the AI fully understands the user's intent. Only return the improved prompt text, without any extra explanation.`
  )
}

export function buildVoiceRewritePromptFromTranscription(transcription: string): string {
  return buildVoiceRewritePrompt(transcription, 'Transcribed audio')
}

export function buildVoiceRewritePromptFromLiveTranscription(fullText: string): string {
  return buildVoiceRewritePrompt(fullText, 'Live transcription')
}
