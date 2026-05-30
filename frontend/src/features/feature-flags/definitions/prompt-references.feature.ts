import { AtSign } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "prompt-references",
  label: "Add in reference",
  description: "Show the @ reference button in the prompt input to tag integrations and URLs.",
  icon: AtSign,
  defaultEnabled: false,
}
