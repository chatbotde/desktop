import { Mic } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "audio-pill",
  label: "Audio Pill",
  description: "Show audio recorder pill UI for voice input",
  icon: Mic,
  defaultEnabled: false,
}


