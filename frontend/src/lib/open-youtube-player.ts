import { extractVideoId } from '@/components/prompt-input/youtube-video-player'
import { openYoutubePlayerState } from '@/lib/youtube-player-store'

const YOUTUBE_PREFIX = '[YouTube] '
const YOUTUBE_URL_REGEX = /(youtube\.com|youtu\.be)\//i

/** Show the standalone YouTube overlay; pass a URL to start playback. */
export function openYoutubePlayer(url?: string) {
  openYoutubePlayerState(url ?? '')
}

/** Extract a playable YouTube URL from a clipboard chip string. */
export function parseYoutubeClipboardUrl(item: string): string | null {
  if (!item) return null

  let candidate = item.trim()
  if (candidate.startsWith(YOUTUBE_PREFIX)) {
    candidate = (candidate.slice(YOUTUBE_PREFIX.length).split('\n')[0] ?? '').trim()
  }

  if (!YOUTUBE_URL_REGEX.test(candidate) || !extractVideoId(candidate)) {
    return null
  }

  return candidate
}
