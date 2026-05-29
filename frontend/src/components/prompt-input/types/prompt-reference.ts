export type PromptReferenceKind = "integration" | "note" | "url"

export interface PromptReference {
  id: string
  kind: PromptReferenceKind
  label: string
  payload: string
  meta?: {
    connected?: boolean
    logo?: string
  }
}

export function createIntegrationReference(tool: {
  slug: string
  name: string
  logo?: string
  isConnected: boolean
}): PromptReference {
  return {
    id: `integration:${tool.slug}`,
    kind: "integration",
    label: tool.name,
    payload: tool.slug,
    meta: { connected: tool.isConnected, logo: tool.logo },
  }
}

export function createNoteReference(text: string): PromptReference {
  const trimmed = text.trim()
  const preview = trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed
  return {
    id: `note:${Date.now()}`,
    kind: "note",
    label: preview || "Note",
    payload: trimmed,
  }
}

export function createUrlReference(url: string): PromptReference {
  const trimmed = url.trim()
  return {
    id: `url:${Date.now()}`,
    kind: "url",
    label: trimmed,
    payload: trimmed,
  }
}
