export type {
  FactCheckProgress,
  FactCheckResult,
  FactCheckSource,
  FactCheckStage,
  FactCheckVerdict,
} from './fact-check-types'

export {
  isFactCheckConfigured,
  runFactCheckPipeline,
  transcribeAudioAttachment,
} from './fact-check-service'

export { openExternalUrl } from './open-external-url'
