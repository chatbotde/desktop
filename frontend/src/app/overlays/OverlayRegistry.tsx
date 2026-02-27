'use client'

import { Suspense } from 'react'
import type { ComponentType } from 'react'
import { ANIMATION_REGISTRY } from '@/shared/registry/animationRegistry'
import { GenericLottieOverlay } from './GenericLottieOverlay'

// ── Non-animation overlays (these are NOT in the registry) ────────────────────
import { GlobalAssistantOverlay } from './GlobalAssistantOverlay'
import { TextSelectionOverlay } from './TextSelectionOverlay'
import { RightTransparentOverlay } from './RightTransparentOverlay'
import { OutputMessagesOverlay } from './OutputMessagesOverlay'
import { ExplanationOverlay } from './ExplanationOverlay'
import { AudioRecordingOverlay } from './AudioRecordingOverlay'
import { VideoScrollOverlay } from './VideoScrollOverlay'
import { AreaScreenshotOverlay } from './AreaScreenshotOverlay'
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay'
import { RectangleScreenshotOverlay } from './RectangleScreenshotOverlay'
import { ImageGenerationOverlay } from './ImageGenerationOverlay'
import { PromptInputOverlay } from './PromptInputOverlay'
import { SettingsOverlay } from './SettingsOverlay'
import { CatAssistantOverlay } from './CatAssistantOverlay'

/**
 * Non-animation overlays — manually imported because they are not
 * Lottie animations and don't belong in the animation registry.
 */
const STATIC_OVERLAYS: ComponentType[] = [
    GlobalAssistantOverlay,
    TextSelectionOverlay,
    RightTransparentOverlay,
    OutputMessagesOverlay,
    ExplanationOverlay,
    AudioRecordingOverlay,
    VideoScrollOverlay,
    AreaScreenshotOverlay,
    ScreenshotSelectionOverlay,
    RectangleScreenshotOverlay,
    ImageGenerationOverlay,
    PromptInputOverlay,
    SettingsOverlay,
    CatAssistantOverlay,
]

/**
 * OverlayRegistry — Orchestrates the rendering of ALL overlays.
 *
 * • Static/non-animation overlays are listed in STATIC_OVERLAYS above.
 * • Animation overlays are driven entirely by ANIMATION_REGISTRY:
 *     - "custom" entries render their own component (lazy loaded).
 *     - All other entries are rendered through GenericLottieOverlay.
 *
 * ➡ To add a new Lottie animation, just add an entry in animationRegistry.ts.
 *   Nothing to change here.
 */
export function OverlayRegistry() {
    return (
        <>
            {/* Static / non-animation overlays */}
            {STATIC_OVERLAYS.map((Overlay, index) => (
                <Overlay key={`static-${index}`} />
            ))}

            {/* Animation overlays — auto-generated from registry */}
            {ANIMATION_REGISTRY.map(entry => {
                if (entry.custom && entry.customOverlay) {
                    const CustomOverlay = entry.customOverlay
                    return (
                        <Suspense key={entry.id} fallback={null}>
                            <CustomOverlay />
                        </Suspense>
                    )
                }

                // Generic overlay — config-driven
                return (
                    <GenericLottieOverlay key={entry.id} entry={entry} />
                )
            })}
        </>
    )
}
