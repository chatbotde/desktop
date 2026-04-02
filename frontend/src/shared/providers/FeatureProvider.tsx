import { createContext, useContext, useState, useSyncExternalStore, useCallback, type ReactNode } from 'react'
import type { FeatureId } from '@/features/feature-flags'
import { getDefaultEnabledFeatureIds } from '@/features/feature-flags'

interface FeatureContextType {
  enabledFeatures: Set<FeatureId>
  isFeatureEnabled: (featureId: FeatureId) => boolean
  toggleFeature: (featureId: FeatureId) => void
  setFeatureEnabled: (featureId: FeatureId, enabled: boolean) => void
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined)

export function FeatureProvider({ children }: { children: ReactNode }) {
  // Initialize features from localStorage or default to enabled
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureId>>(() => {
    const saved = localStorage.getItem('enabled-features')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse enabled features', e)
      }
    }
    // Default: enable features marked as defaultEnabled in the registry
    return new Set(getDefaultEnabledFeatureIds())
  })

  // Update localStorage when features change - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
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
