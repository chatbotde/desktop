import type { FeatureDefinition, FeatureId } from "./types"

export type FeatureModule = {
  feature: FeatureDefinition
}

// Auto-discover all feature definition modules.
// To add a new feature pill: create `src/features/definitions/<name>.feature.ts` exporting `feature`.
const modules = import.meta.glob<FeatureModule>("./definitions/*.feature.ts", {
  eager: true,
})

function stableSortByLabel(a: FeatureDefinition, b: FeatureDefinition) {
  return a.label.localeCompare(b.label)
}

export function getAllFeatureModules(): FeatureModule[] {
  return Object.values(modules)
}

export function getAllFeatures(): FeatureDefinition[] {
  return getAllFeatureModules()
    .map((m) => m.feature)
    .filter(Boolean)
    .slice()
    .sort(stableSortByLabel)
}

export function getFeaturesForList(): FeatureDefinition[] {
  return getAllFeatures().filter((f) => f.showInFeaturesList !== false)
}

export function getDefaultEnabledFeatureIds(): FeatureId[] {
  return getAllFeatures()
    .filter((f) => f.defaultEnabled === true)
    .map((f) => f.id)
}

