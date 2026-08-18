export interface SendMessageOptions {
  bypassHistory?: boolean
  systemPromptOverride?: string
  /** Override model max tokens for this request (e.g. long Manim scripts) */
  maxOutputTokens?: number
  /** Composio toolkit slugs from tagged integration references */
  composioToolkitSlugs?: string[]
  /** Run audio/text through Gemini transcribe + Exa fact-check pipeline */
  factCheckMode?: boolean
}
