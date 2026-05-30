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
export { SETTINGS_MENU_ITEMS, SETTINGS_MENU_GROUPS } from './menu'
export type { SettingsSectionId, SettingsMenuItem, SettingsMenuGroup } from './menu'

// Sections
export {
  GeneralSection,
  FeaturesSection,
  AppearanceSection,
  PersonalizationSection,
  AccountSection,
  BlockingSection,
  LocalLLMSection,
  ModelProfileListSection,
  CustomModelsSection,
  HelpSection
} from './sections'
export type { PersonalizationValues } from './sections'
