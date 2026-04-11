'use client'

import { Suspense, useState } from 'react'
import type { ComponentType } from 'react'
import { ANIMATION_REGISTRY } from '@/shared/registry/animationRegistry'
import { GenericLottieOverlay } from './GenericLottieOverlay'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { useConfig } from '@/shared/config/config-manager'
import LogoIntro from '@/shared/components/common/logointro'

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

import { PointerOverlay } from './PointerOverlay'

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
    PointerOverlay,
]

/**
 * Guards a custom overlay behind the animation-enabled check.
 * Custom overlay components themselves must NOT contain the
 * isAnimationEnabled check — doing so causes a dangerous `return null`
 * from inside a positioned component which can collapse the Electron window.
 */
function CustomOverlayGuard({ id, children }: { id: string; children: React.ReactNode }) {
    const { isAnimationEnabled } = useAnimations()
    const { animations: globalEnabled } = useConfig('ui')
    if (!globalEnabled || !isAnimationEnabled(id)) return null
    return <>{children}</>
}

/**
 * OverlayRegistry — Orchestrates the rendering of ALL overlays.
 *
 * • LogoIntro plays on startup as a transparent overlay on top of everything.
 *   It unmounts itself once the snap animation completes.
 * • All other overlays render normally and are NOT affected by the intro.
 */
export function OverlayRegistry() {
    const [introComplete, setIntroComplete] = useState(false)

    return (
        <>
            {/* Logo Intro — floats on top, unmounts when done. Does NOT affect other overlays. */}
            {!introComplete && (
                <LogoIntro onComplete={() => setIntroComplete(true)} />
            )}

            {/* Static / non-animation overlays — always rendered */}
            {STATIC_OVERLAYS.map((Overlay, index) => (
                <Overlay key={`static-${index}`} />
            ))}

            {/* Animation overlays — auto-generated from registry */}
            {ANIMATION_REGISTRY.map(entry => {
                if (entry.custom && entry.customOverlay) {
                    const CustomOverlay = entry.customOverlay
                    return (
                        // CustomOverlayGuard checks isAnimationEnabled OUTSIDE the
                        // custom component so the component itself never needs to
                        // guard itself (which can cause window-collapse on toggle).
                        <CustomOverlayGuard key={entry.id} id={entry.id}>
                            <Suspense fallback={null}>
                                <CustomOverlay />
                            </Suspense>
                        </CustomOverlayGuard>
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

