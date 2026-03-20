import { TextSelectionPopup } from '@/features/text-selection'
import { useAppState } from '../context/AppContext'

export function TextSelectionOverlay() {
    const { handleSendMessage, uiState } = useAppState()

    return (
        <TextSelectionPopup
            onSendMessage={handleSendMessage}
            isDarkTheme={uiState.isDarkTheme}
        />
    )
}
