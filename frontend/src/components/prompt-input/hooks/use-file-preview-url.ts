import { useEffect, useState } from 'react'

export function useFilePreviewUrl(file: File): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const reader = new FileReader()
    reader.onload = () => {
      if (!cancelled && typeof reader.result === 'string') {
        setPreviewUrl(reader.result)
      }
    }
    reader.onerror = () => {
      if (!cancelled) setPreviewUrl(null)
    }
    reader.readAsDataURL(file)

    return () => {
      cancelled = true
    }
  }, [file])

  return previewUrl
}
