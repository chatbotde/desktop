import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { PROMPT_INPUT_CONSTANTS } from "./constants/prompt-input-constants"

interface NetworkOfflineIndicatorProps {
  themeClasses: {
    icon: string
  }
}

export function NetworkOfflineIndicator({ themeClasses }: NetworkOfflineIndicatorProps) {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <div
      className={cn(
        "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full mb-2",
        "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
        `z-[${PROMPT_INPUT_CONSTANTS.Z_INDEX.NETWORK_INDICATOR}]`,
        "opacity-90"
      )}
      title="No Internet Connection"
      aria-label="No Internet Connection"
    >
      <WifiOff className={`size-5 ${themeClasses.icon} text-red-500`} />
    </div>
  )
}

