import { useState, useSyncExternalStore, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import type { ClonedVoice } from "../types"
import { PRESET_VOICES } from "../types"
import { convertToWav } from "../utils/audioConverter"

const VOICES_METADATA_KEY = "sonic-cloned-voices-meta"

export function useVoices() {
    const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([])
    const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null)

    // Storage for local paths
    const [voicePaths, setVoicePaths] = useState<Record<string, string>>({})

    // Load voices from localStorage on mount - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const init = async () => {
                const savedMeta = localStorage.getItem(VOICES_METADATA_KEY)
                if (savedMeta) {
                    try {
                        const voices = JSON.parse(savedMeta) as ClonedVoice[]
                        setClonedVoices(voices)

                        const paths: Record<string, string> = {}
                        for (const v of voices) {
                            try {
                                const userData = await (window as any).electronAPI.app.getPath('userData')
                                const voicePath = `${userData}/voices/${v.id}.wav`
                                if (await (window as any).fileAPI.exists(voicePath)) {
                                    paths[v.id] = voicePath
                                }
                            } catch (err) {
                                console.error(`Failed to verify voice path for ${v.id}`, err)
                            }
                        }
                        setVoicePaths(paths)
                    } catch (e) {
                        console.error("Failed to parse saved voices", e)
                    }
                }

                const savedActiveId = localStorage.getItem("sonic-active-voice-id")
                if (savedActiveId) {
                    setActiveVoiceId(savedActiveId)
                } else {
                    setActiveVoiceId(PRESET_VOICES[0].id)
                }
            }

            init()
            return () => {}
        }, []),
        () => null,
        () => null
    )

    const saveVoices = useCallback((voices: ClonedVoice[]) => {
        setClonedVoices(voices)
        // Ensure we don't save binary data to metadata
        const metaOnly = voices.map(v => ({ ...v, blob: null }))
        localStorage.setItem(VOICES_METADATA_KEY, JSON.stringify(metaOnly))
    }, [])

    const addVoice = useCallback(async (blob: Blob, name: string) => {
        const id = uuidv4()
        console.log(`[useVoices] Starting voice clone save for: ${name} (id: ${id})`)

        if (!blob || blob.size === 0) {
            console.error("[useVoices] Error: Received empty audio blob")
            return false
        }

        try {
            // 1. Convert Webm blob to WAV 
            const wavBlob = await convertToWav(blob)
            console.log(`[useVoices] Created WAV blob: ${wavBlob.size} bytes`)

            // 2. Convert WAV blob to base64
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(wavBlob)
            })
            const base64 = await base64Promise

            // 3. Save to filesystem
            let userData: string;
            try {
                userData = await (window as any).electronAPI.app.getPath('userData')
            } catch (e) {
                console.warn("[useVoices] Could not get userData path, falling back...", e)
                userData = "."
            }

            const voiceDir = `${userData}/voices`.replace(/\\/g, '/')
            const voicePath = `${voiceDir}/${id}.wav`

            console.log(`[useVoices] Saving to: ${voicePath}`)

            const writeResult = await (window as any).fileAPI.writeFileBinary(voicePath, base64)

            if (writeResult && writeResult.success === false) {
                throw new Error(writeResult.error || "File system write failed")
            }

            // 4. Update state and Metadata
            const newVoice: ClonedVoice = {
                id,
                name,
                blob: null,
                clonedAt: new Date().toISOString(),
                description: "Custom cloned voice"
            }

            const updatedVoices = [...clonedVoices, newVoice]
            setClonedVoices(updatedVoices)

            // Persist metadata
            const metaOnly = updatedVoices.map(v => ({ ...v, blob: null }))
            localStorage.setItem(VOICES_METADATA_KEY, JSON.stringify(metaOnly))

            setVoicePaths(prev => ({ ...prev, [id]: voicePath }))

            setActiveVoiceId(id)
            localStorage.setItem("sonic-active-voice-id", id)

            console.log(`[useVoices] Successfully saved voice: ${name}`)
            return true
        } catch (err) {
            console.error("[useVoices] FATAL ERROR during voice save:", err)
            throw err // Re-throw to caller
        }
    }, [clonedVoices]) // Add dependencies

    const removeVoice = useCallback((id: string) => {
        const updated = clonedVoices.filter(v => v.id !== id)
        saveVoices(updated)

        if (activeVoiceId === id) {
            const firstPreset = PRESET_VOICES[0].id
            setActiveVoiceId(firstPreset)
            localStorage.setItem("sonic-active-voice-id", firstPreset)
        }

        setVoicePaths(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }, [clonedVoices, activeVoiceId, saveVoices])

    const selectVoice = useCallback((id: string) => {
        setActiveVoiceId(id)
        localStorage.setItem("sonic-active-voice-id", id)
    }, [])

    const getVoicePath = useCallback((id: string) => {
        return voicePaths[id] || null
    }, [voicePaths])

    return {
        clonedVoices,
        activeVoiceId,
        addVoice,
        removeVoice,
        selectVoice,
        getVoicePath,
        presetVoices: PRESET_VOICES
    }
}

