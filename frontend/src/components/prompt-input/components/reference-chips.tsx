import { AtSign, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileRemoveButton } from "./file-remove-button"
import type { PromptReference } from "../types/prompt-reference"

interface ReferenceChipsProps {
  references: PromptReference[]
  onRemoveReference: (id: string) => void
  themeClasses: {
    fileItem: string
    fileText?: string
    icon: string
  }
  hoverClass: string
  variant?: "expanded" | "collapsed"
}

export function ReferenceChips({
  references,
  onRemoveReference,
  themeClasses,
  hoverClass,
  variant = "expanded",
}: ReferenceChipsProps) {
  if (references.length === 0) return null

  if (variant === "collapsed") {
    return (
      <>
        {references.map((ref) => (
          <div
            key={ref.id}
            className={cn(
              "flex items-center justify-center h-6 w-6 rounded bg-muted shrink-0 cursor-pointer",
              themeClasses.fileItem
            )}
            onClick={(e) => {
              e.stopPropagation()
              onRemoveReference(ref.id)
            }}
            title={ref.label}
          >
            <ReferenceChipIcon reference={ref} themeClasses={themeClasses} />
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {references.map((ref) => (
        <div
          key={ref.id}
          className={cn(
            "flex items-center gap-2 rounded-full px-2 py-1 text-xs border max-w-[220px]",
            themeClasses.fileItem,
            ref.kind === "integration" && ref.meta?.connected && "border-emerald-500/50"
          )}
          onClick={(e) => e.stopPropagation()}
          title={ref.kind === "note" ? ref.payload : `${ref.label} integration`}
        >
          <ReferenceChipIcon reference={ref} themeClasses={themeClasses} />
          <span className={cn("truncate", themeClasses.fileText)}>{ref.label}</span>
          <FileRemoveButton
            onClick={(e) => {
              e.stopPropagation()
              onRemoveReference(ref.id)
            }}
            ariaLabel={`Remove reference ${ref.label}`}
            themeClasses={themeClasses}
            hoverClass={hoverClass}
            size="sm"
          />
        </div>
      ))}
    </>
  )
}

function ReferenceChipIcon({
  reference,
  themeClasses,
}: {
  reference: PromptReference
  themeClasses: { icon: string }
}) {
  if (reference.kind === "integration" && reference.meta?.logo) {
    return (
      <img
        src={reference.meta.logo}
        alt=""
        className="h-4 w-4 rounded-sm object-contain shrink-0"
      />
    )
  }
  if (reference.kind === "integration") {
    return <AtSign className={`size-3 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
  }
  return <FileText className={`size-3 ${themeClasses.icon} shrink-0`} aria-hidden="true" />
}
