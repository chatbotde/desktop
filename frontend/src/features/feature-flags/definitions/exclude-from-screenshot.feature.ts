import { ShieldOff } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "exclude-from-screenshot",
  label: "exclude from screen capture",
  icon: ShieldOff,
  defaultEnabled: false,
}

