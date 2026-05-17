import { MonitorPlay } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "standalone-youtube-player",
    label: "Standalone Video Player",
    description: "Enable a floating YouTube video player widget anywhere on your screen.",
    icon: MonitorPlay,
    defaultEnabled: true,
}
