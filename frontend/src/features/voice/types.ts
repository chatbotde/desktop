export interface ClonedVoice {
    id: string
    name: string
    blob: Blob | null
    url?: string // If hosted somewhere or blob URL
    description?: string
    clonedAt: string
}

export type VoiceState = {
    activeVoiceId: string | null
    clonedVoices: ClonedVoice[]
}

export const PRESET_VOICES = [
    { id: "alba", name: "Alba", description: "Soft, clear female voice" },
    { id: "marius", name: "Marius", description: "Deep male voice" },
    { id: "javert", name: "Javert", description: "Authoritative male voice" },
    { id: "jean", name: "Jean", description: "Casual narrator" },
    { id: "fantine", name: "Fantine", description: "Emotional female voice" },
    { id: "cosette", name: "Cosette", description: "Youthful female voice" },
    { id: "eponine", name: "Eponine", description: "Expressive voice" },
    { id: "azelma", name: "Azelma", description: "Balanced tone" },
]
