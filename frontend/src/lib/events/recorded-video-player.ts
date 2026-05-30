export const OPEN_RECORDED_VIDEO_PLAYER_EVENT = 'open-recorded-video-player'

export interface OpenRecordedVideoPlayerDetail {
  file: File
  name?: string
}

export function openRecordedVideoPlayer(file: File, name?: string) {
  window.dispatchEvent(
    new CustomEvent<OpenRecordedVideoPlayerDetail>(OPEN_RECORDED_VIDEO_PLAYER_EVENT, {
      detail: { file, name: name ?? file.name },
    }),
  )
}
