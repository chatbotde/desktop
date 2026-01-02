/**
 * Configuration Manager
 * 
 * Centralized configuration management with persistence and reactivity.
 * Supports environment-specific configs and runtime updates.
 * 
 * @example
 * ```ts
 * // Get config
 * const aiConfig = configManager.get('ai')
 * 
 * // Update config
 * configManager.set('ai', { ...aiConfig, timeout: 60000 })
 * 
 * // Subscribe to changes
 * const unsubscribe = configManager.subscribe((config) => {
 *   console.log('Config changed:', config)
 * })
 * ```
 */

import React from 'react'

/**
 * Application Configuration Interface
 */
export interface AppConfig {
  ai: {
    defaultProvider: string
    timeout: number
    retries: number
    enableUsageTracking: boolean
  }
  features: {
    [key: string]: boolean
  }
  ui: {
    theme: 'light' | 'dark' | 'system'
    animations: boolean
    compactMode: boolean
  }
  storage: {
    provider: 'localStorage' | 'indexedDB' | 'memory'
    maxSize: number // in MB
  }
  audio: {
    defaultTranscriptionService: 'assemblyai' | 'whisper'
    sampleRate: number
  }
  capture: {
    defaultFormat: 'png' | 'jpeg'
    quality: number
    autoSave: boolean
  }
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  ai: {
    defaultProvider: 'openai',
    timeout: 30000,
    retries: 3,
    enableUsageTracking: true,
  },
  features: {},
  ui: {
    theme: 'system',
    animations: true,
    compactMode: false,
  },
  storage: {
    provider: 'localStorage',
    maxSize: 10,
  },
  audio: {
    defaultTranscriptionService: 'assemblyai',
    sampleRate: 16000,
  },
  capture: {
    defaultFormat: 'png',
    quality: 0.9,
    autoSave: false,
  },
}

/**
 * Configuration Manager Class
 */
class ConfigManager {
  private config: AppConfig
  private listeners = new Set<(config: AppConfig) => void>()
  private storageKey = 'app-config'

  constructor(defaultConfig: AppConfig = DEFAULT_CONFIG) {
    this.config = this.loadConfig(defaultConfig)
  }

  /**
   * Get a configuration section
   * 
   * @param key Configuration key
   * @returns Configuration section
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key]
  }

  /**
   * Get nested configuration value
   * 
   * @param key Configuration key
   * @param nestedKey Nested key
   * @returns Nested configuration value
   */
  getNested<K extends keyof AppConfig, NK extends keyof AppConfig[K]>(
    key: K,
    nestedKey: NK
  ): AppConfig[K][NK] {
    return this.config[key][nestedKey]
  }

  /**
   * Set a configuration section
   * 
   * @param key Configuration key
   * @param value Configuration value
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value
    this.saveConfig()
    this.notifyListeners()
  }

  /**
   * Update nested configuration value
   * 
   * @param key Configuration key
   * @param nestedKey Nested key
   * @param value Nested value
   */
  setNested<K extends keyof AppConfig, NK extends keyof AppConfig[K]>(
    key: K,
    nestedKey: NK,
    value: AppConfig[K][NK]
  ): void {
    this.config[key] = {
      ...this.config[key],
      [nestedKey]: value,
    }
    this.saveConfig()
    this.notifyListeners()
  }

  /**
   * Merge configuration (partial update)
   * 
   * @param updates Partial configuration updates
   */
  merge(updates: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    }
    this.saveConfig()
    this.notifyListeners()
  }

  /**
   * Subscribe to configuration changes
   * 
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribe(callback: (config: AppConfig) => void): () => void {
    this.listeners.add(callback)
    
    // Immediately call with current config
    callback(this.config)
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.saveConfig()
    this.notifyListeners()
  }

  /**
   * Get full configuration
   */
  getAll(): AppConfig {
    return { ...this.config }
  }

  /**
   * Load configuration from storage
   */
  private loadConfig(defaultConfig: AppConfig): AppConfig {
    try {
      if (typeof window === 'undefined') {
        return defaultConfig
      }

      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new config keys
        return this.deepMerge(defaultConfig, parsed)
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error)
    }

    return defaultConfig
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config))
      }
    } catch (error) {
      console.error('Failed to save config to storage:', error)
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.config)
      } catch (error) {
        console.error('Error in config listener:', error)
      }
    })
  }

  /**
   * Deep merge objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key], source[key] as any)
      } else {
        output[key] = source[key] as any
      }
    }
    
    return output
  }
}

/**
 * Global configuration manager instance
 */
export const configManager = new ConfigManager()

/**
 * React hook for accessing configuration
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const aiConfig = useConfig('ai')
 *   
 *   return <div>Timeout: {aiConfig.timeout}ms</div>
 * }
 * ```
 */
export function useConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  const [config, setConfig] = React.useState<AppConfig[K]>(() => 
    configManager.get(key)
  )

  React.useEffect(() => {
    return configManager.subscribe((fullConfig) => {
      setConfig(fullConfig[key])
    })
  }, [key])

  return config
}

