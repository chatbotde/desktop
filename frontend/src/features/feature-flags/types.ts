import type React from "react"

export type FeatureId = string

export interface FeatureDefinition {
  id: FeatureId
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  /**
   * Used only on first run (when no localStorage exists yet).
   * If omitted, defaults to false.
   */
  defaultEnabled?: boolean
  /**
   * Whether to show as a pill in the Features section UI.
   * If omitted, defaults to true.
   */
  showInFeaturesList?: boolean
}

