import { RightTransparent } from '@/shared/components/common'
import { useAppState } from '../context/AppContext'
import { readBuddyGeneralSettings } from '@/lib/settings/general-settings'

export function RightTransparentOverlay() {
    const { uiState } = useAppState()
    const settings = readBuddyGeneralSettings()

    if (!settings.showRightTransparent) {
        return null
    }

    return (
        <RightTransparent
            onClick={() => uiState.setIsInputVisible(true)}
            showInputHint={!uiState.isInputVisible}
            className="transition-all z-[2005]"
        />
    )
}
