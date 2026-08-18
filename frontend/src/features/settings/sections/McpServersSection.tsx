import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlugZap,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"
import type { McpServerEntry, McpTransportType } from "@/types/electron"
import { CuaDriverPanel } from "@/features/cua/components/CuaDriverPanel"

function getMcpUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "MCP servers are only available in the SonicThinking desktop app."
  }
  if (!window.mcpAPI) {
    return "MCP client is not loaded. Rebuild the preload (npm run build:interface) and restart the app."
  }
  return "MCP client is unavailable."
}

type NewServerForm = {
  name: string
  transportType: McpTransportType
  command: string
  args: string
  url: string
}

const DEFAULT_FORM: NewServerForm = {
  name: "MCP Everything (Test)",
  transportType: "stdio",
  command: "npx",
  args: "-y @modelcontextprotocol/server-everything stdio",
  url: "http://localhost:3000/mcp",
}

export function McpServersSection({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const [servers, setServers] = useState<McpServerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyServerId, setBusyServerId] = useState<string | null>(null)
  const [form, setForm] = useState<NewServerForm>(DEFAULT_FORM)
  const [isAdding, setIsAdding] = useState(false)

  const fetchServers = useCallback(async () => {
    if (!window.mcpAPI) {
      setError(getMcpUnavailableMessage())
      setServers([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const entries = await window.mcpAPI.listServers()
      setServers(entries)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load MCP servers"
      setError(message)
      setServers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchServers()
  }, [fetchServers])

  const handleAddServer = async () => {
    if (!window.mcpAPI) return

    try {
      setIsAdding(true)
      setError(null)
      setNotice(null)

      const transport =
        form.transportType === "stdio"
          ? {
              type: "stdio" as const,
              command: form.command.trim(),
              args: form.args
                .split(/\s+/)
                .map((arg) => arg.trim())
                .filter(Boolean),
            }
          : {
              type: form.transportType,
              url: form.url.trim(),
            }

      await window.mcpAPI.addServer({
        name: form.name.trim() || "MCP Server",
        enabled: true,
        transport,
      })

      setForm(DEFAULT_FORM)
      setNotice("MCP server added. Connect to verify it works.")
      await fetchServers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add MCP server"
      setError(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleConnect = async (serverId: string) => {
    if (!window.mcpAPI) return

    try {
      setBusyServerId(serverId)
      setError(null)
      await window.mcpAPI.connect(serverId)
      setNotice("Connected to MCP server.")
      await fetchServers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect"
      setError(message)
      await fetchServers()
    } finally {
      setBusyServerId(null)
    }
  }

  const handleDisconnect = async (serverId: string) => {
    if (!window.mcpAPI) return

    try {
      setBusyServerId(serverId)
      await window.mcpAPI.disconnect(serverId)
      await fetchServers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to disconnect"
      setError(message)
    } finally {
      setBusyServerId(null)
    }
  }

  const handleRemove = async (serverId: string) => {
    if (!window.mcpAPI) return

    try {
      setBusyServerId(serverId)
      await window.mcpAPI.removeServer(serverId)
      await fetchServers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove server"
      setError(message)
    } finally {
      setBusyServerId(null)
    }
  }

  const statusColor = (status: string) =>
    getThemeUtils(
      isDarkTheme,
      {
        dark:
          status === "connected"
            ? "text-emerald-400"
            : status === "error"
              ? "text-red-400"
              : "text-zinc-400",
        light:
          status === "connected"
            ? "text-emerald-600"
            : status === "error"
              ? "text-red-600"
              : "text-zinc-500",
      },
      "text-xs capitalize"
    )

  return (
    <div className="space-y-6">
      <div>
        <h3
          className={getThemeUtils(
            isDarkTheme,
            { dark: "text-zinc-100", light: "text-zinc-900" },
            "text-sm font-medium mb-1"
          )}
        >
          MCP Servers
        </h3>
        <p
          className={getThemeUtils(
            isDarkTheme,
            { dark: "text-zinc-400", light: "text-zinc-600" },
            "text-xs"
          )}
        >
          Connect to Model Context Protocol servers for tools, resources, and prompts.
        </p>
      </div>

      {error && (
        <div
          className={getThemeUtils(
            isDarkTheme,
            {
              dark: "bg-red-950/40 border-red-900 text-red-200",
              light: "bg-red-50 border-red-200 text-red-700",
            },
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
          )}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          className={getThemeUtils(
            isDarkTheme,
            {
              dark: "bg-emerald-950/30 border-emerald-900 text-emerald-200",
              light: "bg-emerald-50 border-emerald-200 text-emerald-700",
            },
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
          )}
        >
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <CuaDriverPanel isDarkTheme={isDarkTheme} />

      <div
        className={getThemeUtils(
          isDarkTheme,
          { dark: "border-zinc-800 bg-zinc-900/40", light: "border-zinc-200 bg-zinc-50" },
          "space-y-3 rounded-lg border p-4"
        )}
      >
        <p className={getThemeUtils(isDarkTheme, { dark: "text-zinc-200", light: "text-zinc-800" }, "text-xs font-medium")}>
          Add server
        </p>

        <Input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Server name"
          className={getThemeUtils(isDarkTheme, { dark: "bg-zinc-950", light: "bg-white" }, "h-8 text-xs")}
        />

        <div className="flex gap-2">
          {(["stdio", "http"] as McpTransportType[]).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={form.transportType === type ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setForm((prev) => ({ ...prev, transportType: type }))}
            >
              {type}
            </Button>
          ))}
        </div>

        {form.transportType === "stdio" ? (
          <>
            <Input
              value={form.command}
              onChange={(e) => setForm((prev) => ({ ...prev, command: e.target.value }))}
              placeholder="Command (e.g. npx, node, python)"
              className={getThemeUtils(isDarkTheme, { dark: "bg-zinc-950", light: "bg-white" }, "h-8 text-xs")}
            />
            <Input
              value={form.args}
              onChange={(e) => setForm((prev) => ({ ...prev, args: e.target.value }))}
              placeholder="Arguments (space-separated)"
              className={getThemeUtils(isDarkTheme, { dark: "bg-zinc-950", light: "bg-white" }, "h-8 text-xs")}
            />
          </>
        ) : (
          <Input
            value={form.url}
            onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="Server URL"
            className={getThemeUtils(isDarkTheme, { dark: "bg-zinc-950", light: "bg-white" }, "h-8 text-xs")}
          />
        )}

        <Button
          type="button"
          size="sm"
          className="h-8 text-xs"
          onClick={() => void handleAddServer()}
          disabled={isAdding}
        >
          {isAdding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
          Add MCP server
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading servers...
        </div>
      ) : servers.length === 0 ? (
        <p className={getThemeUtils(isDarkTheme, { dark: "text-zinc-500", light: "text-zinc-500" }, "text-xs")}>
          No MCP servers configured yet.
        </p>
      ) : (
        <div className="space-y-2">
          {servers.map((server) => {
            const isBusy = busyServerId === server.id
            const isConnected = server.connection.status === "connected"

            return (
              <div
                key={server.id}
                className={getThemeUtils(
                  isDarkTheme,
                  { dark: "border-zinc-800 bg-zinc-900/30", light: "border-zinc-200 bg-white" },
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PlugZap className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <p
                      className={getThemeUtils(
                        isDarkTheme,
                        { dark: "text-zinc-100", light: "text-zinc-900" },
                        "truncate text-sm font-medium"
                      )}
                    >
                      {server.name}
                    </p>
                  </div>
                  <p className={statusColor(server.connection.status)}>
                    {server.connection.status}
                    {server.connection.error ? ` — ${server.connection.error}` : ""}
                  </p>
                  <p className={getThemeUtils(isDarkTheme, { dark: "text-zinc-500", light: "text-zinc-500" }, "truncate text-[11px]")}>
                    {server.transport.type === "stdio"
                      ? `${server.transport.command} ${(server.transport.args ?? []).join(" ")}`
                      : server.transport.url}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {isConnected ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={isBusy}
                      onClick={() => void handleDisconnect(server.id)}
                      aria-label="Disconnect"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PowerOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={isBusy}
                      onClick={() => void handleConnect(server.id)}
                      aria-label="Connect"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn("h-7 w-7", isDarkTheme ? "text-red-400 hover:text-red-300" : "text-red-600")}
                    disabled={isBusy}
                    onClick={() => void handleRemove(server.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
