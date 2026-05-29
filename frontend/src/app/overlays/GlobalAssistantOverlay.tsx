import { AssistantSphere } from '@/components/assistant-animation'
import { GLOBAL_THEME } from '@/global/theme'

export function GlobalAssistantOverlay() {
    return (
        <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: GLOBAL_THEME.zIndex.assistant }}
        >
            <AssistantSphere />
        </div>
    )
}
