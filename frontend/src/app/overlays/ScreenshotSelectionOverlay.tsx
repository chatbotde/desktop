import { ScreenshotSelectionPopup } from '@/features/capture'
import { useAppState } from '../context/AppContext'

export function ScreenshotSelectionOverlay() {
  const { handleSendMessage, uiState } = useAppState()

  return (
    <ScreenshotSelectionPopup
      onSendMessage={handleSendMessage}
      isDarkTheme={uiState.isDarkTheme}
    />
  )
}
