import { useEffect, useRef, useState } from "react"

const DEFAULT_PHRASES = [
  "Generating video",
  "Creating frames",
  "Rendering motion",
  "Polishing pixels",
]

export function useTypingLoop(phrases: string[] = DEFAULT_PHRASES, tickMs = 80) {
  const [text, setText] = useState("")
  const phraseIndexRef = useRef(0)

  useEffect(() => {
    let charIndex = 0
    let deleting = false
    let pauseUntil = 0

    const id = setInterval(() => {
      const now = Date.now()
      if (now < pauseUntil) return

      const phrase = phrases[phraseIndexRef.current % phrases.length] ?? ""

      if (!deleting) {
        charIndex += 1
        setText(phrase.slice(0, charIndex))
        if (charIndex >= phrase.length) {
          deleting = true
          pauseUntil = now + 1200
        }
      } else {
        charIndex -= 1
        setText(phrase.slice(0, charIndex))
        if (charIndex <= 0) {
          deleting = false
          phraseIndexRef.current = (phraseIndexRef.current + 1) % phrases.length
          pauseUntil = now + 300
        }
      }
    }, tickMs)

    return () => clearInterval(id)
  }, [phrases, tickMs])

  return text
}
