/**
 * Shared Providers
 * 
 * Global context providers
 * 
 * @example
 * import { useTheme, useFeature, useToast } from '@/shared/providers'
 */

export {
  ThemeProvider,
  useTheme,
  useIsDark,
  useThemeClass,
  type Theme,
  type ThemeConfig,
  AVAILABLE_THEMES,
  THEME_CONFIG
} from './ThemeProvider'
export { FeatureProvider, useFeature } from './FeatureProvider'
export { ToastProvider, useToast } from './ToastProvider'
export { AnimationsProvider, useAnimations, type AnimationId } from './AnimationsProvider'
