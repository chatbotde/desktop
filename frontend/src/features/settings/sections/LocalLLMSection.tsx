import { useEffect, useMemo, useState } from "react"
import { Cpu, RefreshCw, X, Plus, Minus } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"

import { unifiedLocalLLMService } from "@/lib/ai/local-llm"
import { ollamaService, isOllamaConfigured } from "@/lib/ai/local-llm/ollama"
import { getShowLocalModelControl, setShowLocalModelControl } from "@/lib/settings/prompt-controls"

type OllamaInstallStatus = { installed: boolean; version?: string; error?: string }

export function LocalLLMSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  const [installStatus, setInstallStatus] = useState<OllamaInstallStatus | null>(null)
  const [isRunning, setIsRunning] = useState<boolean | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedLocalModel, setSelectedLocalModel] = useState<string | null>(
    () => unifiedLocalLLMService.getCurrentModel()?.name ?? null
  )
  const [showLocalControlInPrompt, setShowLocalControlInPrompt] = useState<boolean>(() => getShowLocalModelControl())

  const textMuted = useMemo(() => (isDarkTheme ? "text-zinc-400" : "text-zinc-600"), [isDarkTheme])

  const refresh = async () => {
    try {
      const status = await window.electronAPI?.ollama?.isInstalled?.()
      setInstallStatus(status ?? null)
    } catch {
      setInstallStatus({ installed: false, error: "Failed to check Ollama installation." })
    }

    try {
      const running = await isOllamaConfigured()
      setIsRunning(running)
      if (running) {
        const models = await ollamaService.listModels()
        setAvailableModels(models)
      } else {
        setAvailableModels([])
      }
    } catch {
      setIsRunning(false)
      setAvailableModels([])
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("flex items-center gap-2 text-sm font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
            <Cpu className="h-4 w-4" />
            Local LLM (Ollama)
          </div>
          <p className={cn("text-xs", textMuted)}>
            Select an installed Ollama model to chat locally
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={cn(isDarkTheme ? "border-zinc-700 text-zinc-200" : "border-zinc-200 text-zinc-800")}>
          Ollama installed: {installStatus ? (installStatus.installed ? "Yes" : "No") : "Unknown"}
        </Badge>
        {installStatus?.version && (
          <Badge variant="outline" className={cn(isDarkTheme ? "border-zinc-700 text-zinc-200" : "border-zinc-200 text-zinc-800")}>
            {installStatus.version}
          </Badge>
        )}
        <Badge variant="outline" className={cn(isDarkTheme ? "border-zinc-700 text-zinc-200" : "border-zinc-200 text-zinc-800")}>
          Service running: {isRunning === null ? "Unknown" : isRunning ? "Yes" : "No"}
        </Badge>
        <Badge variant="outline" className={cn(isDarkTheme ? "border-zinc-700 text-zinc-200" : "border-zinc-200 text-zinc-800")}>
          Models found: {availableModels.length}
        </Badge>
      </div>

      {!installStatus?.installed && (
        <Alert className={cn(isDarkTheme ? "border-zinc-800" : "border-zinc-200")}>
          <AlertTitle>Ollama is not installed</AlertTitle>
          <AlertDescription>
            Install Ollama, then download a model (example: <span className="font-mono">ollama pull gemma3:270M</span>). After that, refresh this page.
          </AlertDescription>
        </Alert>
      )}

      {installStatus?.installed && isRunning === false && (
        <Alert className={cn(isDarkTheme ? "border-zinc-800" : "border-zinc-200")}>
          <AlertTitle>Ollama is installed but not running</AlertTitle>
          <AlertDescription>
            Start the Ollama service, then refresh. (Default URL: <span className="font-mono">http://127.0.0.1:11434</span>)
          </AlertDescription>
        </Alert>
      )}

      {/* Add/Remove local model button in prompt input */}
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="min-w-0">
          <div className={cn("text-sm font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
            Local model button in prompt input
          </div>
          <p className={cn("text-xs mt-1", textMuted)}>
            Add the Local model button to the expanded prompt input actions
          </p>
        </div>
        {showLocalControlInPrompt ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowLocalControlInPrompt(false)
              setShowLocalModelControl(false)
            }}
          >
            <Minus className="h-4 w-4 mr-2" />
            Remove
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              setShowLocalControlInPrompt(true)
              setShowLocalModelControl(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        )}
      </div>

      {/* Select local model */}
      <div className="space-y-2">
        <div className={cn("text-sm font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>Local model</div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedLocalModel ?? ""}
            onValueChange={(value) => {
              if (!value) return
              unifiedLocalLLMService.setModel(value)
              setSelectedLocalModel(value)
            }}
            disabled={isRunning === false || availableModels.length === 0}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={availableModels.length ? "Select a model" : "No models found"} />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLocalModel && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                unifiedLocalLLMService.clearModel()
                setSelectedLocalModel(null)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}




















