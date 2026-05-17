import { PlaySquare } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
    id: "youtube-player",
    label: "YouTube Video Player",
    description: "Render pasted YouTube links as playable video thumbnails instead of text transcripts.",
    icon: PlaySquare,
    defaultEnabled: true,
}
