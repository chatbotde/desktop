/**
 * Constants used across prompt input components
 */

export const PROMPT_INPUT_CONSTANTS = {
  // Z-index values
  Z_INDEX: {
    CONTAINER: 49,
    NETWORK_INDICATOR: 50,
  },

  // Timeouts (in milliseconds)
  VALIDATION_ERROR_TIMEOUT: 8000,

  // Styling constants
  SUBMIT_BUTTON: {
    SIZE: "h-8 w-8",
    CLASSES: "rounded-full bg-blue-500 text-white hover:bg-blue-500/90 shrink-0",
  },

  // Input constraints
  TEXTAREA: {
    MIN_HEIGHT: 20,
    MAX_HEIGHT: 200,
  },

  // File display
  FILE_ITEMS: {
    COLLAPSED_MAX_WIDTH: 100,
    EXPANDED_MAX_HEIGHT: 80,
  },
} as const

