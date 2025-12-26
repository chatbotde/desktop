import { useState, useRef, useCallback, useEffect } from 'react'
import { getSupportedMimeType } from '../components/audio-utils'

export type AudioSourceType = 'mic' | 'system' | 'both'

interface UseAudioRecorderProps {
    onRecordingComplete?: (blob: Blob) => void
}

export function useAudioRecorder({ onRecordingComplete }: UseAudioRecorderProps = {}) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const systemStreamRef = useRef<MediaStream | null>(null)
    const audioStreamRef = useRef<MediaStream | null>(null) // The mixed stream
    const audioContextRef = useRef<AudioContext | null>(null)
    const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // Timing refs
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const recordingStartTimeRef = useRef<number>(0)
    const pausedTimeRef = useRef<number>(0)
    const pauseStartTimeRef = useRef<number>(0)
    const isPausedRef = useRef<boolean>(false)

    const cleanup = useCallback(async () => {
        // Stop all streams
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop())
            micStreamRef.current = null
        }
        if (systemStreamRef.current) {
            systemStreamRef.current.getTracks().forEach(track => track.stop())
            systemStreamRef.current = null
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop())
            audioStreamRef.current = null
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close()
            audioContextRef.current = null
        }
        destinationNodeRef.current = null

        // Stop recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
        }

        // Clear duration interval
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current)
            durationIntervalRef.current = null
        }

        chunksRef.current = []
        setDuration(0)
        setIsPaused(false)
        setActiveStream(null)
        setIsRecording(false)
    }, [])

    const startRecording = useCallback(async (source: AudioSourceType) => {
        try {
            await cleanup() // Ensure clean state

            chunksRef.current = []
            setDuration(0)

            let finalStream: MediaStream | null = null

            if (source === 'mic') {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                })
                micStreamRef.current = stream
                finalStream = stream
            } else if (source === 'system') {
                if (!(window as any).CaptureAPI) {
                    throw new Error('CaptureAPI is not available')
                }

                const sourcesResult = await ((window as any).CaptureAPI).getScreenshotSources(false)
                if (!sourcesResult.success || !sourcesResult.sources?.length) {
                    throw new Error('No screen sources available for system audio')
                }

                const screenSource = sourcesResult.sources.find((s: any) => s.type === 'screen') || sourcesResult.sources[0]

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: screenSource.id
                        }
                    } as any,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: screenSource.id,
                            maxWidth: 1,
                            maxHeight: 1
                        }
                    } as any
                })

                stream.getVideoTracks().forEach(track => {
                    track.stop()
                    stream.removeTrack(track)
                })

                systemStreamRef.current = stream
                finalStream = stream
            } else if (source === 'both') {
                const micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                })
                micStreamRef.current = micStream

                let systemStream: MediaStream | null = null
                try {
                    if ((window as any).CaptureAPI) {
                        const sourcesResult = await ((window as any).CaptureAPI).getScreenshotSources(false)
                        if (sourcesResult.success && sourcesResult.sources?.length) {
                            const screenSource = sourcesResult.sources.find((s: any) => s.type === 'screen') || sourcesResult.sources[0]

                            const sysStream = await navigator.mediaDevices.getUserMedia({
                                audio: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: screenSource.id
                                    }
                                } as any,
                                video: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: screenSource.id,
                                        maxWidth: 1,
                                        maxHeight: 1
                                    }
                                } as any
                            })

                            sysStream.getVideoTracks().forEach(track => {
                                track.stop()
                                sysStream.removeTrack(track)
                            })

                            systemStream = sysStream
                            systemStreamRef.current = sysStream
                        }
                    }
                } catch (sysError) {
                    console.warn('Could not capture system audio:', sysError)
                }

                const audioContext = new AudioContext()
                audioContextRef.current = audioContext

                const destination = audioContext.createMediaStreamDestination()
                destinationNodeRef.current = destination

                const micSource = audioContext.createMediaStreamSource(micStream)
                micSource.connect(destination)

                if (systemStream && systemStream.getAudioTracks().length > 0) {
                    const systemSource = audioContext.createMediaStreamSource(systemStream)
                    systemSource.connect(destination)
                }

                finalStream = destination.stream
                audioStreamRef.current = finalStream
            }

            if (!finalStream) {
                throw new Error('Failed to create audio stream')
            }

            setActiveStream(finalStream)

            const mimeType = getSupportedMimeType()
            const recorder = new MediaRecorder(finalStream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000
            })

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
                onRecordingComplete?.(blob)
                cleanup()
            }

            recorder.start(500)
            mediaRecorderRef.current = recorder

            recordingStartTimeRef.current = Date.now()
            pausedTimeRef.current = 0
            pauseStartTimeRef.current = 0
            isPausedRef.current = false

            durationIntervalRef.current = setInterval(() => {
                if (!isPausedRef.current) {
                    const elapsed = Date.now() - recordingStartTimeRef.current - pausedTimeRef.current
                    setDuration(Math.floor(elapsed / 1000))
                }
            }, 1000)

            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            await cleanup()
            throw error
        }
    }, [cleanup, onRecordingComplete])

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause()
            pauseStartTimeRef.current = Date.now()
            isPausedRef.current = true
            setIsPaused(true)
        }
    }, [])

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume()
            const pauseDuration = Date.now() - pauseStartTimeRef.current
            pausedTimeRef.current += pauseDuration
            isPausedRef.current = false
            setIsPaused(false)

            // Update duration immediately
            const elapsed = Date.now() - recordingStartTimeRef.current - pausedTimeRef.current
            setDuration(Math.floor(elapsed / 1000))
        }
    }, [])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        } else {
            cleanup()
        }
    }, [cleanup])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup().catch(console.error)
        }
    }, [cleanup])

    return {
        isRecording,
        isPaused,
        duration,
        activeStream,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        cleanup
    }
}
