import { useState, useRef, useEffect } from "react"
import { ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { createUrlReference } from "../types/prompt-reference"
import type { ReferenceProviderPickerProps } from "./types"

export function UrlProviderPicker({
  isDarkTheme,
  onReferenceAdd,
  onOpenChange,
  onBack,
}: ReferenceProviderPickerProps) {
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAdd = () => {
    let trimmed = url.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`
    }
    const ref = createUrlReference(trimmed)
    onReferenceAdd(ref)
    onOpenChange?.(false)
  }

  return (
    <div className="flex flex-col h-[280px]">
      <div
        className={cn(
          "px-3 py-2 border-b text-xs font-medium flex items-center gap-2",
          isDarkTheme ? "border-zinc-800 text-zinc-300" : "border-zinc-200 text-zinc-600"
        )}
      >
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "p-1 rounded-md transition-colors",
            isDarkTheme ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700"
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold">Web Page</span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-2 justify-between">
        <div className="flex flex-col gap-1.5 w-full">
          <p className={cn("text-[10px]", isDarkTheme ? "text-zinc-400" : "text-zinc-500")}>
            Enter a website URL. Buddy can extract contents from this webpage to help reply.
          </p>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or https://..."
            className={cn(
              "text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-full",
              isDarkTheme 
                ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600" 
                : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) {
                handleAdd()
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2 mt-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!url.trim()}
            className={cn(
              "text-xs h-8 font-medium gap-1 text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
            )}
          >
            <Plus className="size-3.5" />
            Add URL
          </Button>
        </div>
      </div>
    </div>
  )
}
