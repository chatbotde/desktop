import { useState, useRef, useEffect } from "react"
import { useFeature } from "@/contexts/FeatureContext"
import { SetAreaOverlay } from "@/features/capture/components"
import { CaptureAreaStore } from "@/features/capture/capture-area-store"

export const featureId = "set-capture-area"

export function FeatureEffect() {
    const { isFeatureEnabled } = useFeature()
    const [isVisible, setIsVisible] = useState(false)
    const enabled = isFeatureEnabled(featureId)

    const isCapturingRef = useRef(false)

    useEffect(() => {
        if (!enabled) {
            setIsVisible(false)
            return
        }

        const handler = () => setIsVisible(true)
        window.addEventListener('trigger-set-capture-area', handler)
        return () => window.removeEventListener('trigger-set-capture-area', handler)
    }, [enabled])


    if (!enabled) return null

    const handleCapture = async (area: { x: number; y: number; width: number; height: number }) => {
        if (isCapturingRef.current) return
        isCapturingRef.current = true

        console.log('[SetCaptureArea] Area captured:', area)

        // Save to store
        CaptureAreaStore.setArea(area)
        CaptureAreaStore.enableAutoCapture(true)

        setIsVisible(false)
        // Reset ref after a delay
        setTimeout(() => { isCapturingRef.current = false }, 500)
    }

    return (
        <>


            {/* SetAreaOverlay component */}
            {isVisible && (
                <SetAreaOverlay
                    onCapture={handleCapture}
                    onCancel={() => setIsVisible(false)}
                />
            )}
        </>
    )
}

