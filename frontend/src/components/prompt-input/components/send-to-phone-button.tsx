import { useState } from 'react'
import { Smartphone, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sendFileToPhone,
  sendFileToPhoneErrorMessage,
} from '@/lib/remote-pad/send-file-to-phone'

interface SendToPhoneHoverButtonProps {
  file: File
  className?: string
  iconClassName?: string
  title?: string
}

export function SendToPhoneHoverButton({
  file,
  className,
  iconClassName = 'h-4 w-4',
  title = 'Send to phone',
}: SendToPhoneHoverButtonProps) {
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSend = async (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (sending) return

    setSending(true)
    setFeedback(null)
    try {
      const result = await sendFileToPhone(file)
      if (result.ok) {
        setFeedback('Sent!')
      } else {
        setFeedback(sendFileToPhoneErrorMessage(result.reason))
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Send failed')
    } finally {
      setSending(false)
      window.setTimeout(() => setFeedback(null), 2500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={sending}
      title={feedback ?? title}
      aria-label={title}
      className={cn(
        'flex items-center justify-center rounded-full transition-colors',
        'bg-black/55 text-white hover:bg-black/75 disabled:opacity-60',
        className,
      )}
    >
      {sending ? (
        <Loader2 className={cn(iconClassName, 'animate-spin')} />
      ) : (
        <Smartphone className={iconClassName} />
      )}
    </button>
  )
}
