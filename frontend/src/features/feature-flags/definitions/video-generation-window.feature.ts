import { VideoIcon } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "video-generation-window",
  label: "Video Window",
  description: "Show the floating video window when generating videos.",
  icon: VideoIcon,
  defaultEnabled: true,
}
