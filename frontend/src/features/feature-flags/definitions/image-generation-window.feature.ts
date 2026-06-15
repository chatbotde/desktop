import { ImageIcon } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "image-generation-window",
  label: "Image Window",
  description: "Show the floating image window when generating images.",
  icon: ImageIcon,
  defaultEnabled: true,
}
