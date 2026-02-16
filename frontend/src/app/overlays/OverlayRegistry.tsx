import type { ComponentType } from 'react'
import { GlobalAssistantOverlay } from './GlobalAssistantOverlay'
import { TextSelectionOverlay } from './TextSelectionOverlay'
import { RightTransparentOverlay } from './RightTransparentOverlay'
import { OutputMessagesOverlay } from './OutputMessagesOverlay'
import { ExplanationOverlay } from './ExplanationOverlay'
import { AudioRecordingOverlay } from './AudioRecordingOverlay'
import { VideoScrollOverlay } from './VideoScrollOverlay'
import { AreaScreenshotOverlay } from './AreaScreenshotOverlay'
import { ImageGenerationOverlay } from './ImageGenerationOverlay'
import { PromptInputOverlay } from './PromptInputOverlay'
import { SettingsOverlay } from './SettingsOverlay'

// Type the overlays array as an array of React components
const OVERLAYS: ComponentType[] = [
    GlobalAssistantOverlay,
    TextSelectionOverlay,
    RightTransparentOverlay,
    OutputMessagesOverlay,
    ExplanationOverlay,
    AudioRecordingOverlay,
    VideoScrollOverlay,
    AreaScreenshotOverlay,
    ImageGenerationOverlay,
    PromptInputOverlay,
    SettingsOverlay,
]

/**
 * OverlayRegistry - Orchestrates the rendering of all registered overlays.
 * To add a new feature, simply create its overlay component and add it to the OVERLAYS array.
 */
export function OverlayRegistry() {
    return (
        <>
            {OVERLAYS.map((Overlay, index) => (
                <Overlay key={index} />
            ))}
        </>
    )
}
