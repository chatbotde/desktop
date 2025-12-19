/**
 * Feature Flags Module
 * 
 * Zero-configuration feature registry that automatically discovers
 * and displays features in the UI.
 * 
 * @example
 * import { FeatureEffects, getAllFeatures, type FeatureId } from '@/features/feature-flags'
 */

// Types
export type { FeatureId, FeatureDefinition } from './types'

// Registry functions
export {
  getAllFeatures,
  getAllFeatureModules,
  getFeaturesForList,
  getDefaultEnabledFeatureIds,
} from './registry'

// Effects component
export { FeatureEffects } from './FeatureEffects'
