/**
 * AssemblyAI Configuration Module
 * SOLID: Single Responsibility - Handles only configuration concerns
 */

import { resolveEnvValue, hasValidEnvValue, type EnvResolution } from '@/lib/ai/env-utils'

const ASSEMBLYAI_PRIMARY_KEY = 'VITE_ASSEMBLYAI_API_KEY'
const ASSEMBLYAI_FALLBACK_KEYS = ['ASSEMBLYAI_API_KEY', 'VITE_ASSEMBLY_AI_API_KEY']

/**
 * AssemblyAI API configuration
 */
export interface AssemblyAIConfig {
  apiKey: string
  baseUrl: string
  streamingUrl: string
  isConfigured: boolean
}

let config: AssemblyAIConfig | null = null

/**
 * Resolve AssemblyAI API key from environment variables
 */
function resolveApiKey(): EnvResolution {
  return resolveEnvValue(ASSEMBLYAI_PRIMARY_KEY, {
    fallbacks: ASSEMBLYAI_FALLBACK_KEYS,
    provider: 'AssemblyAI',
  })
}

/**
 * Get AssemblyAI configuration
 * SOLID: Single Responsibility - Only handles configuration retrieval
 */
export function getAssemblyAIConfig(): AssemblyAIConfig {
  if (config) {
    return config
  }

  const apiKeyResolution = resolveApiKey()
  const isConfigured = hasValidEnvValue(apiKeyResolution)

  if (!isConfigured) {
    console.warn(
      '[AssemblyAI] API key not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.'
    )
  }

  config = {
    apiKey: apiKeyResolution.value,
    baseUrl: 'https://api.assemblyai.com/v2',
    streamingUrl: 'wss://streaming.assemblyai.com/v3/ws',
    isConfigured,
  }

  return config
}

/**
 * Check if AssemblyAI is properly configured
 */
export function isAssemblyAIConfigured(): boolean {
  return getAssemblyAIConfig().isConfigured
}

/**
 * Reset configuration (useful for testing or re-initialization)
 */
export function resetAssemblyAIConfig(): void {
  config = null
}









