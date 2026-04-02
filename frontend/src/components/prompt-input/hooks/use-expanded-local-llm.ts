import { useState, useSyncExternalStore, useCallback } from "react"
import { unifiedLocalLLMService, type LocalLLMModel } from "@/lib/ai/local-llm"
import { getShowLocalModelControl, subscribeShowLocalModelControl } from "@/lib/settings/prompt-controls"
import { getSelectedModel } from "@/lib/ai/model-config"
import { getGroundingEnabled, setGroundingEnabled, subscribeGroundingEnabled } from "@/lib/settings/grounding-toggle"

export function useExpandedLocalLLM() {
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [ollamaModels, setOllamaModels] = useState<LocalLLMModel[]>([])
  const [selectedLocalModelName, setSelectedLocalModelName] = useState<string | null>(
    () => unifiedLocalLLMService.getCurrentModel()?.name ?? null
  )
  const [showLocalControlInPrompt, setShowLocalControlInPrompt] = useState<boolean>(
    () => getShowLocalModelControl()
  )
  const [groundingEnabled, setGroundingEnabledState] = useState<boolean>(() => getGroundingEnabled())
  const [selectedCloudModel, setSelectedCloudModel] = useState(() => getSelectedModel())
  const [initialized, setInitialized] = useState(false)

  useSyncExternalStore(
    useCallback((callback) => {
      if (initialized) return () => {}

      let cancelled = false
      ; (async () => {
        const result = await unifiedLocalLLMService.initialize()
        if (cancelled) return

        setOllamaRunning(result.success)
        if (result.success) {
          setOllamaModels(unifiedLocalLLMService.getAvailableModels())
        } else {
          setOllamaModels([])
        }
        setInitialized(true)
      })()

      return () => { cancelled = true }
    }, [initialized]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((callback) => {
      return subscribeShowLocalModelControl((value) => setShowLocalControlInPrompt(value))
    }, []),
    () => null,
    () => null
  )

  // Subscribe to grounding enabled - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
      return subscribeGroundingEnabled((value) => setGroundingEnabledState(value))
    }, []),
    () => null,
    () => null
  )

  // Listen for model changes - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
      const handleModelChange = () => {
        setSelectedCloudModel(getSelectedModel())
      }
      handleModelChange()
      window.addEventListener("model-selected", handleModelChange)
      window.addEventListener("storage", handleModelChange)
      return () => {
        window.removeEventListener("model-selected", handleModelChange)
        window.removeEventListener("storage", handleModelChange)
      }
    }, []),
    () => null,
    () => null
  )

  const isGoogleModelSelected = selectedCloudModel?.provider === "google"
  const handleToggleGrounding = () => {
    const newValue = !groundingEnabled
    setGroundingEnabled(newValue)
  }

  return {
    ollamaRunning,
    ollamaModels,
    selectedLocalModelName,
    setSelectedLocalModelName,
    showLocalControlInPrompt,
    groundingEnabled,
    isGoogleModelSelected,
    handleToggleGrounding,
  }
}

