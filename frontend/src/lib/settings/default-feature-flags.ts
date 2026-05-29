/**
 * Default Feature Flags Configuration
 * 
 * This file defines which features are enabled by default when the application
 * is first launched (before the user customizes).
 * 
 * Features listed here will be ON by default.
 * Features NOT listed here will be OFF by default.
 * 
 * These defaults are used by feature definitions in:
 * @/features/feature-flags/definitions/*.feature.ts
 */

/**
 * Feature IDs that should be ENABLED by default
 * 
 * Plus Button Dropdown Features:
 * - upload-document: Upload documents (.pdf, .doc, etc)
 * - upload-image: Upload images
 * - quick-screenshot: Take a quick screenshot
 * - upload-video: Upload video files
 * - upload-audio: Upload audio files
 * 
 * Other Features:
 * - clipboard: Clipboard integration
 * - auto-insert: Auto-insert responses
 * - voice-to-prompt: Voice transcription
 * - text-selection: Text selection helper
 * - output-window: Separate output window
 */
export const DEFAULT_ENABLED_FEATURES: string[] = [
    // Only Output Window is enabled by default
    'output-window',         // Output window feature
]

/**
 * Feature IDs that should be DISABLED by default
 * Users can enable these features from the settings after installation
 */
export const DEFAULT_DISABLED_FEATURES: string[] = [
    // Plus Button Dropdown Features (Media Upload Card)
    'upload-document',       // Upload documents
    'upload-image',          // Upload images
    'quick-screenshot',      // Quick screenshot
    'upload-video',          // Upload videos
    'upload-audio',          // Upload audio

    // Core Features
    'clipboard',             // Clipboard integration
    'auto-insert',           // Auto-insert AI responses
    'voice-to-prompt',       // Voice to text transcription
    'voice-insert',          // Voice insert background pill
    'text-selection',        // Text selection helper
    'area-screenshot',       // Circle to ask screenshot
    'video-recording',       // Video recording

    // Advanced/Experimental Features
    'set-capture-area',          // Set auto-capture area (advanced)
    'exclude-from-screenshot',   // Exclude from screenshot (advanced)
    'auto-screenshot',           // Auto-screenshot (advanced/experimental)
    'audio-pill',                // Audio pill (advanced)
]

/**
 * Check if a feature should be enabled by default
 */
export function isDefaultEnabledFeature(featureId: string): boolean {
    return DEFAULT_ENABLED_FEATURES.includes(featureId)
}

/**
 * Get the list of default enabled feature IDs
 */
export function getDefaultEnabledFeatures(): string[] {
    return [...DEFAULT_ENABLED_FEATURES]
}

/**
 * Get the list of default disabled feature IDs
 */
export function getDefaultDisabledFeatures(): string[] {
    return [...DEFAULT_DISABLED_FEATURES]
}
