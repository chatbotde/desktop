import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import type { ComposioChatToolDefinition, ComposioPrepareChatToolsResult } from '@/types/electron'

const composioInputSchema = z.record(z.string(), z.unknown())

export function getIntegrationSlugsFromReferences(
  references: Array<{ kind: string; payload: string }>
): string[] {
  return references
    .filter((ref) => ref.kind === 'integration')
    .map((ref) => ref.payload)
    .filter(Boolean)
}

export async function prepareComposioChatTools(
  toolkitSlugs?: string[]
): Promise<ComposioPrepareChatToolsResult | null> {
  if (!window.composioAPI?.prepareChatTools) {
    return null
  }

  if (!toolkitSlugs?.length) {
    return null
  }

  return window.composioAPI.prepareChatTools({ toolkitSlugs })
}

export function buildComposioAISDKTools(
  sessionId: string,
  definitions: ComposioChatToolDefinition[]
): ToolSet {
  const tools: ToolSet = {}

  for (const definition of definitions) {
    tools[definition.slug] = tool({
      description: definition.description || `Composio tool ${definition.slug}`,
      inputSchema: composioInputSchema,
      execute: async (input) => {
        if (!window.composioAPI?.executeChatTool) {
          throw new Error('Composio integration is not available in this window.')
        }

        const result = await window.composioAPI.executeChatTool(
          sessionId,
          definition.slug,
          input as Record<string, unknown>
        )

        if (result?.error) {
          throw new Error(
            typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          )
        }

        return result?.data ?? result
      },
    })
  }

  return tools
}
