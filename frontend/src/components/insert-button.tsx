import * as React from "react"
import { Button } from "@/components/ui/button"
import { CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"



interface InsertButtonProps extends React.ComponentProps<typeof Button> {
    /** The text content to insert into the target application */
    content: string
    /** Optional callback after successful insertion */
    onInsert?: () => void
    /** Whether to show a loading state during insertion */
    showLoading?: boolean
}

export function InsertButton({
    content,
    onInsert,
    className,
    showLoading = true,
    children,
    ...props
}: InsertButtonProps) {
    const [loading, setLoading] = React.useState(false)

    const handleInsert = async (e: React.MouseEvent) => {
        // Prevent default to avoid form submissions if inside a form
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent message click events

        if (!content) {
            console.warn("[InsertButton] No content to insert");
            return;
        }

        if (showLoading) setLoading(true)

        try {
            // Use the TSF API exposed by the preload script
            // This maps to the native tsf-framework's focusAndInsertText functionality
            if (window.tsfAPI?.focusAndInsertText) {
                const success = await window.tsfAPI.focusAndInsertText(content)
                if (!success) {
                    console.warn("TSF insert reported failure, but might have fallen back silently.")
                }
            } else {
                console.error("tsfAPI.focusAndInsertText is not available. Please ensure the Electron bridge is set up properly with chat-input-preload.js.")
                // Dev fallback for testing in browser without Electron
                console.log("Mock Insert (TSF not found):", content)
            }

            if (onInsert) {
                onInsert()
            }
        } catch (error) {
            console.error("Failed to insert text:", error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    return (
        <Button
            variant="default"
            size="sm"
            className={cn("gap-2 shadow-sm transition-all hover:shadow-md active:scale-95", className)}
            onClick={handleInsert}
            disabled={loading || !content || props.disabled}
            {...props}
        >
            {loading ? (
                children ? <span className="animate-pulse">...</span> : <span className="animate-pulse">Inserting...</span>
            ) : (
                children ?? (
                    <>
                        <CornerDownLeft className="h-3.5 w-3.5" />
                        Insert
                    </>
                )
            )}
        </Button>
    )
}
