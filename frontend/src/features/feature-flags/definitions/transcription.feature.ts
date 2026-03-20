import { Type } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "transcription",
  label: "Auto Transcription",
  description: "Live speech-to-text with auto-insertion capabilities",
  icon: Type,
  defaultEnabled: false,
}
