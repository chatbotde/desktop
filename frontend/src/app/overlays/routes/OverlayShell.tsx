'use client'

import { Suspense, lazy, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { ANIMATION_REGISTRY } from '@/shared/registry/animationRegistry'
import { GenericLottieOverlay } from '../GenericLottieOverlay'
import { useAnimations } from '@/shared/providers/AnimationsProvider'
import { useConfig } from '@/shared/config/config-manager'
import LogoIntro from '@/shared/components/common/logointro'
import { LiveAssistantProvider } from '@/components/assistant-animation/live-assistant-provider'
import { OverlayErrorBoundary } from '../OverlayErrorBoundary'
import { OverlayRouteOutlet } from './OverlayRouteOutlet'
import { UiStateOverlayBridge } from './bridges/UiStateOverlayBridge'
import { EventOverlayBridge } from './bridges/EventOverlayBridge'
import { FeatureFlagOverlayBridge } from './bridges/FeatureFlagOverlayBridge'

// ── Core shell — always mounted (lightweight, required for clickthrough UX) ──
import { PromptInputOverlay } from '../PromptInputOverlay'
import { OutputMessagesOverlay } from '../OutputMessagesOverlay'
import { TextSelectionOverlay } from '../TextSelectionOverlay'
import { PointerInputOverlay } from '../PointerInputOverlay'
import { RightTransparentOverlay } from '../RightTransparentOverlay'
import { GlobalAssistantOverlay } from '../GlobalAssistantOverlay'
import { InsertPinOverlay } from '../InsertPinOverlay'

const lazyNamed = <T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T,
): LazyExoticComponent<ComponentType> =>
  lazy(() =>
    loader().then((module) => ({
      default: module[exportName] as ComponentType,
    })),
  )

/** Always-needed listeners that stay out of the URL hash */
const SHELL_AMBIENT: Array<{ id: string; Overlay: LazyExoticComponent<ComponentType> }> = [
  {
    id: 'screenshot-selection',
    Overlay: lazyNamed(() => import('../ScreenshotSelectionOverlay'), 'ScreenshotSelectionOverlay'),
  },
  {
    id: 'cat-assistant',
    Overlay: lazyNamed(() => import('../CatAssistantOverlay'), 'CatAssistantOverlay'),
  },
  {
    id: 'pointer',
    Overlay: lazyNamed(() => import('../PointerOverlay'), 'PointerOverlay'),
  },
]

const CORE_OVERLAYS: Array<{ id: string; Overlay: ComponentType }> = [
  { id: 'prompt-input', Overlay: PromptInputOverlay },
  { id: 'output-messages', Overlay: OutputMessagesOverlay },
  { id: 'text-selection', Overlay: TextSelectionOverlay },
  { id: 'pointer-input', Overlay: PointerInputOverlay },
  { id: 'right-transparent', Overlay: RightTransparentOverlay },
  { id: 'global-assistant', Overlay: GlobalAssistantOverlay },
]

function CustomOverlayGuard({ id, children }: { id: string; children: React.ReactNode }) {
  const { isAnimationEnabled } = useAnimations()
  const { animations: globalEnabled } = useConfig('ui')
  if (!globalEnabled || !isAnimationEnabled(id)) return null
  return <>{children}</>
}

/**
 * App shell + URL-driven overlay outlet.
 *
 * • Core overlays stay mounted (prompt, output, selection, …).
 * • Heavy panels mount only when listed in `#/o/{id}+{id}` (see bridges).
 * • Each overlay is wrapped in an error boundary so one crash cannot blank the app.
 */
export function OverlayShell() {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <LiveAssistantProvider>
      <UiStateOverlayBridge />
      <EventOverlayBridge />
      <FeatureFlagOverlayBridge />

      {!introComplete && (
        <LogoIntro onComplete={() => setIntroComplete(true)} />
      )}

      {CORE_OVERLAYS.map(({ id, Overlay }) => (
        <OverlayErrorBoundary key={id} overlayId={id}>
          <Overlay />
        </OverlayErrorBoundary>
      ))}

      <OverlayErrorBoundary overlayId="insert-pin">
        <InsertPinOverlay />
      </OverlayErrorBoundary>

      {SHELL_AMBIENT.map(({ id, Overlay }) => (
        <OverlayErrorBoundary key={id} overlayId={id}>
          <Suspense fallback={null}>
            <Overlay />
          </Suspense>
        </OverlayErrorBoundary>
      ))}

      <OverlayRouteOutlet />

      {ANIMATION_REGISTRY.map((entry) => {
        if (entry.custom && entry.customOverlay) {
          const CustomOverlay = entry.customOverlay
          return (
            <CustomOverlayGuard key={entry.id} id={entry.id}>
              <OverlayErrorBoundary overlayId={`animation:${entry.id}`}>
                <Suspense fallback={null}>
                  <CustomOverlay />
                </Suspense>
              </OverlayErrorBoundary>
            </CustomOverlayGuard>
          )
        }

        return (
          <OverlayErrorBoundary key={entry.id} overlayId={`animation:${entry.id}`}>
            <GenericLottieOverlay entry={entry} />
          </OverlayErrorBoundary>
        )
      })}
    </LiveAssistantProvider>
  )
}
