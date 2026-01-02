/**
 * Repository Pattern Contract
 * 
 * Defines the interface for data access operations.
 * Allows swapping between different storage backends without changing business logic.
 * 
 * @example
 * ```ts
 * class MessageRepository implements IRepository<Message> {
 *   async findById(id: string): Promise<Message | null> {
 *     // Implementation
 *   }
 * }
 * ```
 */

/**
 * Repository Interface
 * 
 * @template T Entity type
 * @template ID ID type (defaults to string)
 */
export interface IRepository<T, ID = string> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>

  /**
   * Find entities matching criteria
   */
  find(criteria: Partial<T>): Promise<T[]>

  /**
   * Create a new entity
   */
  create(entity: Omit<T, 'id'>): Promise<T>

  /**
   * Update an existing entity
   */
  update(id: ID, updates: Partial<T>): Promise<T>

  /**
   * Delete an entity
   */
  delete(id: ID): Promise<void>

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<boolean>

  /**
   * Count entities
   */
  count(): Promise<number>
}

/**
 * Base repository implementation with common functionality
 */
export abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>
  abstract findAll(): Promise<T[]>
  abstract find(criteria: Partial<T>): Promise<T[]>
  abstract create(entity: Omit<T, 'id'>): Promise<T>
  abstract update(id: ID, updates: Partial<T>): Promise<T>
  abstract delete(id: ID): Promise<void>

  async exists(id: ID): Promise<boolean> {
    const entity = await this.findById(id)
    return entity !== null
  }

  async count(): Promise<number> {
    const all = await this.findAll()
    return all.length
  }
}

