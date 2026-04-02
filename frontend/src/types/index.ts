/**
 * Types Module - Global TypeScript definitions
 * 
 * Shared types used across multiple modules.
 * Module-specific types should be defined within their respective modules.
 * 
 * @example
 * import type { APIResponse, User, Config } from '@/types'
 */

// ==================== BASE TYPES ====================
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface APIResponse<T = unknown> {
  data: T
  error: Error | null
  status: number
}

// ==================== USER TYPES ====================
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
}

// ==================== CONFIG TYPES ====================
export interface AppConfig {
  version: string
  environment: 'development' | 'staging' | 'production'
  features: Record<string, boolean>
}

// ==================== UTILITY TYPES ====================
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ==================== EVENT TYPES ====================
export type EventHandler<T = void> = (payload: T) => void
export type Unsubscribe = () => void
