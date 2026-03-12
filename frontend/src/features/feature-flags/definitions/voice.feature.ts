import { Mic2 } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "voice-cloning",
    label: "Voice Cloning",
    description: "Clone voices from short audio samples for custom TTS",
    icon: Mic2,
    defaultEnabled: true,
}
