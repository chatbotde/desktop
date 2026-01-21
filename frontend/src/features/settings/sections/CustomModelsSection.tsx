import { useState, useEffect, useCallback } from "react"
import { Key, Plus, Trash2, Globe, Check, Eye, EyeOff, Image, Music, Video, ChevronsUpDown } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"

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

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { Badge } from "@/shared/components/ui/badge"
import { googleModels } from "@/lib/ai/model-config/google"
import { openaiModels } from "@/lib/ai/model-config/openai"
import { anthropicModels } from "@/lib/ai/model-config/anthropic"

const PREDEFINED_MODELS = {
  google: googleModels,
  openai: openaiModels,
  anthropic: anthropicModels,
}

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
  const [open, setOpen] = useState(false)

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
  const availableModels = PREDEFINED_MODELS[provider] || []

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
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">Custom</Badge>
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "flex-1 justify-between",
                    isDarkTheme &&
                    "bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100"
                  )}
                >
                  {newModelId
                    ? availableModels.find((model) => model.id === newModelId)?.displayName || newModelId
                    : "Select a model to add..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn(
                "p-0 w-[--radix-popover-trigger-width]",
                isDarkTheme ? "bg-zinc-800 border-zinc-700" : "bg-white"
              )}>
                <Command>
                  <CommandInput placeholder="Search model..." className={cn(isDarkTheme && "text-zinc-100 placeholder:text-zinc-500")} />
                  <CommandList className="max-h-[140px]">
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {availableModels.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={model.displayName}
                          className={cn(isDarkTheme && "aria-selected:bg-zinc-700 text-zinc-100")}
                          onSelect={() => {
                            setNewModelId(model.id)
                            setNewModelDisplayName(model.displayName)
                            if (model.supportsImages !== undefined) setSupportsImages(model.supportsImages)
                            if (model.supportsAudio !== undefined) setSupportsAudio(model.supportsAudio)
                            if (model.supportsVideo !== undefined) setSupportsVideo(model.supportsVideo)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newModelId === model.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {model.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

          {/* Detected Capabilities */}
          <div className="flex items-center gap-3 pt-1">
            <span className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
              Capabilities:
            </span>
            <div className="flex gap-2">
              {supportsImages && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs border",
                  isDarkTheme
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                )}>
                  <Image className="h-3 w-3" /> Images
                </span>
              )}
              {supportsAudio && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs border",
                  isDarkTheme
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                    : "bg-purple-50 border-purple-200 text-purple-700"
                )}>
                  <Music className="h-3 w-3" /> Audio
                </span>
              )}
              {supportsVideo && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs border",
                  isDarkTheme
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-green-50 border-green-200 text-green-700"
                )}>
                  <Video className="h-3 w-3" /> Video
                </span>
              )}
            </div>
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
