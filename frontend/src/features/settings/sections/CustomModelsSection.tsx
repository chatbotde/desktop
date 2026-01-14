import { useState, useEffect, useCallback } from "react"
import { Key, Plus, Trash2, Globe, Bot, Check, Eye, EyeOff, Image, Music, Video } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Checkbox } from "@/shared/components/ui/checkbox"

import {
  getCustomProviders,
  saveCustomProviders,
  addCustomModel,
  removeCustomModel,
  getDefaultBaseUrl,
  getProviderDisplayName,
  CUSTOM_PROVIDER_TYPES,
  type CustomProviderType,
  type CustomProvidersStore,
  type CustomModelCapabilities,
} from "@/lib/settings/custom-providers"

interface ProviderCardProps {
  provider: CustomProviderType
  config: CustomProvidersStore[CustomProviderType]
  isDarkTheme: boolean
  onUpdate: (provider: CustomProviderType, updates: Partial<CustomProvidersStore[CustomProviderType]>) => void
  onAddModel: (provider: CustomProviderType, modelId: string, displayName: string, capabilities: Partial<CustomModelCapabilities>) => void
  onRemoveModel: (provider: CustomProviderType, modelId: string) => void
}

function ProviderCard({
  provider,
  config,
  isDarkTheme,
  onUpdate,
  onAddModel,
  onRemoveModel,
}: ProviderCardProps) {
  const [newModelId, setNewModelId] = useState("")
  const [newModelDisplayName, setNewModelDisplayName] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  // Capability toggles with sensible defaults based on provider
  const [supportsImages, setSupportsImages] = useState(true)
  const [supportsAudio, setSupportsAudio] = useState(provider === 'google')
  const [supportsVideo, setSupportsVideo] = useState(provider === 'google')

  const handleAddModel = () => {
    if (newModelId.trim()) {
      onAddModel(
        provider,
        newModelId.trim(),
        newModelDisplayName.trim() || newModelId.trim(),
        { supportsImages, supportsAudio, supportsVideo }
      )
      setNewModelId("")
      setNewModelDisplayName("")
      // Reset to defaults
      setSupportsImages(true)
      setSupportsAudio(provider === 'google')
      setSupportsVideo(provider === 'google')
    }
  }

  const providerName = getProviderDisplayName(provider)
  const defaultBaseUrl = getDefaultBaseUrl(provider)

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-4",
        isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"
      )}
    >
      {/* Provider Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className={cn("h-5 w-5", isDarkTheme ? "text-zinc-400" : "text-zinc-600")} />
          <span className={cn("font-medium", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
            {providerName}
          </span>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => onUpdate(provider, { enabled: checked })}
          className={cn(
            isDarkTheme
              ? "data-[state=unchecked]:bg-zinc-700 data-[state=checked]:bg-emerald-600"
              : "data-[state=unchecked]:bg-zinc-200 data-[state=checked]:bg-emerald-600"
          )}
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label
          className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}
        >
          <Key className="inline h-3 w-3 mr-1" />
          API Key
        </Label>
        <div className="relative">
          <Input
            type={showApiKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => onUpdate(provider, { apiKey: e.target.value })}
            placeholder={`Enter your ${providerName} API key`}
            className={cn(
              "pr-10",
              isDarkTheme &&
              "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
            )}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              isDarkTheme ? "text-zinc-400 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Base URL Override */}
      <div className="space-y-2">
        <Label
          className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}
        >
          <Globe className="inline h-3 w-3 mr-1" />
          Base URL (Optional)
        </Label>
        <Input
          type="url"
          value={config.baseUrl || ""}
          onChange={(e) => onUpdate(provider, { baseUrl: e.target.value })}
          placeholder={defaultBaseUrl}
          className={cn(
            isDarkTheme &&
            "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
          )}
        />
        <p className={cn("text-xs", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
          Leave empty to use default: {defaultBaseUrl}
        </p>
      </div>

      {/* Custom Models */}
      <div className="space-y-3">
        <Label
          className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}
        >
          Custom Models
        </Label>

        {/* Existing Models */}
        {config.models.length > 0 && (
          <div className="space-y-2">
            {config.models.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border px-3 py-2",
                  isDarkTheme ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm font-medium truncate", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                    {model.displayName}
                  </div>
                  <div className={cn("text-xs truncate", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
                    {model.name}
                  </div>
                  {/* Capability badges */}
                  <div className="flex gap-1 mt-1">
                    {model.capabilities?.supportsImages && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
                        isDarkTheme ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                      )}>
                        <Image className="h-2.5 w-2.5" /> Images
                      </span>
                    )}
                    {model.capabilities?.supportsAudio && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
                        isDarkTheme ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"
                      )}>
                        <Music className="h-2.5 w-2.5" /> Audio
                      </span>
                    )}
                    {model.capabilities?.supportsVideo && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
                        isDarkTheme ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                      )}>
                        <Video className="h-2.5 w-2.5" /> Video
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 shrink-0",
                    isDarkTheme ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
                  )}
                  onClick={() => onRemoveModel(provider, model.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Model */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              placeholder="Model ID (e.g., gpt-4o-mini)"
              className={cn(
                "flex-1",
                isDarkTheme &&
                "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
              )}
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={newModelDisplayName}
              onChange={(e) => setNewModelDisplayName(e.target.value)}
              placeholder="Display Name (optional)"
              className={cn(
                "flex-1",
                isDarkTheme &&
                "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddModel()
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddModel}
              disabled={!newModelId.trim()}
              className={cn(
                isDarkTheme && "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              )}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Capability Toggles */}
          <div className={cn(
            "rounded-md border p-3 space-y-2",
            isDarkTheme ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-zinc-50"
          )}>
            <Label className={cn(
              "text-xs font-medium",
              isDarkTheme ? "text-zinc-400" : "text-zinc-600"
            )}>
              Model Capabilities
            </Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={supportsImages}
                  onCheckedChange={(checked) => setSupportsImages(checked === true)}
                  className={cn(
                    isDarkTheme && "border-zinc-600 data-[state=checked]:bg-blue-600"
                  )}
                />
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  isDarkTheme ? "text-zinc-300" : "text-zinc-700"
                )}>
                  <Image className="h-3 w-3" /> Images
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={supportsAudio}
                  onCheckedChange={(checked) => setSupportsAudio(checked === true)}
                  className={cn(
                    isDarkTheme && "border-zinc-600 data-[state=checked]:bg-purple-600"
                  )}
                />
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  isDarkTheme ? "text-zinc-300" : "text-zinc-700"
                )}>
                  <Music className="h-3 w-3" /> Audio
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={supportsVideo}
                  onCheckedChange={(checked) => setSupportsVideo(checked === true)}
                  className={cn(
                    isDarkTheme && "border-zinc-600 data-[state=checked]:bg-green-600"
                  )}
                />
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  isDarkTheme ? "text-zinc-300" : "text-zinc-700"
                )}>
                  <Video className="h-3 w-3" /> Video
                </span>
              </label>
            </div>
            <p className={cn("text-[10px]", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
              Select which media types this model supports for multimodal input
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CustomModelsSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  const [providers, setProviders] = useState<CustomProvidersStore>(() => getCustomProviders())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Load providers on mount
  useEffect(() => {
    setProviders(getCustomProviders())
  }, [])

  const handleUpdateProvider = useCallback(
    (provider: CustomProviderType, updates: Partial<CustomProvidersStore[CustomProviderType]>) => {
      setProviders((prev) => {
        const updated = {
          ...prev,
          [provider]: { ...prev[provider], ...updates },
        }
        // Auto-save
        saveCustomProviders(updated)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
        return updated
      })
    },
    []
  )

  const handleAddModel = useCallback(
    (provider: CustomProviderType, modelId: string, displayName: string, capabilities: Partial<CustomModelCapabilities>) => {
      addCustomModel(provider, modelId, displayName, capabilities)
      setProviders(getCustomProviders())
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    []
  )

  const handleRemoveModel = useCallback(
    (provider: CustomProviderType, modelId: string) => {
      removeCustomModel(provider, modelId)
      setProviders(getCustomProviders())
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isDarkTheme ? "text-zinc-100" : "text-zinc-900"
            )}
          >
            <Key className="h-4 w-4" />
            Custom AI Providers
          </div>
          <p className={cn("text-xs mt-1", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
            Add your own API keys and custom models for Google, OpenAI, and Anthropic.
          </p>
        </div>
        {saveStatus === 'saved' && (
          <div className={cn("flex items-center gap-1 text-xs", "text-emerald-500")}>
            <Check className="h-3 w-3" />
            Saved
          </div>
        )}
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {CUSTOM_PROVIDER_TYPES.map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            config={providers[provider]}
            isDarkTheme={isDarkTheme}
            onUpdate={handleUpdateProvider}
            onAddModel={handleAddModel}
            onRemoveModel={handleRemoveModel}
          />
        ))}
      </div>

      {/* Info */}
      <div
        className={cn(
          "rounded-lg border p-3",
          isDarkTheme ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50"
        )}
      >
        <p className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          <strong>Note:</strong> API keys are stored locally in your browser and never sent to our
          servers. Custom models will appear in the model selector when the provider is enabled.
        </p>
      </div>
    </div>
  )
}
