import type { ReactNode } from 'react'
import { ThemeProvider, FeatureProvider, AnimationsProvider } from '@/shared/providers'
import { FeatureEffects } from '@/features/feature-flags'
import { VoiceProvider } from '@/features/voice'
import { AuthProvider } from '@/contexts/AuthContext'
import { FilePickerProvider } from '@/components/file-picker'


interface AppProvidersProps {
  children: ReactNode
}

/**
 * AppProviders - Combines all context providers in the correct order
 * 
 * Provider order (outermost to innermost):
 * 1. ThemeProvider - Theme must be available to all components
 * 2. FeatureProvider - Feature flags control what's rendered
 * 3. AuthProvider - Auth and subscription state for all components
 * 4. FeatureEffects - Side effects based on feature state
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
        <AuthProvider>
          <AnimationsProvider>
            <VoiceProvider>
              <FilePickerProvider>
                <FeatureEffects />
                {children}
              </FilePickerProvider>
            </VoiceProvider>
          </AnimationsProvider>
        </AuthProvider>
      </FeatureProvider>
    </ThemeProvider>

  )
}
