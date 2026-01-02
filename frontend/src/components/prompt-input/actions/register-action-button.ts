import { actionButtonRegistry } from "../registry/action-button-registry"
import type { ActionButtonConfig } from "../types/action-button"

/**
 * Helper function to easily register a new action button
 * 
 * @example
 * ```tsx
 * registerActionButton({
 *   id: "my-button",
 *   order: 4,
 *   condition: () => someCondition,
 *   component: <MyButton />
 * })
 * ```
 */
export function registerActionButton(config: ActionButtonConfig): void {
  actionButtonRegistry.register(config)
}

/**
 * Helper function to unregister an action button
 */
export function unregisterActionButton(id: string): void {
  actionButtonRegistry.unregister(id)
}

