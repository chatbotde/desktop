import type React from 'react'

/** Shared props for static SVG icons used across the app. */
export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
  /** Shorthand for equal width & height. Falls back to viewBox-native sizing. */
  size?: number | string
}
