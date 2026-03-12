import * as React from "react"
import { useVoices } from "./hooks/useVoices"

type VoiceContextType = ReturnType<typeof useVoices>

const VoiceContext = React.createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
    const voices = useVoices()
    return (
        <VoiceContext.Provider value={voices}>
            {children}
        </VoiceContext.Provider>
    )
}

export function useVoiceContext() {
    const context = React.useContext(VoiceContext)
    if (!context) {
        throw new Error("useVoiceContext must be used within a VoiceProvider")
    }
    return context
}
