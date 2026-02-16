import { TextSelectionPopup } from '@/features/text-selection'
import { useAppState } from '../context/AppContext'

export function TextSelectionOverlay() {
    const { handleSendMessage, textSelectionActions, uiState } = useAppState()

    return (
        <TextSelectionPopup
            onSendMessage={handleSendMessage}
            onAddToPrompt={textSelectionActions.handleAddSelectedTextToPrompt}
            isDarkTheme={uiState.isDarkTheme}
        />
    )
}
