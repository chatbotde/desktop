import type { ReactNode } from 'react'
import { ThemeProvider, FeatureProvider } from '@/shared/providers'
import { FeatureEffects } from '@/features/feature-flags'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * AppProviders - Combines all context providers in the correct order
 * 
 * Provider order (outermost to innermost):
 * 1. ThemeProvider - Theme must be available to all components
 * 2. FeatureProvider - Feature flags control what's rendered
 * 3. FeatureEffects - Side effects based on feature state
 * 
 * @example
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <FeatureProvider>
        <FeatureEffects />
        {children}
      </FeatureProvider>
    </ThemeProvider>
  )
}
