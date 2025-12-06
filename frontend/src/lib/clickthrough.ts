/**
 * Clickthrough System Initializer for Interfaces Window Frontend
 * 
 * Clickthrough is DISABLED.
 */

// Type definitions for the clickthrough API
declare global {
  interface Window {
    clickthroughAPI?: never;
  }
}

/**
 * Initialize the clickthrough system
 * This should be called once when the app loads
 */
export function initializeClickthrough() {
  // Clickthrough is disabled
}





/**
 * Toggle clickthrough
 */
export function toggleClickthrough() {
  // No-op
}

/**
 * Get current clickthrough state
 */
export async function getClickthroughState(): Promise<boolean> {
  return false;
}
