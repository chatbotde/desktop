function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Failed to read image data"))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = src
  })
}

function canvasToPngBlob(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return Promise.reject(new Error("Canvas not available"))
  ctx.drawImage(img, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      "image/png"
    )
  })
}

/**
 * Produce a PNG blob for the given image URL.
 *
 * PNG is the only image type Chromium reliably accepts in `ClipboardItem`,
 * so JPEG/WebP results from providers must be re-encoded. We fetch the bytes
 * first and draw from a same-origin blob URL to avoid tainting the canvas.
 */
async function toPngBlob(imageUrl: string): Promise<Blob> {
  let objectUrl: string | null = null
  try {
    try {
      const response = await fetch(imageUrl, { mode: "cors" })
      if (response.ok) {
        const blob = await response.blob()
        if (blob.type === "image/png") return blob
        objectUrl = URL.createObjectURL(blob)
      }
    } catch {
      // Network/CORS failure — fall back to loading the URL directly.
    }

    const img = await loadImageElement(objectUrl ?? imageUrl)
    return await canvasToPngBlob(img)
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

export async function downloadImageUrl(imageUrl: string): Promise<void> {
  const blob = await toPngBlob(imageUrl)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  const pngBlob = await toPngBlob(imageUrl)

  // Prefer Electron's native clipboard when available — it writes a real
  // bitmap to the OS clipboard. Falls back to the web Clipboard API otherwise.
  const writeImage = window.electronAPI?.clipboard?.writeImage
  if (typeof writeImage === "function") {
    await writeImage(await blobToDataUrl(pngBlob))
    return
  }

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": pngBlob }),
  ])
}
