export const VIEWPORT_PADDING = 16

export const POPUP_ESTIMATED_SIZE = {
  pill: { width: 260, height: 64 },
  pillWithTryOn: { width: 340, height: 64 },
  expanded: { width: 320, height: 400 },
  tryOn: { width: 320, height: 500 },
} as const

export function getPopupEstimatedSize(options: {
  isExpanded: boolean
  isTryOnMode: boolean
  hasTryOnAction: boolean
}): { width: number; height: number } {
  if (options.isTryOnMode) return POPUP_ESTIMATED_SIZE.tryOn
  if (options.isExpanded) return POPUP_ESTIMATED_SIZE.expanded
  if (options.hasTryOnAction) return POPUP_ESTIMATED_SIZE.pillWithTryOn
  return POPUP_ESTIMATED_SIZE.pill
}

export function clampPopupPosition(
  pos: { top: number; left: number },
  size: { width: number; height: number }
): { top: number; left: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const padding = VIEWPORT_PADDING

  return {
    top: Math.max(padding, Math.min(pos.top, viewportHeight - size.height - padding)),
    left: Math.max(padding, Math.min(pos.left, viewportWidth - size.width - padding)),
  }
}

export function centerPopupPosition(size: { width: number; height: number }): {
  top: number
  left: number
} {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  return clampPopupPosition(
    {
      top: Math.round((viewportHeight - size.height) / 2),
      left: Math.round((viewportWidth - size.width) / 2),
    },
    size
  )
}

export function positionNearCapture(
  capturePos: { x: number; y: number },
  size: { width: number; height: number }
): { top: number; left: number } {
  const offset = 15
  let top = capturePos.y + offset
  let left = capturePos.x - size.width / 2

  if (top + size.height > window.innerHeight - VIEWPORT_PADDING) {
    top = capturePos.y - size.height - offset
  }

  return clampPopupPosition({ top, left }, size)
}
