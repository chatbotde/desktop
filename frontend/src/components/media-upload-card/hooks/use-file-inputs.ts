import { useRef } from "react"

/**
 * Hook to manage file input refs
 */
export function useFileInputs() {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  return {
    imageInputRef,
    videoInputRef,
    audioInputRef,
    docInputRef,
  }
}

