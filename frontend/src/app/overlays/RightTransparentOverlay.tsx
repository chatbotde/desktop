import { RightTransparent } from '@/shared/components/common'
import { useAppState } from '../context/AppContext'

export function RightTransparentOverlay() {
    const { uiState } = useAppState()

    return (
        <RightTransparent
            onClick={() => uiState.setIsInputVisible(true)}
            showInputHint={!uiState.isInputVisible}
            className="transition-all z-[2005]"
        />
    )
}
