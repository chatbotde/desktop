import { useCallback } from "react"
import type { MediaAttachment } from '@/features/chat'

export function useFileToAttachment() {
  const convertFilesToAttachments = useCallback(async (filesToConvert: File[]): Promise<MediaAttachment[]> => {
    const attachments: MediaAttachment[] = []

    for (const file of filesToConvert) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // Process image files
        if (file.type.startsWith('image/')) {
          // Get image dimensions
          const dimensions = await new Promise<{ width: number; height: number } | undefined>((resolve) => {
            const img = new Image()
            img.onload = () => {
              resolve({ width: img.width, height: img.height })
            }
            img.onerror = () => resolve(undefined)
            img.src = dataUrl
          })

          attachments.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
            source: 'upload',
            mediaType: 'image',
            dimensions
          })
        }
        // Process video files
        else if (file.type.startsWith('video/')) {
          // Get video dimensions and duration
          const videoInfo = await new Promise<{ dimensions?: { width: number; height: number }, duration?: number }>((resolve) => {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
              resolve({
                dimensions: { width: video.videoWidth, height: video.videoHeight },
                duration: video.duration
              })
            }
            video.onerror = () => resolve({})
            video.src = dataUrl
          })

          attachments.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
            source: 'upload',
            mediaType: 'video',
            dimensions: videoInfo.dimensions,
            duration: videoInfo.duration
          })
        }
      } catch (error) {
        console.error('Error converting file to attachment:', error)
      }
    }

    return attachments
  }, [])

  return { convertFilesToAttachments }
}

