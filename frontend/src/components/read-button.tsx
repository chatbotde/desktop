import { forwardRef } from "react"
import { Volume2, Loader2 } from "lucide-react"
import { AddButton, type AddButtonProps } from "./add-button"

/**
 * A preset button configured for text-to-speech actions.
 */
export const ReadButton = forwardRef<HTMLButtonElement, Omit<AddButtonProps, 'tooltip' | 'icon'>>(
    ({ isLoading, ...props }, ref) => (
        <AddButton
            ref={ref}
            icon={isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Volume2 className="size-3.5" />}
            tooltip="Read aloud"
            isLoading={isLoading}
            {...props}
        />
    )
)

ReadButton.displayName = "ReadButton"
