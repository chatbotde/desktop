import { MessageSquareText } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "voice-insert",
  label: "Voice insert",
  description: "Show the AssemblyAI speech-to-text overlay for inserting dictated text",
  icon: MessageSquareText,
  defaultEnabled: false,
}
