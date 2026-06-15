"use client"

import { useState } from "react"
import { Copy, Download, Check, Maximize2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { GLOBAL_THEME } from "@/global/theme"
import { copyImageToClipboard, downloadImageUrl } from "./image-utils"
import type { ImageGenerationActionsProps } from "./types"

const DROPDOWN_Z = GLOBAL_THEME.zIndex.modal + 20
const MENU_ITEM_CLASS =
  "text-white focus:bg-white/10 focus:text-white [&_svg]:text-white"

/** Toolbar menu — lives on the window shell so it stays above resize handles. */
export function ImageGenerationActions({
  imageUrl,
  onFitToWindow,
}: ImageGenerationActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyImageToClipboard(imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy image:", error)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadImageUrl(imageUrl)
    } catch (error) {
      console.error("Failed to download image:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-black/90"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[10rem] !z-[3020] border-white/10 bg-black/90 text-white shadow-xl backdrop-blur-md"
        style={{ zIndex: DROPDOWN_Z }}
      >
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          onSelect={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy image"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          onSelect={() => onFitToWindow?.()}
        >
          <Maximize2 className="h-4 w-4" />
          Fit to window
        </DropdownMenuItem>
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          onSelect={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
