import { ClipboardPill } from "../clipboard"
import { useCallback } from "react"

interface SmartClipboardPillProps {
  onClipboardItemAdd?: (text: string) => void
  setInput: (value: string) => void
  input: string
  onFilesAdded?: (files: File[]) => void
  isDarkTheme: boolean
}

export function SmartClipboardPill({
  onClipboardItemAdd,
  setInput,
  input,
  onFilesAdded,
  isDarkTheme,
}: SmartClipboardPillProps) {
  const handleAdd = useCallback(
    (content: string | { text?: string }) => {
      if (typeof content === "string") {
        onClipboardItemAdd
          ? onClipboardItemAdd(content)
          : setInput(input + (input ? " " : "") + content)
      } else if (content.text) {
        onClipboardItemAdd
          ? onClipboardItemAdd(content.text)
          : setInput(input + (input ? " " : "") + content.text)
      }
    },
    [onClipboardItemAdd, setInput, input]
  )

  const handleAddImage = useCallback(
    (dataUrl: string) => {
      if (onFilesAdded) {
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `clipboard-image-${Date.now()}.png`, {
              type: "image/png",
            })
            onFilesAdded([file])
          })
          .catch((err) => console.error("Failed to convert clipboard image:", err))
      }
    },
    [onFilesAdded]
  )

  return (
    <ClipboardPill
      onAdd={handleAdd}
      onAddImage={handleAddImage}
      isDarkTheme={isDarkTheme}
    />
  )
}

