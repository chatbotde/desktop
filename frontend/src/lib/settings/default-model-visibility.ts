/**
 * Default Model Visibility Configuration
 * 
 * This file defines which models are visible by default in the model selector dropdown
 * when the application is first launched (before the user customizes).
 * 
 * To add a new default visible model, add its ID to the DEFAULT_VISIBLE_MODELS array.
 * To hide a model by default, remove its ID from the array.
 */

/**
 * List of model IDs that should be visible by default in the model selector.
 * 
 * By default, only the most popular/recommended models are visible.
 * Users can enable more models in Settings > Model Profile List.
 */
export const DEFAULT_VISIBLE_MODELS: string[] = [
    // Google Models (Recommended)
    'gemini-2.5-flash',      // Fast, efficient, great for most tasks
    'gemini-2.5-pro',        // Most capable, best for complex tasks
    'gemini-2.0-flash',      // Previous generation flash


]

/**
 * Check if a model should be visible by default
 */
export function isDefaultVisibleModel(modelId: string): boolean {
    return DEFAULT_VISIBLE_MODELS.includes(modelId)
}

/**
 * Get the list of default visible model IDs
 */
export function getDefaultVisibleModels(): string[] {
    return [...DEFAULT_VISIBLE_MODELS]
}
