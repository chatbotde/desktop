import * as React from "react"
import { useSyncExternalStore, useCallback } from "react"
import { Mic, Square, Play, Trash2, Check, AudioLines, Sparkles } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"


import { useAudioRecorder } from "@/features/audio/hooks/useAudioRecorder"
import { AudioSourceSelector } from "@/features/audio/components/AudioSourceSelector"
import type { AudioSourceType } from "@/features/audio/hooks/useAudioRecorder"
import { convertToWav } from "../utils/audioConverter"

interface VoiceRecorderProps {
    onVoiceCaptured: (blob: Blob, name: string) => void
    isDarkTheme?: boolean
}

export function VoiceRecorder({ onVoiceCaptured, isDarkTheme = true }: VoiceRecorderProps) {
    const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null)
    const [voiceName, setVoiceName] = React.useState("")
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [audioSource, setAudioSource] = React.useState<AudioSourceType>('both')
    const [isTesting, setIsTesting] = React.useState(false)
    const [testAudioUrl, setTestAudioUrl] = React.useState<string | null>(null)
    const [testText, setTestText] = React.useState("This is a test of my newly cloned voice. Everything seems to be working perfectly!")
    const [testError, setTestError] = React.useState<string | null>(null)

    const audioRef = React.useRef<HTMLAudioElement | null>(null)

    const {
        isRecording,
        duration: recordingTime,
        startRecording: startAudioRecorder,
        stopRecording: stopAudioRecorder,
        cleanup
    } = useAudioRecorder({
        onRecordingComplete: (blob) => setRecordedBlob(blob)
    })

    // Cleanup on unmount using syncExternalStore pattern
    useSyncExternalStore(
        useCallback(() => {
            return () => {
                cleanup().catch(console.error)
            }
        }, [cleanup]),
        () => null,
        () => null
    )

    const startRecording = async () => {
        try {
            await startAudioRecorder(audioSource)
        } catch (err) {
            console.error("Failed to start recording:", err)
        }
    }

    const stopRecording = () => {
        stopAudioRecorder()
    }

    const handlePlay = () => {
        if (!recordedBlob) return
        if (isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
            return
        }

        const url = URL.createObjectURL(recordedBlob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => setIsPlaying(false)
        audio.play()
        setIsPlaying(true)
    }

    const [isSaving, setIsSaving] = React.useState(false)

    const handleSave = async () => {
        if (recordedBlob && voiceName.trim()) {
            setIsSaving(true)
            try {
                await onVoiceCaptured(recordedBlob, voiceName.trim())
            } finally {
                setIsSaving(false)
                setRecordedBlob(null)
                setVoiceName("")
            }
        }
    }

    const handleTestClone = async () => {
        if (!recordedBlob) return
        setIsTesting(true)
        setTestError(null)
        console.log("[VoiceRecorder] Starting test clone with blob size:", recordedBlob.size)

        try {
            // 1. Convert to WAV
            const wavBlob = await convertToWav(recordedBlob)
            console.log("[VoiceRecorder] WAV conversion complete, size:", wavBlob.size)

            // 2. Prepare Form Data
            const formData = new FormData()
            formData.append('text', testText)
            formData.append('voice_wav', wavBlob, 'test_clone.wav')

            // 3. Call backend
            console.log("[VoiceRecorder] Sending request through proxy /api/tts...")
            const response = await fetch('/api/tts', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: "Server error" }))
                throw new Error(errData.detail || `Server error: ${response.status}`)
            }

            // 4. Play result
            const resultBlob = await response.blob()
            console.log("[VoiceRecorder] Received TTS result, size:", resultBlob.size)

            const url = URL.createObjectURL(resultBlob)
            if (testAudioUrl) URL.revokeObjectURL(testAudioUrl)
            setTestAudioUrl(url)

            const audio = new Audio(url)
            audio.play().catch(e => {
                console.error("[VoiceRecorder] Audio playback failed:", e)
                setTestError("Playback failed")
            })
        } catch (err: any) {
            console.error("[VoiceRecorder] Failed to test clone:", err)
            setTestError(err.message || "Failed to reach AI server")
        } finally {
            setIsTesting(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all duration-300",
            isDarkTheme ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
        )}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                    "p-2 rounded-lg",
                    isDarkTheme ? "bg-zinc-800" : "bg-zinc-100"
                )}>
                    <AudioLines className={cn("h-5 w-5", isRecording ? "text-red-500 animate-pulse" : "text-blue-500")} />

                </div>
                <div>
                    <h3 className={cn("text-sm font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                        Clone your voice
                    </h3>
                    <p className={cn("text-xs", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
                        Record 5-10 seconds of clear speech
                    </p>
                </div>
            </div>

            {!recordedBlob ? (
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className={cn(
                        "text-2xl font-mono",
                        isRecording ? (isDarkTheme ? "text-white" : "text-zinc-900") : "text-zinc-500"
                    )}>
                        {formatTime(recordingTime)}
                    </div>

                    <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            "h-16 w-16 rounded-full shadow-lg transition-all duration-300",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {isRecording ? <Square className="h-6 w-6 fill-white" /> : <Mic className="h-6 w-6" />}
                    </Button>

                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                        {isRecording ? "Tap to stop" : "Tap to record"}
                    </p>

                    {!isRecording && (
                        <div className="flex items-center gap-2 mt-2 bg-black/5 dark:bg-white/5 rounded-full p-1">
                            <AudioSourceSelector
                                source={audioSource}
                                onSourceClick={setAudioSource}
                                isDarkTheme={isDarkTheme}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={cn(
                        "p-3 rounded-lg flex items-center justify-between",
                        isDarkTheme ? "bg-zinc-800" : "bg-zinc-100"
                    )}>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePlay}
                                className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                            >
                                {isPlaying ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                            </Button>
                            <span className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-300" : "text-zinc-700")}>
                                Raw Recording Preview
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setRecordedBlob(null)
                                setTestAudioUrl(null)
                            }}
                            className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className={cn(
                        "p-4 rounded-xl border-2 border-dashed",
                        isDarkTheme ? "bg-blue-500/5 border-blue-500/10" : "bg-blue-50 border-blue-200"
                    )}>
                        <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block", isDarkTheme ? "text-blue-400" : "text-blue-600")}>
                            Test Your AI Voice
                        </label>
                        <textarea
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            rows={2}
                            className={cn(
                                "w-full p-2 text-xs rounded-lg border mb-3 resize-none focus:outline-none focus:ring-1",
                                isDarkTheme
                                    ? "bg-black/20 border-zinc-700 text-zinc-300 focus:ring-blue-500/50"
                                    : "bg-white border-zinc-200 text-zinc-700 focus:ring-blue-500/30"
                            )}
                            placeholder="Type something for your clone to say..."
                        />
                        <Button
                            onClick={handleTestClone}
                            disabled={isTesting || !testText.trim()}
                            variant="outline"
                            className={cn(
                                "w-full h-9 text-xs gap-2 rounded-lg transition-all",
                                isDarkTheme ? "border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400" : "border-blue-200 hover:bg-blue-50 text-blue-600"
                            )}
                        >
                            {isTesting ? (
                                <>
                                    <div className="h-3 w-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    Processing Clone...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Hear How I Sound
                                </>
                            )}
                        </Button>

                        {testError && (
                            <p className="text-xs text-red-500 mt-3 text-center animate-in fade-in leading-relaxed max-w-full overflow-hidden text-ellipsis">
                                ⚠️ {testError}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className={cn("text-[10px] font-bold uppercase tracking-wider", isDarkTheme ? "text-zinc-500" : "text-zinc-400")}>
                            Voice Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={voiceName}
                                onChange={(e) => setVoiceName(e.target.value)}
                                placeholder="e.g. My AI Voice"
                                className={cn(
                                    "flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2",
                                    isDarkTheme
                                        ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:ring-blue-500/50"
                                        : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-blue-500/20"
                                )}
                            />
                            <Button
                                onClick={handleSave}
                                disabled={!voiceName.trim() || isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Cloning...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Save Clone
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
