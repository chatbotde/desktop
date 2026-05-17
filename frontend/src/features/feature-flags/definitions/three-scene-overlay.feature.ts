import { User } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "three-scene-overlay",
    label: "3D Avatar Overlay",
    description: "Enable the 3D walking character overlay.",
    icon: User,
    defaultEnabled: true,
}
