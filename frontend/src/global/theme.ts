/**
 * Global Theme Configuration
 * 
 * Changing values here will affect UI components across the entire application.
 * This is the central source of truth for the app's visual style.
 */

export const GLOBAL_THEME = {
    // Core colors (using CSS variables from index.css)
    colors: {
        dark: {
            background: "#09090b", // Solid background for dark mode
            card: "#09090b",
            border: "#18181b", // zinc-800
            text: "#fafafa",   // zinc-50
            textMuted: "#a1a1aa", // zinc-400
            accent: "#3b82f6", // blue-500
            dragHandle: "#71717a", // zinc-500
        },
        light: {
            background: "#ffffff",
            card: "#ffffff",
            border: "#e4e4e7", // zinc-200
            text: "#09090b",   // zinc-950
            textMuted: "#71717a", // zinc-500
            accent: "#2563eb", // blue-600
            dragHandle: "#a1a1aa", // zinc-400
        }
    },

    // Animation settings
    animations: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Standard easing
    },

    // Standard z-index layers
    zIndex: {
        base: 1,
        content: 1000,      // Image/Video/Chat windows
        input: 2000,        // Prompt input
        overlay: 2001,      // Transcription
        assistant: 2002,    // Assistant Sphere
        hint: 2005,         // Right edge hint
        modal: 3000,        // Modals and dialogs
    },

    // Shared UI components configuration
    ui: {
        radius: "0.625rem",
        glassmorphism: false, // Set to true if you want to bring back the blur effects
    }
} as const;

export type GlobalTheme = typeof GLOBAL_THEME;
