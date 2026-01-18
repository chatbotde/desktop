import { Mic } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "voice-to-prompt",
  label: "voice to prompt",
  description: "Record voice, transcribe to text, and insert AI response directly into any application",
  icon: Mic,
  defaultEnabled: true,
}
