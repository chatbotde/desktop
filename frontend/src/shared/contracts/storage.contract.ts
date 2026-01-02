/**
 * Storage Service Contract
 * 
 * Defines the interface for storage operations.
 * Allows swapping between localStorage, IndexedDB, or other storage backends.
 * 
 * @example
 * ```ts
 * const storage: IStorageService = serviceContainer.get('storage')
 * await storage.set('key', { data: 'value' })
 * const value = await storage.get<MyType>('key')
 * ```
 */

/**
 * Storage Service Interface
 */
export interface IStorageService {
  /**
   * Get a value from storage
   * @param key Storage key
   * @returns The stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store (must be serializable)
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Delete a value from storage
   * @param key Storage key to delete
   */
  delete(key: string): Promise<void>

  /**
   * Check if a key exists in storage
   * @param key Storage key
   */
  has(key: string): Promise<boolean>

  /**
   * Get all keys in storage
   */
  keys(): Promise<string[]>

  /**
   * Clear all storage
   */
  clear(): Promise<void>

  /**
   * Get the size of stored data (in bytes, approximate)
   */
  size(): Promise<number>
}

