/**
 * Universal Plugin Registry
 * 
 * Extensible plugin system for registering and managing plugins.
 * Can be used for: AI providers, UI components, features, actions, etc.
 * 
 * @example
 * ```ts
 * // Register a plugin
 * pluginRegistry.register({
 *   id: 'my-plugin',
 *   name: 'My Plugin',
 *   version: '1.0.0',
 *   priority: 10,
 *   instance: myPluginInstance
 * })
 * 
 * // Get all plugins
 * const plugins = pluginRegistry.getAll()
 * ```
 */

/**
 * Plugin Interface
 * 
 * @template T Plugin instance type
 */
export interface Plugin<T = any> {
  /** Unique plugin identifier */
  id: string
  
  /** Human-readable plugin name */
  name: string
  
  /** Plugin version */
  version: string
  
  /** Priority (lower numbers appear first) */
  priority?: number
  
  /** Whether plugin is enabled */
  enabled?: boolean
  
  /** Plugin metadata */
  metadata?: Record<string, any>
  
  /** Plugin instance */
  instance: T
}

/**
 * Plugin Registry Hooks
 */
export interface PluginRegistryHooks<T = any> {
  onRegister?: (plugin: Plugin<T>) => void
  onUnregister?: (id: string) => void
  onEnable?: (id: string) => void
  onDisable?: (id: string) => void
}

/**
 * Plugin Registry Class
 */
class PluginRegistry<T = any> {
  private plugins = new Map<string, Plugin<T>>()
  private hooks: PluginRegistryHooks<T> = {}

  /**
   * Register a plugin
   */
  register(plugin: Plugin<T>): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin "${plugin.id}" already registered, replacing...`)
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      enabled: plugin.enabled !== false, // Default to enabled
    })

    this.hooks.onRegister?.(plugin)
  }

  /**
   * Unregister a plugin
   */
  unregister(id: string): void {
    if (this.plugins.has(id)) {
      this.plugins.delete(id)
      this.hooks.onUnregister?.(id)
    }
  }

  /**
   * Get a plugin by ID
   */
  get(id: string): Plugin<T> | undefined {
    return this.plugins.get(id)
  }

  /**
   * Get plugin instance by ID
   */
  getInstance(id: string): T | undefined {
    return this.plugins.get(id)?.instance
  }

  /**
   * Get all plugins (sorted by priority, filtered by enabled)
   */
  getAll(): Plugin<T>[] {
    return Array.from(this.plugins.values())
      .filter(p => p.enabled !== false)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  }

  /**
   * Get enabled plugins only
   */
  getEnabled(): Plugin<T>[] {
    return this.getAll().filter(p => p.enabled === true)
  }

  /**
   * Check if plugin is registered
   */
  has(id: string): boolean {
    return this.plugins.has(id)
  }

  /**
   * Enable a plugin
   */
  enable(id: string): void {
    const plugin = this.plugins.get(id)
    if (plugin) {
      plugin.enabled = true
      this.hooks.onEnable?.(id)
    }
  }

  /**
   * Disable a plugin
   */
  disable(id: string): void {
    const plugin = this.plugins.get(id)
    if (plugin) {
      plugin.enabled = false
      this.hooks.onDisable?.(id)
    }
  }

  /**
   * Set registry hooks
   */
  setHooks(hooks: PluginRegistryHooks<T>): void {
    this.hooks = { ...this.hooks, ...hooks }
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size
  }
}

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry()

