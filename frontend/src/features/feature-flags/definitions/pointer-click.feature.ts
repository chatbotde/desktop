import { MousePointerClick } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "pointer-click",
  label: "Auto-Click After Point",
  description: "Moves the real mouse cursor and clicks when the pointer finds an element.",
  icon: MousePointerClick,
  defaultEnabled: false,
}
