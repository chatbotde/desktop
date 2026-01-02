/**
 * LocalStorage Service Implementation
 * 
 * Implements IStorageService using browser localStorage.
 * Can be easily swapped with IndexedDB or other storage backends.
 */

import type { IStorageService } from '../../contracts'

/**
 * LocalStorage Service
 */
export class LocalStorageService implements IStorageService {
  private prefix = 'app_'

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') {
        return null
      }

      const item = localStorage.getItem(this.getKey(key))
      if (item === null) {
        return null
      }

      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Failed to get key "${key}" from storage:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return
      }

      localStorage.setItem(this.getKey(key), JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set key "${key}" in storage:`, error)
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please free up some space.')
      }
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return
      }

      localStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error(`Failed to delete key "${key}" from storage:`, error)
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      return localStorage.getItem(this.getKey(key)) !== null
    } catch {
      return false
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (typeof window === 'undefined') {
        return []
      }

      const allKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          allKeys.push(key.substring(this.prefix.length))
        }
      }
      return allKeys
    } catch {
      return []
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return
      }

      const keys = await this.keys()
      for (const key of keys) {
        await this.delete(key)
      }
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  }

  async size(): Promise<number> {
    try {
      if (typeof window === 'undefined') {
        return 0
      }

      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += value.length
          }
        }
      }
      return totalSize
    } catch {
      return 0
    }
  }
}

