/**
 * Design System Tokens
 * Typed interface for CSS variables defined in index.css
 * 
 * Use this to ensure visual consistency across all components.
 */

export const tokens = {
    colors: {
        primary: 'hsl(var(--primary))',
        primaryForeground: 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        secondaryForeground: 'hsl(var(--secondary-foreground))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        mutedForeground: 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        accentForeground: 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        destructiveForeground: 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
    },
    radius: {
        default: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
        full: '9999px',
    },
    animations: {
        messageAppear: 'messageAppear 0.3s ease-out',
    },
    spacing: {
        container: '1.5rem',
    }
} as const

export type DesignTokens = typeof tokens
