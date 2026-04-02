import { forwardRef, useState, useSyncExternalStore, useCallback } from "react"
import { Copy, Check } from "lucide-react"
import { AddButton, type AddButtonProps } from "./add-button"

/**
 * A preset button configured for copying text to clipboard.
 */
export const CopyButton = forwardRef<HTMLButtonElement, Omit<AddButtonProps, 'tooltip' | 'icon'>>(
    (props, ref) => {
        const [copied, setCopied] = useState(false)

        // Auto-reset copied state after 2 seconds - using syncExternalStore
        useSyncExternalStore(
            useCallback(() => {
                if (copied) {
                    const timeout = setTimeout(() => setCopied(false), 2000)
                    return () => clearTimeout(timeout)
                }
                return () => {}
            }, [copied]),
            () => null,
            () => null
        )

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            setCopied(true)
            if (props.onClick) props.onClick(e)
        }

        return (
            <AddButton
                ref={ref}
                icon={copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                tooltip={copied ? "Copied!" : "Copy to clipboard"}
                {...props}
                onClick={handleClick}
            />
        )
    }
)

CopyButton.displayName = "CopyButton"
