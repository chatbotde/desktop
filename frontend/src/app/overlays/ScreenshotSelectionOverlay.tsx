import { ScreenshotSelectionPopup } from '@/features/capture'
import { useAppState } from '../context/AppContext'

export function ScreenshotSelectionOverlay() {
  const { uiState } = useAppState()

  return (
    <ScreenshotSelectionPopup
      isDarkTheme={uiState.isDarkTheme}
    />

  )
}
