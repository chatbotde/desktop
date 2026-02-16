import { VideoScrollSection } from '@/components/sections'
import { useAppState } from '../context/AppContext'

export function VideoScrollOverlay() {
    const { uiState } = useAppState()

    return (
        <VideoScrollSection
            showVideoScroll={uiState.showVideoScroll}
            onClose={() => uiState.setShowVideoScroll(false)}
        />
    )
}
