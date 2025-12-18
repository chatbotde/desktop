/**
 * Model Visibility Settings
 * Manages which models are visible in the model selector popover
 */

const VISIBLE_MODELS_KEY = 'visible-models';
export const MODEL_VISIBILITY_CHANGED_EVENT = 'buddy:model-visibility-changed';

function emitModelVisibilityChanged(): void {
  // Same-window listeners (storage event won't fire in same tab)
  window.dispatchEvent(new Event(MODEL_VISIBILITY_CHANGED_EVENT));
}

/**
 * Get the list of visible model IDs from localStorage
 * Returns all models as visible by default
 */
export function getVisibleModels(): string[] | null {
  const stored = localStorage.getItem(VISIBLE_MODELS_KEY);
  if (!stored) {
    return null; // null means all models are visible (default)
  }
  try {
    return JSON.parse(stored);
  } catch {
    return null;
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
  if (visibleModels === null) {
    return true; // All models visible by default
  }
  return visibleModels.includes(modelId);
}

/**
 * Toggle visibility of a specific model
 */
export function toggleModelVisibility(modelId: string, visible: boolean): void {
  const visibleModels = getVisibleModels();
  if (visibleModels === null) {
    // If there is no custom list yet, we can't safely toggle a single id
    // without knowing the full model list. Create a minimal list:
    // - turning ON: store [modelId]
    // - turning OFF: store []
    // (Preferred usage is to call setVisibleModels() with the full updated list.)
    setVisibleModels(visible ? [modelId] : []);
    return;
  }
  
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

