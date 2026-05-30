import { MonitorPlay } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "standalone-youtube-player",
    label: "Standalone Video Player",
    description: "Enable a floating YouTube video player widget anywhere on your screen. Toggle this pill to show or hide the player.",
    icon: MonitorPlay,
    defaultEnabled: true,
}
