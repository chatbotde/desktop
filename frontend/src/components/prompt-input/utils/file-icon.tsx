import { Image, Video, AudioLines, Mic, Paperclip } from "lucide-react"

export function getFileIcon(file: File, themeClasses: { icon: string }) {
  const fileType = file.type.toLowerCase()

  if (fileType.startsWith('image/')) {
    return <Image className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else if (fileType.startsWith('video/')) {
    return <Video className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else if (fileType.startsWith('audio/')) {
    const Icon = file.name.startsWith('recording-') ? Mic : AudioLines
    return <Icon className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  } else {
    return <Paperclip className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
  }
}

