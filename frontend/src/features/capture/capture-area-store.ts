
/**
 * Simple store to hold the currently selected capture area
 * and whether auto-capture is enabled for it.
 */

type CaptureArea = {
    x: number
    y: number
    width: number
    height: number
}

let currentArea: CaptureArea | null = null
let isAutoCaptureEnabled = false

type Listener = (area: CaptureArea | null) => void
const listeners: Set<Listener> = new Set()

export const CaptureAreaStore = {
    getArea: () => currentArea,

    setArea: (area: CaptureArea | null) => {
        currentArea = area
        listeners.forEach(l => l(area))
    },

    enableAutoCapture: (enabled: boolean) => {
        isAutoCaptureEnabled = enabled
    },

    isAutoCaptureEnabled: () => isAutoCaptureEnabled,

    subscribe: (listener: Listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }
}
