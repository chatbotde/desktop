import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type QuickInsertStatus =
  | "idle"
  | "checking"
  | "not-ready"
  | "no-target"
  | "not-editable"
  | "inserting"
  | "success"
  | "error"

export interface QuickInsertProps {
  /**
   * The AI response (or any text) to insert into the last focused external app.
   * When this changes to a non-empty value, insertion will be attempted automatically.
   */
  text?: string | null

  /**
   * Enable/disable auto insertion.
   */
  enabled?: boolean

  /**
   * Render the small status row (helpful messages, success, errors).
   */
  showStatus?: boolean

  /**
   * Additional CSS classes for the status row.
   */
  className?: string

  /**
   * Called after an insert attempt finishes.
   */
  onInserted?: (success: boolean) => void

  /**
   * Called when an insert attempt fails with an error.
   */
  onError?: (error: Error) => void
}

/**
 * QuickInsert
 *
 * Automatically inserts `text` into the last focused external application using TSF.
 * If the last focused target isn't a text input, it shows a helpful message and does NOT insert.
 */
export function QuickInsert({
  text,
  enabled = true,
  showStatus = true,
  className,
  onInserted,
  onError,
}: QuickInsertProps) {
  const [status, setStatus] = useState<QuickInsertStatus>("idle")
  const [message, setMessage] = useState<string>("")

  // Prevent accidental duplicate insertion for identical content
  const lastInsertedKeyRef = useRef<string>("")

  const normalizedText = useMemo(() => (text ?? "").trim(), [text])
  const insertKey = useMemo(() => normalizedText, [normalizedText])

  useEffect(() => {
    if (!enabled) {
      setStatus("not-ready")
      setMessage("")
      return
    }

    if (!normalizedText) {
      setStatus("idle")
      setMessage("")
      return
    }

    // Avoid inserting the same content multiple times due to re-renders
    if (insertKey && lastInsertedKeyRef.current === insertKey) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setStatus("checking")
        setMessage("")

        if (!window.tsfAPI) {
          setStatus("error")
          setMessage("Quick insert is unavailable (TSF bridge not ready).")
          onError?.(new Error("TSF API is not available."))
          onInserted?.(false)
          return
        }

        await window.tsfAPI.initialize()

        // Prefer the last *external* focus if available; otherwise fallback to the tracked last focused window.
        const target =
          (await window.tsfAPI.getLastExternalFocus?.()) ??
          (await window.tsfAPI.getLastFocusedWindow?.())

        if (!target || !target.processName) {
          setStatus("no-target")
          setMessage("Click into a text field in the app you want to type into, then try again.")
          onInserted?.(false)
          return
        }

        if (!target.isEditable) {
          setStatus("not-editable")
          setMessage(
            `You're focused on "${target.processName}", but the cursor isn't in a text box. Click into a text field (caret visible) and try again.`
          )
          onInserted?.(false)
          return
        }

        setStatus("inserting")
        const ok = await window.tsfAPI.focusAndInsertText(normalizedText)

        if (cancelled) return

        if (ok) {
          lastInsertedKeyRef.current = insertKey
          setStatus("success")
          setMessage("Inserted.")
          onInserted?.(true)
        } else {
          setStatus("error")
          setMessage("Could not insert. Make sure the target app has a text cursor, then try again.")
          onInserted?.(false)
        }
      } catch (e) {
        if (cancelled) return
        const err = e instanceof Error ? e : new Error("Unknown quick insert error")
        setStatus("error")
        setMessage(err.message || "Quick insert failed.")
        onError?.(err)
        onInserted?.(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [enabled, insertKey, normalizedText, onError, onInserted])

  // Auto-clear the success indicator (prevents the UI from looking "stuck")
  useEffect(() => {
    if (status !== "success") return
    const t = window.setTimeout(() => {
      setStatus("idle")
      setMessage("")
    }, 2000)
    return () => window.clearTimeout(t)
  }, [status])

  if (!showStatus) return null

  const row = (() => {
    switch (status) {
      case "checking":
      case "inserting":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          text: status === "checking" ? "Checking target…" : "Inserting…",
          tone: "text-blue-600 dark:text-blue-400",
        }
      case "success":
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          text: message || "Inserted.",
          tone: "text-green-600 dark:text-green-400",
        }
      case "no-target":
      case "not-editable":
      case "error":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          text: message || "Quick insert skipped.",
          tone: "text-red-600 dark:text-red-400",
        }
      case "not-ready":
      case "idle":
      default:
        return null
    }
  })()

  if (!row) return null

  return (
    <div className={cn("flex items-center gap-2 text-xs", row.tone, className)}>
      {row.icon}
      <span className="truncate" title={row.text}>
        {row.text}
      </span>
    </div>
  )
}
