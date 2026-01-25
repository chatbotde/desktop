/**
 * Text Selection Feature
 * 
 * Text selection popup and actions
 * 
 * @example
 * import { TextSelectionPopup, useTextSelectionActions } from '@/features/text-selection'
 */

// Components
export {
  TextSelectionPopup,
  TextSelectionInput,
  TextSelectionOutput
} from './components'
export type { TextSelectionInputProps, TextSelectionOutputProps } from './components'

// Hooks
export { useTextSelectionActions } from './hooks'
