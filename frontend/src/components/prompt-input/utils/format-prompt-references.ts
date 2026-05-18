import type { PromptReference } from "../types/prompt-reference"

export function formatReferencesForMessage(references: PromptReference[]): string {
  if (references.length === 0) return ""

  const lines = references.map((ref) => {
    if (ref.kind === "integration") {
      const status = ref.meta?.connected ? "connected" : "not connected"
      const toolsHint = ref.meta?.connected
        ? "Buddy can call this app's Composio tools for this message."
        : "Connect this app in Settings → Integrations to enable tools."
      return `- **${ref.label}** (${status} integration, slug: \`${ref.payload}\`) — ${toolsHint}`
    }
    return `- **Context note:** ${ref.payload}`
  })

  return `### Task references\n${lines.join("\n")}\n\nUse the references above when completing this task.`
}
