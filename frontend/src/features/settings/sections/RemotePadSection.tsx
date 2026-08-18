import { useCallback, useEffect, useState } from "react"
import { Loader2, Monitor, RefreshCw } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Switch } from "@/shared/components/ui/switch"
import { cn } from "@/shared/lib"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"
import type { RemotePadQrCode, RemotePadStatus } from "@/types/electron"

function getRemotePadUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "Remote connection is only available in the desktop app."
  }
  if (!window.remotePadAPI) {
    return "Remote connection is not loaded. Rebuild the preload and restart the app."
  }
  return "Remote connection is unavailable."
}

export function RemotePadSection({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const [status, setStatus] = useState<RemotePadStatus | null>(null)
  const [qrCode, setQrCode] = useState<RemotePadQrCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    if (!window.remotePadAPI) {
      setError(getRemotePadUnavailableMessage())
      setStatus(null)
      setQrCode(null)
      setIsLoading(false)
      return
    }

    try {
      setIsRefreshing(true)
      const [nextStatus, nextQr] = await Promise.all([
        window.remotePadAPI.getStatus(),
        window.remotePadAPI.getQrCode(),
      ])
      setStatus(nextStatus)
      setQrCode(nextQr)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load remote connection"
      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const handleRegeneratePin = async () => {
    if (!window.remotePadAPI) return
    setIsRefreshing(true)
    try {
      await window.remotePadAPI.regeneratePin()
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleScreenViewChange = async (enabled: boolean) => {
    if (!window.remotePadAPI) return
    setIsRefreshing(true)
    try {
      await window.remotePadAPI.setConfig({ allowScreenView: enabled })
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClipboardSyncChange = async (enabled: boolean) => {
    if (!window.remotePadAPI) return
    setIsRefreshing(true)
    try {
      await window.remotePadAPI.setConfig({ clipboardSyncEnabled: enabled })
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDisconnectClients = async () => {
    if (!window.remotePadAPI) return
    setIsRefreshing(true)
    try {
      await window.remotePadAPI.disconnectClients()
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenFirewallSetup = async () => {
    if (!window.remotePadAPI?.openFirewallSetup) return
    setIsRefreshing(true)
    try {
      await window.remotePadAPI.openFirewallSetup()
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  if (!status || !qrCode) {
    return null
  }

  const isPhoneConnected = status.connectedClients > 0
  const firewallBlocked =
    status.windowsFirewall?.platform === "win32" &&
    status.windowsFirewall?.portRulesOk === false

  return (
    <div className="space-y-5 max-w-sm">
      {firewallBlocked ? (
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3",
            isDarkTheme ? "border-amber-900/60 bg-amber-950/30" : "border-amber-300 bg-amber-50"
          )}
        >
          <p className={getThemeUtils(isDarkTheme, {
            dark: "text-amber-200",
            light: "text-amber-900",
          }, "text-sm")}>
            Windows Firewall is blocking local phone connections on ports 8765–8766.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleOpenFirewallSetup()}
            disabled={isRefreshing}
          >
            Allow in Windows Firewall
          </Button>
        </div>
      ) : null}
      <div>
        <h3 className={getThemeUtils(isDarkTheme, {
          dark: "text-zinc-100",
          light: "text-zinc-900",
        }, "text-base font-semibold")}>
          Remote connection
        </h3>
        <p className={getThemeUtils(isDarkTheme, {
          dark: "text-zinc-400",
          light: "text-zinc-600",
        }, "text-sm mt-1")}>
          Scan this code with your phone to pair.
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-5 flex flex-col items-center gap-4",
          isDarkTheme ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white"
        )}
      >
        <img
          src={qrCode.dataUrl}
          alt="Remote connection QR code"
          className="h-56 w-56 rounded-xl border border-zinc-200 bg-white p-2"
        />
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isPhoneConnected ? "bg-emerald-500" : "bg-zinc-400"
            )}
            aria-hidden
          />
          <p className={getThemeUtils(isDarkTheme, {
            dark: "text-zinc-300",
            light: "text-zinc-700",
          }, "text-sm font-medium")}>
            {isPhoneConnected ? "Phone connected" : "Waiting for phone"}
          </p>
        </div>
        {isPhoneConnected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 px-4 rounded-full"
            onClick={() => void handleDisconnectClients()}
            disabled={isRefreshing}
          >
            Disconnect
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-xl border p-4",
          isDarkTheme ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Monitor className="h-4 w-4" />
              Screen view
            </div>
            <p className={getThemeUtils(isDarkTheme, {
              dark: "text-zinc-400",
              light: "text-zinc-600",
            }, "text-xs")}>
              Stream your desktop to the phone when connected.
            </p>
          </div>
          <Switch
            checked={status.allowScreenView}
            onCheckedChange={(checked) => void handleScreenViewChange(checked)}
            disabled={isRefreshing || (!status.liveKitConfigured && !status.lanFallbackEnabled)}
          />
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4",
          isDarkTheme ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-sm">
              Shared clipboard
            </div>
            <p className={getThemeUtils(isDarkTheme, {
              dark: "text-zinc-400",
              light: "text-zinc-600",
            }, "text-xs")}>
              Copy on one device, paste on the other.
            </p>
          </div>
          <Switch
            checked={status.clipboardSyncEnabled ?? false}
            onCheckedChange={(checked) => void handleClipboardSyncChange(checked)}
            disabled={isRefreshing}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleRegeneratePin()}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          New PIN
        </Button>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isRefreshing}>
          Refresh QR
        </Button>
      </div>
    </div>
  )
}
