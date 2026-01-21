/**
 * System Prompts Configuration
 * Aggregates all system prompts and provides utility functions
 *
 * NOTE:
 * This lives under `src/lib/prompt/` so prompt text is centralized and reusable.
 * `src/lib/ai/system-prompts.ts` re-exports this module for backwards compatibility.
 *
 * TO ADD A NEW PROMPT:
 * 1. Create a new file in this directory (e.g., business.ts)
 * 2. Follow the pattern in existing files (general.ts, code.ts, creative.ts)
 * 3. Import and add it to the SYSTEM_PROMPTS array below
 */

/**
 * System Prompts Configuration
 * Aggregates all system prompts and provides utility functions
 *
 * NOTE:
 * This lives under `src/lib/prompt/` so prompt text is centralized and reusable.
 * `src/lib/ai/system-prompts.ts` re-exports this module for backwards compatibility.
 *
 * TO ADD A NEW PROMPT:
 * 1. Create a new file in this directory (e.g., business.ts)
 * 2. Follow the pattern in existing files (general.ts, code.ts, creative.ts)
 * 3. Import and add it to the SYSTEM_PROMPTS array below
 */
import type { SystemPrompt } from './types';
import { generalPrompt } from './general';
import { codePrompt } from './code';
import { creativePrompt } from './creative';
import { liveAssistantPrompt } from './live-assistant';

// Re-export types for convenience
export type { SystemPrompt } from './types';

// Re-export individual prompts
export { GENERAL_ASSISTANT_PROMPT } from './general';
export { CODE_ASSISTANT_PROMPT } from './code';
export { CREATIVE_ASSISTANT_PROMPT } from './creative';
export { LIVE_ASSISTANT_PROMPT } from './live-assistant';

/**
 * All available system prompts
 * 
 * To add a new prompt:
 * 1. Create a new file (e.g., business.ts)
 * 2. Import it above
 * 3. Add it to this array
 */
export const SYSTEM_PROMPTS: SystemPrompt[] = [
  generalPrompt,
  codePrompt,
  creativePrompt,
  liveAssistantPrompt,
  // Add new prompts here
];

/**
 * Get system prompt by ID
 */
export function getSystemPromptById(id: string): SystemPrompt | undefined {
  return SYSTEM_PROMPTS.find((prompt) => prompt.id === id);
}

/**
 * Get the default system prompt (General Assistant)
 */
export function getDefaultSystemPrompt(): SystemPrompt {
  return SYSTEM_PROMPTS[0]; // General Assistant
}

/**
 * Apply system prompt to all AI services
 */
export function applySystemPrompt(prompt: string) {
  // This function should be called from the unified service
  // to apply the system prompt across all providers
  return prompt;
}
