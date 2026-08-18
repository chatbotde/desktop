import { FactCheckWindow } from "@/components/fact-check-window"
import { useAppState } from "../context/AppContext"

export function FactCheckOverlay() {
  const { uiState } = useAppState()
  const {
    factCheckResult,
    isFactCheckWindowVisible,
    isDarkTheme,
    setFactCheckResult,
    setIsFactCheckWindowVisible,
  } = uiState

  const handleClose = () => {
    setIsFactCheckWindowVisible(false)
    setFactCheckResult(null)
  }

  return (
    <FactCheckWindow
      result={factCheckResult}
      isVisible={isFactCheckWindowVisible}
      isDarkTheme={isDarkTheme}
      onClose={handleClose}
    />
  )
}
