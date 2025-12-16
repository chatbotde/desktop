import { Mic } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "upload-audio",
    label: "Upload Audio",
    icon: Mic,
    defaultEnabled: true,
}
