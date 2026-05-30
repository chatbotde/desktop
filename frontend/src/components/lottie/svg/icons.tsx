/**
 * SVG icon barrel — add new icons directly in this file.
 *
 * Usage:
 *   import { CursorIcon, SvgIcons } from '@/components/lottie/svg/icons'
 *   import { CursorIcon } from '@/components/lottie/svg'
 */

import type React from 'react'
import type { SvgIconProps } from './types'

export type { SvgIconProps } from './types'

/** Cursor brand icon (QuiverAI / Arrow export). */
export const CursorIcon: React.FC<SvgIconProps> = ({
  size,
  width,
  height,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    width={width ?? size ?? 128}
    height={height ?? size ?? 128}
    aria-hidden={props['aria-label'] ? undefined : true}
    {...props}
  >
    <path
      fill="#05B55C"
      d="m114.5 38.6-99.2-37c-2.2-0.8-5.7-0.5-6.1 1.9l-3.1 12.2c-0.3 1-0.1 2.1 0.2 3.1l31.5 91.9c0.4 3.3 0.2 2.5 3.2 3.6l2.1-15.3-33.8-95.4c-0.5-2.2 2.4-3.7 5.4-2.7l100.1 37.6-0.3 0.1z"
    />
    <path
      fill="#08683F"
      d="m9.3 3.5-3.3 12.4c-0.3 1-0.1 2 0.2 3.1l31.4 92c0.7 2.6 0.5 2.4 3.4 3.3l2.1-15.3-33.7-94.8-0.1-0.7z"
    />
    <path
      fill="#05B55C"
      d="m120.8 97.3-33.2-37.5c-0.5-0.6-0.2-0.8 0.4-1.1l27.8-14.9c1.7-1.8 0.1-4.9-1.6-5.4l-99-36.9c-2.5-0.8-6.1-0.3-5.8 2.1 1 4.5 33.2 95.1 33.2 95.1 0.7 2.1 4 2.8 5.8 0.6l17.8-23.5c0.8-1.1 3.6-2.1 4.8-0.8l31.7 36c1.3 1.5 3.7 1.4 5.4 0.1l13.5-9.7c1.1-0.9 0.2-3-0.8-4.1z"
    />
    <path
      fill="#8BF2BA"
      d="m94.7 67.7 16.7-8.4c1.1-0.7 1.8-1.6 2-3.2l3.3-13.3s0 0.5-0.9 1l-27.9 15c-0.4 0.3-0.3 0.6 0.2 1.3l6.6 7.6z"
    />
    <path
      fill="#76EFAF"
      d="m43 99.4-4.1 12.2c-0.5 2 3.7 4.9 7.7 1l15.1-19c0.7-0.8 1.7-1.5 2.6-1.5l3.7-17.6c-0.6 0.2-1.2 0.5-1.7 1.2l-17.9 23.3c-1.6 2-4.4 1.7-5.4 0.4z"
    />
    <path
      fill="#08683F"
      d="m64.2 92.1c0.7 0 1.2 0.3 1.5 0.6l29.8 32.8c1.3 1.3 2 1.6 3.1 1.7l9.1-15.9c-1.6 1.1-3.7 1.1-4.9 0l-31.7-36.2c-0.7-0.8-1.7-0.8-3.1-0.5l-3.8 17.5z"
    />
    <path
      fill="#76EFAF"
      d="m108.8 110.6-8 7c-0.4 0.4-0.7 0.9-0.9 1.5l-2.1 6.1c-0.4 1.3 0.1 2.2 2.5 1.9 1-0.2 1.9-0.7 2.7-1.2l14-9.8c0.6-0.5 1.4-1.3 1.6-2.2l3.3-13-13.1 9.7z"
    />
  </svg>
)

// ── Registry (for dynamic lookup by name) ───────────────────────────────────
export const SvgIcons = {
  cursor: CursorIcon,
} as const

export type SvgIconName = keyof typeof SvgIcons
