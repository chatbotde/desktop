'use client'

import { Suspense, lazy, useState } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { ANIMATION_REGISTRY } from '@/shared/registry/animationRegistry'
import { GenericLottieOverlay } from './GenericLottieOverlay'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { useConfig } from '@/shared/config/config-manager'
import LogoIntro from '@/shared/components/common/logointro'
import { LiveAssistantProvider } from '@/components/assistant-animation/live-assistant-provider'

// ── Core overlays — loaded immediately (lightweight, always needed) ─────────
import { PromptInputOverlay } from './PromptInputOverlay'
import { OutputMessagesOverlay } from './OutputMessagesOverlay'
import { TextSelectionOverlay } from './TextSelectionOverlay'
import { PointerInputOverlay } from './PointerInputOverlay'
import { RightTransparentOverlay } from './RightTransparentOverlay'

// ── Heavy overlays — lazy-loaded to reduce startup memory ─────────────────────
const lazyOverlay = <T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T
) =>
  lazy(() =>
    loader().then((module) => ({
      default: module[exportName] as ComponentType,
    }))
  )

const LAZY_OVERLAYS: LazyExoticComponent<ComponentType>[] = [
  lazyOverlay(() => import('./GlobalAssistantOverlay'), 'GlobalAssistantOverlay'),
  lazyOverlay(() => import('./ExplanationOverlay'), 'ExplanationOverlay'),
  lazyOverlay(() => import('./AudioRecordingOverlay'), 'AudioRecordingOverlay'),
  lazyOverlay(() => import('./VideoScrollOverlay'), 'VideoScrollOverlay'),
  lazyOverlay(() => import('./AreaScreenshotOverlay'), 'AreaScreenshotOverlay'),
  lazyOverlay(() => import('./ScreenshotSelectionOverlay'), 'ScreenshotSelectionOverlay'),
  lazyOverlay(() => import('./RectangleScreenshotOverlay'), 'RectangleScreenshotOverlay'),
  lazyOverlay(() => import('./ImageGenerationOverlay'), 'ImageGenerationOverlay'),
  lazyOverlay(() => import('./VideoGenerationOverlay'), 'VideoGenerationOverlay'),
  lazyOverlay(() => import('./SettingsOverlay'), 'SettingsOverlay'),
  lazyOverlay(() => import('./CatAssistantOverlay'), 'CatAssistantOverlay'),
  lazyOverlay(() => import('./PointerOverlay'), 'PointerOverlay'),
  lazyOverlay(() => import('./YoutubePlayerOverlay'), 'YoutubePlayerOverlay'),
  lazyOverlay(() => import('./RecordedVideoPlayerOverlay'), 'RecordedVideoPlayerOverlay'),
  lazyOverlay(() => import('./RecordedImagePlayerOverlay'), 'RecordedImagePlayerOverlay'),
  lazyOverlay(() => import('./ThreeSceneOverlay'), 'ThreeSceneOverlay'),
]

const CORE_OVERLAYS: ComponentType[] = [
  PromptInputOverlay,
  OutputMessagesOverlay,
  TextSelectionOverlay,
  PointerInputOverlay,
  RightTransparentOverlay,
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
 * • Core overlays load immediately; heavy overlays are code-split and lazy-loaded.
 */
export function OverlayRegistry() {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <LiveAssistantProvider>
      {!introComplete && (
        <LogoIntro onComplete={() => setIntroComplete(true)} />
      )}

      {CORE_OVERLAYS.map((Overlay, index) => (
        <Overlay key={`core-${index}`} />
      ))}

      {LAZY_OVERLAYS.map((Overlay, index) => (
        <Suspense key={`lazy-${index}`} fallback={null}>
          <Overlay />
        </Suspense>
      ))}

      {ANIMATION_REGISTRY.map((entry) => {
        if (entry.custom && entry.customOverlay) {
          const CustomOverlay = entry.customOverlay
          return (
            <CustomOverlayGuard key={entry.id} id={entry.id}>
              <Suspense fallback={null}>
                <CustomOverlay />
              </Suspense>
            </CustomOverlayGuard>
          )
        }

        return <GenericLottieOverlay key={entry.id} entry={entry} />
      })}
    </LiveAssistantProvider>
  )
}
