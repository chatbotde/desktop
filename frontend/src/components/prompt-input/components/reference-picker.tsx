import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AlertCircle, AtSign, Loader2, Plug } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import type { ComposioToolkit } from "@/types/electron"
import {
  createIntegrationReference,
  type PromptReference,
} from "../types/prompt-reference"

interface ReferencePickerProps {
  isDarkTheme: boolean
  selectedReferences: PromptReference[]
  onReferenceAdd: (reference: PromptReference) => void
  onOpenChange?: (open: boolean) => void
}

function getComposioUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "References need the SonicThinking desktop app."
  }
  if (!window.composioAPI) {
    return "Integrations are not loaded. Restart the desktop app."
  }
  return "Integrations are unavailable."
}

// Global cache outside the component to persist across mounts/unmounts
let toolsCache: ComposioToolkit[] = []
let cacheError: string | null = null
let hasLoadedOnce = false

export function ReferencePicker({
  isDarkTheme,
  selectedReferences,
  onReferenceAdd,
  onOpenChange,
}: ReferencePickerProps) {
  const { user, isLoading: isLoadingUser } = useAuth()
  const [tools, setTools] = useState<ComposioToolkit[]>(toolsCache)
  const [isLoading, setIsLoading] = useState(!hasLoadedOnce)
  const [error, setError] = useState<string | null>(cacheError)

  const selectedIds = new Set(selectedReferences.map((r) => r.id))

  const fetchTools = useCallback(async () => {
    if (!window.composioAPI) {
      const msg = getComposioUnavailableMessage()
      setError(msg)
      cacheError = msg
      setTools([])
      toolsCache = []
      setIsLoading(false)
      return
    }
    if (!user) {
      setError(null)
      cacheError = null
      setTools([])
      toolsCache = []
      setIsLoading(false)
      return
    }

    try {
      if (toolsCache.length === 0) {
        setIsLoading(true)
      }
      setError(null)
      cacheError = null
      const apps = await window.composioAPI.getTools()
      setTools(apps)
      toolsCache = apps
      hasLoadedOnce = true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load integrations"
      setError(message)
      cacheError = message
      setTools([])
      toolsCache = []
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isLoadingUser) return
    void fetchTools()
  }, [fetchTools, isLoadingUser])

  const handleSelectIntegration = (tool: ComposioToolkit) => {
    const ref = createIntegrationReference(tool)
    if (selectedIds.has(ref.id)) return
    onReferenceAdd(ref)
    onOpenChange?.(false)
  }

  const connectedTools = tools.filter((t) => t.isConnected)

  return (
    <div
      className={cn(
        "w-[320px] rounded-xl border shadow-lg overflow-hidden",
        isDarkTheme ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
      )}
    >
      <div
        className={cn(
          "px-3 py-2 border-b text-xs font-medium flex items-center gap-2",
          isDarkTheme ? "border-zinc-700 text-zinc-300" : "border-zinc-200 text-zinc-600"
        )}
      >
        <AtSign className="size-3.5 shrink-0" />
        Add in reference
      </div>

      <Command
        className={cn(
          "border-0",
          isDarkTheme ? "bg-zinc-900" : "bg-white"
        )}
      >
        <CommandInput placeholder="Search integrations…" className="text-sm" />
        <CommandList className="max-h-[220px]">
          {isLoading || isLoadingUser ? (
            <PickerLoadingState isDarkTheme={isDarkTheme} />
          ) : error ? (
            <PickerErrorState
              isDarkTheme={isDarkTheme}
              message={error}
              onRetry={() => void fetchTools()}
            />
          ) : !user ? (
            <PickerEmptyState
              isDarkTheme={isDarkTheme}
              message="Sign in from Settings → Account to use connected integrations."
            />
          ) : connectedTools.length === 0 ? (
            <PickerEmptyState
              isDarkTheme={isDarkTheme}
              message="No connected integrations found. Connect accounts in Settings → Integrations."
            />
          ) : (
            <>
              {connectedTools.length > 0 && (
                <CommandGroup heading="Connected">
                  {connectedTools.map((tool) => (
                    <CommandItem
                      key={tool.slug}
                      value={`${tool.name} ${tool.slug}`}
                      onSelect={() => handleSelectIntegration(tool)}
                      disabled={selectedIds.has(`integration:${tool.slug}`)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <IntegrationRow tool={tool} badge="Connected" badgeClass="text-emerald-500" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandEmpty>No matching integrations.</CommandEmpty>
            </>
          )}
        </CommandList>
      </Command>
    </div>
  )
}

function IntegrationRow({
  tool,
  badge,
  badgeClass,
}: {
  tool: ComposioToolkit
  badge: string
  badgeClass: string
}) {
  return (
    <>
      {tool.logo ? (
        <img src={tool.logo} alt="" className="h-5 w-5 rounded-sm object-contain shrink-0" />
      ) : (
        <Plug className="h-5 w-5 shrink-0 text-zinc-500" />
      )}
      <span className="flex-1 truncate text-sm">{tool.name}</span>
      <span className={cn("text-[10px] shrink-0", badgeClass)}>{badge}</span>
    </>
  )
}

function PickerLoadingState({ isDarkTheme }: { isDarkTheme: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className={cn("size-5 animate-spin", isDarkTheme ? "text-zinc-400" : "text-zinc-500")} />
      <span className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        Loading integrations…
      </span>
    </div>
  )
}

function PickerErrorState({
  isDarkTheme,
  message,
  onRetry,
}: {
  isDarkTheme: boolean
  message: string
  onRetry: () => void
}) {
  return (
    <PickerEmptyState isDarkTheme={isDarkTheme} message={message}>
      <Button type="button" variant="outline" size="sm" className="text-xs mt-2" onClick={onRetry}>
        Retry
      </Button>
    </PickerEmptyState>
  )
}

function PickerEmptyState({
  isDarkTheme,
  message,
  children,
}: {
  isDarkTheme: boolean
  message: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <AlertCircle className={cn("size-6 mb-2", isDarkTheme ? "text-zinc-500" : "text-zinc-400")} />
      <p className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>{message}</p>
      {children}
    </div>
  )
}
