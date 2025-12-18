import { VideoScroll } from '@/components/container'

interface VideoScrollSectionProps {
  showVideoScroll: boolean
  onClose: () => void
}

export const VideoScrollSection = ({ showVideoScroll, onClose }: VideoScrollSectionProps) => {
  if (!showVideoScroll) return null

  return (
    <div data-no-clickthrough>
      <VideoScroll onClose={onClose} />
    </div>
  )
}
