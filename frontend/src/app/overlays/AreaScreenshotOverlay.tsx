import { AreaScreenshotSection } from '@/components/sections'
import { useAppState } from '../context/AppContext'

export function AreaScreenshotOverlay() {
    const { uiState } = useAppState()

    const handleAreaScreenshotCapture = async (area: { x: number; y: number; width: number; height: number }) => {
        if (uiState.areaScreenshotCallback) {
            await uiState.areaScreenshotCallback(area)
        }
        uiState.setShowAreaScreenshot(false)
        uiState.setAreaScreenshotCallback(null)
    }

    const handleAreaScreenshotCancel = () => {
        uiState.setShowAreaScreenshot(false)
        uiState.setAreaScreenshotCallback(null)
    }

    return (
        <AreaScreenshotSection
            showAreaScreenshot={uiState.showAreaScreenshot}
            areaScreenshotCallback={uiState.areaScreenshotCallback}
            onCapture={handleAreaScreenshotCapture}
            onCancel={handleAreaScreenshotCancel}
        />
    )
}
