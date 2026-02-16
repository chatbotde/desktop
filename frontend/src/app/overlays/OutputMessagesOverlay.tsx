import { OutputMessages } from '../../components/output-messages'
import { useAppState } from '../context/AppContext'

export function OutputMessagesOverlay() {
    const {
        messageManager,
        handleClearMessages,
        uiState,
        textSelectionActions,
        handleLoadHistory,
        outputWindowEnabled
    } = useAppState()

    if (!outputWindowEnabled) return null

    return (
        <OutputMessages
            messages={messageManager.outputMessages}
            isWaitingForResponse={messageManager.isWaitingForResponse}
            onClearMessages={handleClearMessages}
            isVisible={uiState.isOutputVisible}
            onClose={() => uiState.setIsOutputVisible(false)}
            onAddSelectedTextToPrompt={textSelectionActions.handleAddSelectedTextToPrompt}
            onAskSelectedText={textSelectionActions.handleAskSelectedText}
            onExplainSelectedText={textSelectionActions.handleExplainSelectedText}
            isDarkTheme={uiState.isDarkTheme}
            onSelectHistory={handleLoadHistory}
        />
    )
}
