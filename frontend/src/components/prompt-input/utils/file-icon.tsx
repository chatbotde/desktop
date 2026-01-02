import { Image, Video, Music, Paperclip } from "lucide-react"

interface FileIconProps {
  file: File
  themeClasses: {
    icon: string
  }
}

export function getFileIcon(file: File, themeClasses: { icon: string }) {
  const fileType = file.type.toLowerCase()

  if (fileType.startsWith('image/')) {
    return <Image className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else if (fileType.startsWith('video/')) {
    return <Video className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else if (fileType.startsWith('audio/')) {
    return <Music className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else {
    return <Paperclip className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  }
}

