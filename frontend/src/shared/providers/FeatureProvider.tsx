import { createContext, useContext, useState, useSyncExternalStore, useCallback, type ReactNode } from 'react'
import type { FeatureId } from '@/features/feature-flags'
import { getDefaultEnabledFeatureIds } from '@/features/feature-flags'

const FEATURE_MIGRATIONS_KEY = 'feature-flag-migrations'

/** One-time migrations that enable new default features for existing users. */
const FEATURE_MIGRATIONS: Array<{ id: string; featureId: FeatureId }> = [
  { id: '2025-06-video-generation-window', featureId: 'video-generation-window' },
]

function loadEnabledFeatures(): Set<FeatureId> {
  const defaults = getDefaultEnabledFeatureIds()
  const saved = localStorage.getItem('enabled-features')

  let enabled: Set<FeatureId>
  if (saved) {
    try {
      enabled = new Set(JSON.parse(saved) as FeatureId[])
    } catch (e) {
      console.error('Failed to parse enabled features', e)
      enabled = new Set(defaults)
    }
  } else {
    enabled = new Set(defaults)
  }

  const applied = new Set<string>(
    JSON.parse(localStorage.getItem(FEATURE_MIGRATIONS_KEY) ?? '[]') as string[]
  )
  let migrationsChanged = false

  for (const { id, featureId } of FEATURE_MIGRATIONS) {
    if (!applied.has(id)) {
      enabled.add(featureId)
      applied.add(id)
      migrationsChanged = true
    }
  }

  if (migrationsChanged) {
    localStorage.setItem(FEATURE_MIGRATIONS_KEY, JSON.stringify([...applied]))
    localStorage.setItem('enabled-features', JSON.stringify([...enabled]))
  }

  return enabled
}

interface FeatureContextType {
  enabledFeatures: Set<FeatureId>
  isFeatureEnabled: (featureId: FeatureId) => boolean
  toggleFeature: (featureId: FeatureId) => void
  setFeatureEnabled: (featureId: FeatureId, enabled: boolean) => void
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined)

export function FeatureProvider({ children }: { children: ReactNode }) {
  // Initialize features from localStorage or default to enabled
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureId>>(() => loadEnabledFeatures())

  // Update localStorage when features change - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      localStorage.setItem('enabled-features', JSON.stringify(Array.from(enabledFeatures)))
      return () => {}
    }, [enabledFeatures]),
    () => null,
    () => null
  )

  const isFeatureEnabled = (featureId: FeatureId): boolean => {
    return enabledFeatures.has(featureId)
  }

  const toggleFeature = (featureId: FeatureId) => {
    setEnabledFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(featureId)) {
        newSet.delete(featureId)
      } else {
        newSet.add(featureId)
      }
      return newSet
    })
  }

  const setFeatureEnabled = (featureId: FeatureId, enabled: boolean) => {
    setEnabledFeatures(prev => {
      const newSet = new Set(prev)
      if (enabled) {
        newSet.add(featureId)
      } else {
        newSet.delete(featureId)
      }
      return newSet
    })
  }

  return (
    <FeatureContext.Provider value={{ enabledFeatures, isFeatureEnabled, toggleFeature, setFeatureEnabled }}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeature() {
  const context = useContext(FeatureContext)
  if (context === undefined) {
    throw new Error('useFeature must be used within a FeatureProvider')
  }
  return context
}
