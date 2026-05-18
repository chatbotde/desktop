export interface SendMessageOptions {
  bypassHistory?: boolean
  systemPromptOverride?: string
  /** Composio toolkit slugs from tagged integration references */
  composioToolkitSlugs?: string[]
}
