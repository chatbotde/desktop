/**
 * Overlay route IDs — URL panel tokens under `#/o/{id}+{id}`.
 * Multiple panels can be open at once (stacked overlays).
 */
export const OVERLAY_ROUTE_IDS = [
  'settings',
  'image',
  'video',
  'fact-check',
  'audio',
  'video-scroll',
  'area-screenshot',
  'rectangle-screenshot',
  'explanation',
  'manim',
  'youtube',
  'recorded-video',
  'recorded-image',
  'three-scene',
] as const

export type OverlayRouteId = (typeof OVERLAY_ROUTE_IDS)[number]

const ID_SET = new Set<string>(OVERLAY_ROUTE_IDS)

export function isOverlayRouteId(value: string): value is OverlayRouteId {
  return ID_SET.has(value)
}

/** Parse `#/o/settings+image` panel list → ordered unique IDs */
export function parseOverlayPanelList(panelList?: string | null): OverlayRouteId[] {
  if (!panelList?.trim()) return []
  const seen = new Set<OverlayRouteId>()
  const result: OverlayRouteId[] = []
  for (const raw of panelList.split('+')) {
    const id = raw.trim()
    if (!isOverlayRouteId(id) || seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

export function serializeOverlayPanelList(ids: Iterable<OverlayRouteId>): string {
  return [...new Set(ids)].join('+')
}

export function overlayPath(ids: Iterable<OverlayRouteId>): string {
  const list = serializeOverlayPanelList(ids)
  return list ? `/o/${list}` : '/o'
}
