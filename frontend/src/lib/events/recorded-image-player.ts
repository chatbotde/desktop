export const OPEN_RECORDED_IMAGE_PLAYER_EVENT = 'open-recorded-image-player'

export interface OpenRecordedImagePlayerDetail {
  file?: File
  src?: string
  name?: string
}

export function openRecordedImagePlayer(file: File, name?: string) {
  window.dispatchEvent(
    new CustomEvent<OpenRecordedImagePlayerDetail>(OPEN_RECORDED_IMAGE_PLAYER_EVENT, {
      detail: { file, name: name ?? file.name },
    }),
  )
}

export function openRecordedImageViewer(src: string, name?: string) {
  window.dispatchEvent(
    new CustomEvent<OpenRecordedImagePlayerDetail>(OPEN_RECORDED_IMAGE_PLAYER_EVENT, {
      detail: { src, name },
    }),
  )
}
