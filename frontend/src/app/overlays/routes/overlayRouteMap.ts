import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { OverlayRouteId } from './overlayRouteIds'

function lazyOverlay<T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  exportName: keyof T,
): LazyExoticComponent<ComponentType> {
  return lazy(() =>
    loader().then((module) => ({
      default: module[exportName] as ComponentType,
    })),
  )
}

/**
 * Heavy overlays — loaded only when their route panel is active.
 * Add new route overlays here; keep shell overlays out of this map.
 */
export const OVERLAY_ROUTE_LOADERS: Record<
  OverlayRouteId,
  LazyExoticComponent<ComponentType>
> = {
  settings: lazyOverlay(() => import('../SettingsOverlay'), 'SettingsOverlay'),
  image: lazyOverlay(() => import('../ImageGenerationOverlay'), 'ImageGenerationOverlay'),
  video: lazyOverlay(() => import('../VideoGenerationOverlay'), 'VideoGenerationOverlay'),
  'fact-check': lazyOverlay(() => import('../FactCheckOverlay'), 'FactCheckOverlay'),
  audio: lazyOverlay(() => import('../AudioRecordingOverlay'), 'AudioRecordingOverlay'),
  'video-scroll': lazyOverlay(() => import('../VideoScrollOverlay'), 'VideoScrollOverlay'),
  'area-screenshot': lazyOverlay(
    () => import('../AreaScreenshotOverlay'),
    'AreaScreenshotOverlay',
  ),
  'rectangle-screenshot': lazyOverlay(
    () => import('../RectangleScreenshotOverlay'),
    'RectangleScreenshotOverlay',
  ),
  explanation: lazyOverlay(() => import('../ExplanationOverlay'), 'ExplanationOverlay'),
  manim: lazyOverlay(() => import('../ManimScriptOverlay'), 'ManimScriptOverlay'),
  youtube: lazyOverlay(() => import('../YoutubePlayerOverlay'), 'YoutubePlayerOverlay'),
  'recorded-video': lazyOverlay(
    () => import('../RecordedVideoPlayerOverlay'),
    'RecordedVideoPlayerOverlay',
  ),
  'recorded-image': lazyOverlay(
    () => import('../RecordedImagePlayerOverlay'),
    'RecordedImagePlayerOverlay',
  ),
  'three-scene': lazyOverlay(() => import('../ThreeSceneOverlay'), 'ThreeSceneOverlay'),
}
