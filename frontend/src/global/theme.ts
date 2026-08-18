/**
 * Global Theme Configuration
 *
 * Visual tokens live in `lib/appearance/themes.ts`.
 * Components should use semantic classes from `@/lib/appearance/surfaces`.
 */

export const GLOBAL_THEME = {
  animations: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  },

  zIndex: {
    base: 1,
    content: 1000,
    input: 2000,
    overlay: 2001,
    assistant: 2002,
    hint: 2005,
    modal: 3000,
  },

  ui: {
    radius: "var(--radius)",
  },

  /**
   * CSS variable references for inline styles.
   * Prefer semantic classes from `@/lib/appearance/surfaces` in new code.
   */
  vars: {
    background: "hsl(var(--background))",
    card: "hsl(var(--card) / var(--appearance-surface-opacity, 1))",
    border: "hsl(var(--border))",
    text: "hsl(var(--foreground))",
    textMuted: "hsl(var(--muted-foreground))",
    accent: "hsl(var(--primary))",
    dragHandle: "hsl(var(--muted-foreground))",
  },
} as const

export type GlobalTheme = typeof GLOBAL_THEME
