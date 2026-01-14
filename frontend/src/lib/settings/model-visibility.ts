/**
 * Model Visibility Settings
 * Manages which models are visible in the model selector popover
 */

import { getDefaultVisibleModels } from './default-model-visibility';

const VISIBLE_MODELS_KEY = 'visible-models';
export const MODEL_VISIBILITY_CHANGED_EVENT = 'buddy:model-visibility-changed';

function emitModelVisibilityChanged(): void {
  // Same-window listeners (storage event won't fire in same tab)
  window.dispatchEvent(new Event(MODEL_VISIBILITY_CHANGED_EVENT));
}

/**
 * Get the list of visible model IDs from localStorage
 * Returns default visible models if no custom settings exist
 */
export function getVisibleModels(): string[] | null {
  const stored = localStorage.getItem(VISIBLE_MODELS_KEY);
  if (!stored) {
    // Return default visible models instead of null (all visible)
    return getDefaultVisibleModels();
  }
  try {
    return JSON.parse(stored);
  } catch {
    return getDefaultVisibleModels();
  }
}

/**
 * Set the list of visible model IDs
 */
export function setVisibleModels(modelIds: string[]): void {
  localStorage.setItem(VISIBLE_MODELS_KEY, JSON.stringify(modelIds));
  emitModelVisibilityChanged();
}

/**
 * Check if a specific model is visible
 */
export function isModelVisible(modelId: string): boolean {
  const visibleModels = getVisibleModels();
  // getVisibleModels now returns defaults if no custom settings
  return visibleModels?.includes(modelId) ?? false;
}

/**
 * Toggle visibility of a specific model
 */
export function toggleModelVisibility(modelId: string, visible: boolean): void {
  const visibleModels = getVisibleModels() ?? [];

  const updated = visible
    ? [...visibleModels.filter(id => id !== modelId), modelId]
    : visibleModels.filter(id => id !== modelId);

  setVisibleModels(updated);
}

/**
 * Reset to show all models (clear settings)
 */
export function resetModelVisibility(): void {
  localStorage.removeItem(VISIBLE_MODELS_KEY);
  emitModelVisibilityChanged();
}

