import { useState, useEffect, useCallback } from "react"
import { Plug, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"
import { useAuth } from "@/contexts/AuthContext"

type ComposioToolkit = {
  slug: string
  name: string
  logo?: string
  isConnected: boolean
}

function getComposioUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "Integrations are only available in the SonicThinking desktop app. Open Settings from the desktop app, not the browser dev server."
  }
  if (!window.composioAPI) {
    return "Composio integration is not loaded. Rebuild the preload (npm run build:interface) and restart the desktop app."
  }
  return "Composio is unavailable."
}

function isComposioConfigError(message: string): boolean {
  return /COMPOSIO_API_KEY|not configured/i.test(message)
}

export function IntegrationsSection({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const { user, isLoading: isLoadingUser } = useAuth()
  const [tools, setTools] = useState<ComposioToolkit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null)

  const fetchTools = useCallback(async () => {
    if (!window.composioAPI) {
      setError(getComposioUnavailableMessage())
      setTools([])
      setIsLoading(false)
      return
    }

    if (!user) {
      setError(null)
      setTools([])
      return
    }

    try {
      setIsLoading(true)
      const apps = await window.composioAPI.getTools()
      setTools(apps)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load integrations"
      setError(message)
      setTools([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isLoadingUser) return
    void fetchTools()
  }, [fetchTools, isLoadingUser])

  const handleConnect = async (slug: string) => {
    if (!window.composioAPI) return

    try {
      setConnectingSlug(slug)
      setNotice(null)
      setError(null)

      const response = await window.composioAPI.connectTool(slug)
      if (response?.success) {
        setNotice(response.message ?? "Finish authorization in your browser, then refresh this list.")
        await fetchTools()
      } else {
        setError(response?.message ?? "Failed to connect this integration.")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while trying to connect."
      setError(message)
    } finally {
      setConnectingSlug(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className={getThemeUtils(isDarkTheme, {
          dark: "text-zinc-100",
          light: "text-zinc-900"
        }, "text-sm font-medium mb-1")}>
          Connected Accounts
        </h3>
        <p className={getThemeUtils(isDarkTheme, {
          dark: "text-zinc-400",
          light: "text-zinc-600"
        }, "text-xs")}>
          Link external accounts so SonicThinking can use Composio toolkits on your behalf.
        </p>
      </div>

      {!isLoadingUser && !user && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Sign in from the Account section before connecting integrations.
          </p>
        </div>
      )}

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{notice}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className={getThemeUtils(isDarkTheme, {
          dark: "text-zinc-500",
          light: "text-zinc-600"
        }, "text-xs")}>
          {tools.length > 0 ? `${tools.length} integrations available` : "Browse available integrations"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => void fetchTools()}
          disabled={isLoading || isLoadingUser || !user}
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading || isLoadingUser ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500" />
          </div>
        ) : !user ? null : tools.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg border-zinc-700">
            <Plug className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No integrations available yet.</p>
            <p className="text-xs text-zinc-500 mt-1">
              {error && isComposioConfigError(error)
                ? "Add COMPOSIO_API_KEY to the project root .env file and restart the desktop app."
                : "No toolkits were returned. Try Refresh after signing in."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.slug}
                className={cn(
                  "p-4 rounded-lg border flex flex-col justify-between items-start gap-4",
                  getThemeUtils(isDarkTheme, {
                    dark: "border-zinc-800 bg-zinc-900",
                    light: "border-zinc-200 bg-white"
                  })
                )}
              >
                <div className="flex items-center gap-3">
                  {tool.logo && (
                    <img
                      src={tool.logo}
                      alt={tool.name}
                      className="w-8 h-8 rounded-sm bg-white p-0.5 object-contain"
                    />
                  )}
                  <div>
                    <h4 className={getThemeUtils(isDarkTheme, {
                      dark: "text-zinc-100",
                      light: "text-zinc-900"
                    }, "text-sm font-medium")}>{tool.name}</h4>
                    <p className={cn("text-xs", tool.isConnected ? "text-green-500" : "text-zinc-500")}>
                      {tool.isConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => void handleConnect(tool.slug)}
                  variant={tool.isConnected ? "outline" : "default"}
                  size="sm"
                  className="w-full text-xs"
                  disabled={connectingSlug === tool.slug}
                >
                  {connectingSlug === tool.slug
                    ? "Opening browser..."
                    : tool.isConnected
                      ? "Reconnect"
                      : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
