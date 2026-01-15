/**
 * Output Window Registry
 * 
 * Re-exports for the content type registry system.
 * This enables extensible message rendering with different UI for different content types.
 */

export {
    contentTypeRegistry,
    ContentRenderer,
    DefaultLoading,
    // Type detectors
    isCodeContent,
    isMathContent,
    isTableContent,
    isMarkdownContent,
    // Types
    type ContentType,
    type ContentRendererProps,
    type ContentTypeConfig,
} from './content-type-registry'
