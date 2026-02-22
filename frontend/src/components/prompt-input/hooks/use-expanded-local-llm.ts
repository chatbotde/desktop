import { useState, useEffect } from "react"
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

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        // Use unifiedLocalLLMService to initialize and update configuration
        const result = await unifiedLocalLLMService.initialize()
        if (cancelled) return

        setOllamaRunning(result.success)
        if (result.success) {
          setOllamaModels(unifiedLocalLLMService.getAvailableModels())
        } else {
          setOllamaModels([])
        }
      })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return subscribeShowLocalModelControl((value) => setShowLocalControlInPrompt(value))
  }, [])

  useEffect(() => {
    return subscribeGroundingEnabled((value) => setGroundingEnabledState(value))
  }, [])

  // Listen for model changes
  useEffect(() => {
    const handleModelChange = () => {
      setSelectedCloudModel(getSelectedModel())
    }
    // Check on mount and listen for changes
    handleModelChange()
    window.addEventListener("model-selected", handleModelChange)
    // Also listen to storage changes (for cross-tab sync)
    window.addEventListener("storage", handleModelChange)
    return () => {
      window.removeEventListener("model-selected", handleModelChange)
      window.removeEventListener("storage", handleModelChange)
    }
  }, [])

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

