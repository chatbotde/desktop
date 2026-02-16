import { ExplanationSection } from '@/components/sections'
import { useAppState } from '../context/AppContext'

export function ExplanationOverlay() {
    const { uiState } = useAppState()

    return (
        <ExplanationSection
            explanation={uiState.explanation}
            explanationPosition={uiState.explanationPosition}
            isDarkTheme={uiState.isDarkTheme}
            onClose={uiState.clearExplanation}
        />
    )
}
