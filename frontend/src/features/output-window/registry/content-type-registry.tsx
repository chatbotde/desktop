/**
 * Message Content Type Registry
 * 
 * This registry allows registering different renderers for different content types.
 * Following React best practices for extensibility and separation of concerns.
 * 
 * Usage:
 * 1. Register content type renderers
 * 2. Use ContentRenderer component to automatically pick the right renderer
 * 
 * Future: Add table, chart, image gallery, code diff, etc.
 */

import { memo, lazy, Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'

// Content types enum - extensible for future additions
export type ContentType =
    | 'text'
    | 'markdown'
    | 'code'
    | 'math'
    | 'table'
    | 'image'
    | 'chart'
    | 'error'
    | 'loading'
    | 'custom'

export interface ContentRendererProps {
    content: string
    isDark: boolean
    className?: string
    metadata?: Record<string, unknown>
}

export interface ContentTypeConfig {
    type: ContentType
    /** Component to render this content type */
    component: ComponentType<ContentRendererProps>
    /** Check if content matches this type */
    detect?: (content: string) => boolean
    /** Priority for detection (higher = checked first) */
    priority?: number
    /** Fallback loading component */
    fallback?: ReactNode
}

// Registry singleton
class ContentTypeRegistry {
    private types = new Map<ContentType, ContentTypeConfig>()
    private detectors: Array<{ type: ContentType; detect: (content: string) => boolean; priority: number }> = []

    register(config: ContentTypeConfig): void {
        this.types.set(config.type, config)

        if (config.detect) {
            this.detectors.push({
                type: config.type,
                detect: config.detect,
                priority: config.priority ?? 0
            })
            // Sort by priority (descending)
            this.detectors.sort((a, b) => b.priority - a.priority)
        }
    }

    get(type: ContentType): ContentTypeConfig | undefined {
        return this.types.get(type)
    }

    detectType(content: string): ContentType {
        for (const detector of this.detectors) {
            if (detector.detect(content)) {
                return detector.type
            }
        }
        return 'text'
    }

    getAll(): ContentTypeConfig[] {
        return Array.from(this.types.values())
    }
}

export const contentTypeRegistry = new ContentTypeRegistry()

// Default loading component
const DefaultLoading = memo(function DefaultLoading() {
    return (
        <div className="animate-pulse flex space-x-2">
            <div className="h-4 w-4 rounded-full bg-gray-400/30" />
            <div className="h-4 w-24 rounded bg-gray-400/30" />
        </div>
    )
})

/**
 * ContentRenderer - Automatically selects and renders the appropriate component
 * based on content type detection or explicit type prop.
 */
export const ContentRenderer = memo(function ContentRenderer({
    content,
    type,
    isDark,
    className,
    metadata
}: ContentRendererProps & { type?: ContentType }) {
    // Detect type if not explicitly provided
    const contentType = type ?? contentTypeRegistry.detectType(content)
    const config = contentTypeRegistry.get(contentType)

    if (!config) {
        // Fallback to plain text
        return <span className={className}>{content}</span>
    }

    const Component = config.component
    const fallback = config.fallback ?? <DefaultLoading />

    return (
        <Suspense fallback={fallback}>
            <Component
                content={content}
                isDark={isDark}
                className={className}
                metadata={metadata}
            />
        </Suspense>
    )
})

// ============================================
// Built-in Content Type Detectors
// ============================================

/** Detect code blocks */
export function isCodeContent(content: string): boolean {
    return content.trim().startsWith('```')
}

/** Detect math blocks */
export function isMathContent(content: string): boolean {
    const trimmed = content.trim()
    return (
        trimmed.startsWith('$$') ||
        trimmed.startsWith('\\[') ||
        /\$[^$\n]+\$/.test(content)
    )
}

/** Detect markdown tables */
export function isTableContent(content: string): boolean {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return false

    // Check for pipe characters and separator row
    const hasPipes = lines[0].includes('|')
    const hasSeparator = lines.length > 1 && /^\|?[\s-:|]+\|?$/.test(lines[1])

    return hasPipes && hasSeparator
}

/** Detect markdown content (has any markdown syntax) */
export function isMarkdownContent(content: string): boolean {
    return (
        /^#{1,6}\s/.test(content) ||                    // Headers
        /\*\*[^*]+\*\*/.test(content) ||                // Bold
        /\*[^*]+\*/.test(content) ||                    // Italic
        /^[-*]\s/.test(content) ||                      // Lists
        /^\d+\.\s/.test(content) ||                     // Numbered lists
        /```/.test(content) ||                          // Code blocks
        /`[^`]+`/.test(content) ||                      // Inline code
        /\[[^\]]+\]\([^)]+\)/.test(content) ||          // Links
        /^>\s/.test(content)                            // Blockquotes
    )
}

// ============================================
// Register default content types
// ============================================

// Lazy load heavy components
const LazyMarkdown = lazy(() =>
    import('@/shared/components/markdown/Markdown').then(m => ({ default: m.Markdown }))
)

// Text renderer (default fallback)
const TextRenderer = memo(function TextRenderer({ content, className }: ContentRendererProps) {
    return <span className={className}>{content}</span>
})

// Markdown wrapper
const MarkdownRenderer = memo(function MarkdownRenderer({ content, className }: ContentRendererProps) {
    return (
        <Suspense fallback={<DefaultLoading />}>
            <LazyMarkdown className={className}>{content}</LazyMarkdown>
        </Suspense>
    )
})

// Register built-in types
contentTypeRegistry.register({
    type: 'text',
    component: TextRenderer,
    priority: 0
})

contentTypeRegistry.register({
    type: 'markdown',
    component: MarkdownRenderer,
    detect: isMarkdownContent,
    priority: 10,
    fallback: <DefaultLoading />
})

// Export utilities
export { DefaultLoading }
