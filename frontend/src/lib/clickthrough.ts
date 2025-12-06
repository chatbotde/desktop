/**
 * Clickthrough System Initializer for Interfaces Window Frontend
 * 
 * This script initializes the clickthrough system that makes the window
 * clickthrough except for elements marked with data-no-clickthrough
 */

// Type definitions for the clickthrough API
declare global {
  interface Window {
    clickthroughAPI?: {
      enable: () => void;
      disable: () => void;
      toggle: () => void;
      getState: () => Promise<boolean>;
      onStateChange: (callback: (enabled: boolean) => void) => () => void;
    };
  }
}

/**
 * Initialize the clickthrough system
 * This should be called once when the app loads
 */
export function initializeClickthrough() {
  if (!window.clickthroughAPI) {
    console.warn('[Clickthrough] API not available. Running outside Electron?');
    return;
  }

  console.log('[Clickthrough] Initializing frontend clickthrough system...');

  // Track mouse position and UI elements
  let isOverUI = false;
  let debounceTimer: number | null = null;

  /**
   * Check if an element or its parents have data-no-clickthrough
   */
  function hasNoClickthrough(element: Element | null): boolean {
    if (!element) return false;
    
    // Check current element
    if (element.hasAttribute('data-no-clickthrough')) {
      return true;
    }
    
    // Check parents
    const parent = element.closest('[data-no-clickthrough]');
    return parent !== null;
  }

  /**
   * Handle mouse movement with debouncing
   */
  function handleMouseMove(event: MouseEvent) {
    const target = event.target as Element;
    const wasOverUI = isOverUI;
    isOverUI = hasNoClickthrough(target);

    // Only update if state changed to avoid unnecessary IPC calls
    if (isOverUI !== wasOverUI) {
      // Clear any pending state change
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce the state change to avoid rapid toggles
      debounceTimer = window.setTimeout(() => {
        if (isOverUI) {
          window.clickthroughAPI?.disable();
        } else {
          window.clickthroughAPI?.enable();
        }
      }, 10) as unknown as number;
    }
  }

  /**
   * Handle clicks on UI elements
   */
  function handleClick(event: MouseEvent) {
    const target = event.target as Element;
    if (hasNoClickthrough(target)) {
      window.clickthroughAPI?.disable();
    }
  }

  // Track window focus to prevent unnecessary state changes during transitions
  window.addEventListener('focus', () => {
    // Window regained focus - state should be managed by mouse position
  });

  window.addEventListener('blur', () => {
    // Window lost focus - maintain current state
  });

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);

  // Listen for Ctrl+T keyboard shortcut
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault();
      window.clickthroughAPI?.toggle();
    }
  });

  // Listen for state changes from main process
  const unsubscribe = window.clickthroughAPI.onStateChange?.((enabled) => {
    console.log('[Clickthrough] State changed:', enabled ? 'enabled' : 'disabled');
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe?.();
  });

  console.log('[Clickthrough] Initialized successfully');
}

/**
 * Manually enable clickthrough
 */
export function enableClickthrough() {
  window.clickthroughAPI?.enable();
}

/**
 * Manually disable clickthrough
 */
export function disableClickthrough() {
  window.clickthroughAPI?.disable();
}

/**
 * Toggle clickthrough
 */
export function toggleClickthrough() {
  window.clickthroughAPI?.toggle();
}

/**
 * Get current clickthrough state
 */
export async function getClickthroughState(): Promise<boolean> {
  return window.clickthroughAPI?.getState() ?? false;
}
