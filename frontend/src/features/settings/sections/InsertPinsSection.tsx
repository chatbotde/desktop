import { useCallback, useEffect, useState } from "react"
import { Loader2, MapPin, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"

type InsertPin = {
  number: number
  name: string
  processName: string
  windowTitleHint: string
  hwnd: string | null
  processId: number | null
  status: "live" | "offline"
  createdAt: number
  updatedAt: number
}

function getPinsUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "Insert pins are only available in the desktop app."
  }
  if (!window.tsfAPI?.listPins) {
    return "Pin APIs are not loaded. Rebuild the interface and restart Buddy."
  }
  return "Insert pins unavailable."
}

/**
 * Settings: list / rename / remove only.
 * Assign via shortcut Ctrl+Shift+P (small overlay on the app).
 */
export function InsertPinsSection({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const [pins, setPins] = useState<InsertPin[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!window.tsfAPI?.listPins) {
      setError(getPinsUnavailableMessage())
      setPins([])
      setIsLoading(false)
      return
    }

    try {
      setPins((await window.tsfAPI.listPins()) || [])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load pins")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    window.tsfAPI?.onPinsChanged?.((next) => setPins(next || []))
    const timer = window.setInterval(() => void refresh(), 10_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const handleRemove = async (number: number) => {
    if (!window.tsfAPI?.removePin) return
    setBusy(true)
    try {
      await window.tsfAPI.removePin(number)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove pin")
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (number: number, name: string) => {
    if (!window.tsfAPI?.renamePin || !name.trim()) return
    try {
      await window.tsfAPI.renamePin(number, name.trim())
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rename pin")
    }
  }

  const muted = getThemeUtils(isDarkTheme, { dark: "text-zinc-400", light: "text-zinc-600" })
  const title = getThemeUtils(isDarkTheme, { dark: "text-zinc-100", light: "text-zinc-900" }, "text-sm font-medium")

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", muted)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pins…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className={title}>Your insert pins</h3>
        <p className={cn("text-xs mt-1", muted)}>
          Assign pins with{" "}
          <kbd
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              isDarkTheme ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"
            )}
          >
            Ctrl+Shift+P
          </kbd>{" "}
          at the spot where you want text — same app can use pins 1–9 at different positions.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-xs", muted)}>{pins.length} pin{pins.length === 1 ? "" : "s"}</p>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => void refresh()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {pins.length === 0 ? (
        <div
          className={cn(
            "rounded-lg border border-dashed p-6 text-center text-sm",
            muted,
            isDarkTheme ? "border-zinc-800" : "border-zinc-200"
          )}
        >
          <MapPin className="mx-auto mb-2 h-5 w-5 opacity-60" />
          No pins yet. Focus Cursor / Edge / etc., then press Ctrl+Shift+P.
        </div>
      ) : (
        <ul className="space-y-2">
          {pins.map((pin) => (
            <li
              key={pin.number}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                isDarkTheme ? "border-zinc-800" : "border-zinc-200"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                  pin.status === "live"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isDarkTheme
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-zinc-100 text-zinc-500"
                )}
              >
                {pin.number}
              </span>
              <div className="min-w-0 flex-1">
                <Input
                  defaultValue={pin.name}
                  key={`${pin.number}-${pin.updatedAt}`}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== pin.name) {
                      void handleRename(pin.number, e.target.value)
                    }
                  }}
                  className="h-8 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0"
                />
                <p className={cn("text-xs truncate", muted)}>
                  {pin.processName}
                  {pin.windowTitleHint ? ` · ${pin.windowTitleHint}` : ""}
                  {(pin as any).uiaTarget ? " · accessibility" : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  pin.status === "live"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isDarkTheme
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-zinc-100 text-zinc-500"
                )}
              >
                {pin.status}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleRemove(pin.number)}
                disabled={busy}
                aria-label={`Remove pin ${pin.number}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
