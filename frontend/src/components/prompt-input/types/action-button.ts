import type { ReactNode } from "react"

export interface ActionButtonConfig {
  id: string
  component: ReactNode | (() => ReactNode)
  condition?: () => boolean
  order?: number
}

export interface ActionButtonRegistry {
  register(config: ActionButtonConfig): void
  unregister(id: string): void
  getAll(): ActionButtonConfig[]
  getById(id: string): ActionButtonConfig | undefined
}

