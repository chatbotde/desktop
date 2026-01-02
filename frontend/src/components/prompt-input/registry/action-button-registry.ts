import type { ActionButtonConfig, ActionButtonRegistry } from "../types/action-button"

class ActionButtonRegistryImpl implements ActionButtonRegistry {
  private buttons: Map<string, ActionButtonConfig> = new Map()

  register(config: ActionButtonConfig): void {
    this.buttons.set(config.id, config)
  }

  unregister(id: string): void {
    this.buttons.delete(id)
  }

  getAll(): ActionButtonConfig[] {
    return Array.from(this.buttons.values())
      .filter((config) => config.condition === undefined || config.condition())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  getById(id: string): ActionButtonConfig | undefined {
    return this.buttons.get(id)
  }
}

export const actionButtonRegistry = new ActionButtonRegistryImpl()

