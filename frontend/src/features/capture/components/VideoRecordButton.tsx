/**
 * Video Record Button Component
 * A button to trigger video recording
 */

import { useState, useCallback } from 'react'
import { Video, Circle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib'

interface VideoRecordButtonProps {
    onStartRecording?: () => void
    onStopRecording?: () => void
    isRecording?: boolean
    variant?: 'default' | 'ghost' | 'outline' | 'secondary'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    showLabel?: boolean
}

/**
 * Video Record Button Component
 * Handles video recording trigger with visual feedback
 */
export function VideoRecordButton({
    onStartRecording,
    onStopRecording,
    isRecording = false,
    variant = 'ghost',
    size = 'default',
    className,
    showLabel = false
}: VideoRecordButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    const handleClick = useCallback(() => {
        if (isRecording) {
            onStopRecording?.()
        } else {
            onStartRecording?.()
        }
    }, [isRecording, onStartRecording, onStopRecording])

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "transition-all duration-200",
                isRecording && "text-red-500 hover:text-red-600",
                className
            )}
            aria-label={isRecording ? 'Stop recording' : 'Start video recording'}
        >
            {isRecording ? (
                <>
                    <Circle className={cn(
                        "h-4 w-4 fill-current",
                        isHovered ? "animate-none" : "animate-pulse"
                    )} />
                    {showLabel && <span className="ml-2">Recording...</span>}
                </>
            ) : (
                <>
                    <Video className="h-4 w-4" />
                    {showLabel && <span className="ml-2">Record</span>}
                </>
            )}
        </Button>
    )
}

export default VideoRecordButton
