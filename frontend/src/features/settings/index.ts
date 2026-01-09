/**
 * Settings Feature
 * 
 * Application settings, preferences, and configuration
 * 
 * @example
 * import { SettingsModal, SettingsSidebar } from '@/features/settings'
 */

// Components
export { 
  SettingsModal,
  SettingsSidebar,
  SettingsCard
} from './components'

// Menu
export { SETTINGS_MENU_ITEMS } from './menu'
export type { SettingsSectionId, SettingsMenuItem } from './menu'

// Sections
export {
  GeneralSection,
  FeaturesSection,
  PersonalizationSection,
  AccountSection,
  BlockingSection,
  LocalLLMSection,
  ModelProfileListSection,
  CustomModelsSection
} from './sections'
export type { PersonalizationValues } from './sections'
