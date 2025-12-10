import * as React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"



interface ReplaceButtonProps extends React.ComponentProps<typeof Button> {
    /** The text content to replace the selection with */
    content: string
    /** Optional callback after successful replacement */
    onReplace?: () => void
    /** Whether to show a loading state during replacement */
    showLoading?: boolean
}

export function ReplaceButton({
    content,
    onReplace,
    className,
    showLoading = true,
    children,
    ...props
}: ReplaceButtonProps) {
    const [loading, setLoading] = React.useState(false)

    const handleReplace = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation

        if (!content) {
            console.warn("[ReplaceButton] No content to replace with");
            return;
        }

        if (showLoading) setLoading(true)

        try {
            // Use the TSF API exposed by the preload script
            // This maps to the native tsf-framework's focusAndReplaceText functionality
            if (window.tsfAPI?.focusAndReplaceText) {
                const success = await window.tsfAPI.focusAndReplaceText(content)
                if (!success) {
                    console.warn("[ReplaceButton] TSF replace reported failure.")
                }
            } else {
                console.error("tsfAPI.focusAndReplaceText is not available. Please ensure the Electron bridge is set up.")
                // Dev fallback
                console.log("Mock Replace:", content)
            }

            if (onReplace) {
                onReplace()
            }
        } catch (error) {
            console.error("Failed to replace text:", error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    return (
        <Button
            variant="secondary"
            size="sm"
            className={cn("gap-2 shadow-sm transition-all hover:shadow-md active:scale-95", className)}
            onClick={handleReplace}
            disabled={loading || !content || props.disabled}
            {...props}
        >
            {loading ? (
                children ? <span className="animate-pulse">...</span> : <span className="animate-pulse">Replacing...</span>
            ) : (
                children ?? (
                    <>
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Replace Selection
                    </>
                )
            )}
        </Button>
    )
}
