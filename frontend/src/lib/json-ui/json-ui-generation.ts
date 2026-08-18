import {
  autoFixSpec,
  compileSpecStream,
  formatSpecIssues,
  validateSpec,
  type Spec,
} from '@json-render/core'
import { buddyJsonUiCatalog } from './buddy-json-ui'

export type ParsedJsonUiOutput = {
  spec: Spec | null
  error: string | null
  warnings: string[]
}

function extractJsonObject(text: string): unknown | null {
  const startIndex = text.indexOf('{')
  const endIndex = text.lastIndexOf('}')
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null

  try {
    return JSON.parse(text.slice(startIndex, endIndex + 1))
  } catch {
    return null
  }
}

function normalizeSpec(candidate: unknown): ParsedJsonUiOutput {
  const catalogResult = buddyJsonUiCatalog.validate(candidate)
  if (!catalogResult.success || !catalogResult.data) {
    return {
      spec: null,
      error:
        catalogResult.error?.message ??
        'The model returned JSON that does not match the SonicThinking JSON UI catalog.',
      warnings: [],
    }
  }

  const fixed = autoFixSpec(catalogResult.data as Spec)
  const validation = validateSpec(fixed.spec)

  if (!validation.valid) {
    return {
      spec: null,
      error: formatSpecIssues(validation.issues),
      warnings: fixed.fixes,
    }
  }

  return {
    spec: fixed.spec,
    error: null,
    warnings: fixed.fixes,
  }
}

export function buildBuddyJsonUiSystemPrompt(): string {
  return buddyJsonUiCatalog.prompt({
    system: 'You are a SonicThinking Generative UI assistant. Build compact, useful UI from the user request.',
    mode: 'standalone',
    customRules: [
      'Return only json-render SpecStream JSONL patches. Do not use markdown fences or prose.',
      'Use a small primitive set and compose with Stack, Grid, Card, Heading, Text, Icon, Button, and Separator.',
      'Prefer repeat with state plus $item, $index, and $template bindings when rendering lists.',
      'Keep layouts compact and desktop-assistant friendly; avoid landing-page hero layouts.',
      'Do not invent component types, props, icons, actions, or CSS class names.',
    ],
  })
}

export function parseBuddyJsonUiOutput(output: string): ParsedJsonUiOutput {
  try {
    const streamedSpec = compileSpecStream<Record<string, unknown>>(output)
    if (streamedSpec?.root && streamedSpec.elements) {
      return normalizeSpec(streamedSpec)
    }
  } catch {
    // Some models still return a complete JSON object. Handle that as a fallback.
  }

  const jsonObject = extractJsonObject(output)
  if (!jsonObject) {
    return {
      spec: null,
      error: 'Could not parse json-render JSONL patches or a JSON spec from the model output.',
      warnings: [],
    }
  }

  return normalizeSpec(jsonObject)
}
