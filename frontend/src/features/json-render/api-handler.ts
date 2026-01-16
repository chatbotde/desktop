/**
 * JSON Render API Handler
 * 
 * Handles API requests for generating UI from prompts.
 * This can be integrated with your AI service (OpenAI, Anthropic, etc.)
 */

import { jsonRenderCatalog } from './catalog'
import type { JsonRenderCatalog } from './catalog'

export interface GenerateUIRequest {
  prompt: string
  context?: Record<string, any>
  existingTree?: any
}

export interface GenerateUIResponse {
  tree: any
  error?: string
}

/**
 * Generate UI from prompt
 * 
 * This function should be called from your API endpoint.
 * It uses the catalog to ensure AI only generates valid components.
 * 
 * @example
 * ```ts
 * // In your API route
 * const response = await generateUI({
 *   prompt: 'Create a dashboard with revenue metrics',
 *   context: { revenue: 125000, growth: 0.15 }
 * })
 * ```
 */
export async function generateUI(
  request: GenerateUIRequest,
  options?: {
    apiKey?: string
    model?: string
    baseURL?: string
  }
): Promise<GenerateUIResponse> {
  try {
    // Get the catalog schema for the AI
    const catalogSchema = jsonRenderCatalog

    // Build the system prompt
    const systemPrompt = `You are a UI generator that creates JSON representations of user interfaces.
You can only use components from the provided catalog. Each component has specific props that must be followed.

Catalog:
${JSON.stringify(catalogSchema, null, 2)}

Rules:
1. Only use components defined in the catalog
2. Follow the exact prop schemas
3. Use valuePath to bind to data (e.g., "/form/email")
4. Use actions for interactive elements
5. Return valid JSON that matches the catalog structure`

    // Build the user prompt
    const userPrompt = request.prompt

    // Call your AI service
    // This is a placeholder - replace with your actual AI service call
    const response = await callAIService({
      systemPrompt,
      userPrompt,
      context: request.context,
      catalog: catalogSchema,
      ...options,
    })

    return {
      tree: response.tree,
    }
  } catch (error) {
    console.error('Error generating UI:', error)
    return {
      tree: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Call AI Service
 * 
 * Replace this with your actual AI service integration.
 * Examples: OpenAI, Anthropic, Groq, etc.
 */
async function callAIService({
  systemPrompt,
  userPrompt,
  context,
  catalog,
  apiKey,
  model = 'gpt-4',
  baseURL,
}: {
  systemPrompt: string
  userPrompt: string
  context?: Record<string, any>
  catalog: JsonRenderCatalog
  apiKey?: string
  model?: string
  baseURL?: string
}): Promise<{ tree: any }> {
  // TODO: Replace with your actual AI service
  // Example with OpenAI:
  /*
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  })
  
  const tree = JSON.parse(completion.choices[0].message.content || '{}')
  return { tree }
  */

  // Placeholder response
  return {
    tree: {
      type: 'Card',
      props: {
        title: 'Generated UI',
        description: 'Replace this with actual AI integration',
      },
      children: [],
    },
  }
}

/**
 * Create API Route Handler
 * 
 * Use this in your API route (e.g., Next.js, Express, etc.)
 * 
 * @example
 * ```ts
 * // app/api/generate-ui/route.ts (Next.js)
 * import { generateUI } from '@/features/json-render/api-handler'
 * 
 * export async function POST(request: Request) {
 *   const body = await request.json()
 *   const result = await generateUI(body)
 *   return Response.json(result)
 * }
 * ```
 */
export function createAPIHandler() {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.json()
      const result = await generateUI(body)
      return Response.json(result)
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
}
