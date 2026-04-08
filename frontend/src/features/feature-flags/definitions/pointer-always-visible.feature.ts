import { MousePointer2 } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "pointer-always-visible",
  label: "Always Show Pointer",
  icon: MousePointer2,
  defaultEnabled: false,
}
