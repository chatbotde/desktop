import { forwardRef } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"

export type AddButtonSize = "xs" | "sm" | "md" | "lg"
export type AddButtonVariant = "default" | "ghost" | "outline" | "primary"

export interface AddButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
    /** Size of the button */
    size?: AddButtonSize
    /** Visual variant of the button */
    variant?: AddButtonVariant
    /** Whether to use dark theme styling */
    isDarkTheme?: boolean
    /** Custom icon to use instead of Plus */
    icon?: React.ReactNode
    /** Show label text next to the icon */
    label?: string
    /** Show icon only (no label, compact) */
    iconOnly?: boolean
    /** Whether the button is in a loading state */
    isLoading?: boolean
    /** Tooltip text */
    tooltip?: string
}

const sizeClasses: Record<AddButtonSize, { button: string; icon: string }> = {
    xs: {
        button: "h-5 w-5 min-w-5",
        icon: "size-3"
    },
    sm: {
        button: "h-6 w-6 min-w-6",
        icon: "size-3.5"
    },
    md: {
        button: "h-8 w-8 min-w-8",
        icon: "size-4"
    },
    lg: {
        button: "h-10 w-10 min-w-10",
        icon: "size-5"
    }
}

const sizeClassesWithLabel: Record<AddButtonSize, { button: string; icon: string }> = {
    xs: {
        button: "h-5 px-2 gap-1",
        icon: "size-3"
    },
    sm: {
        button: "h-6 px-2.5 gap-1.5",
        icon: "size-3.5"
    },
    md: {
        button: "h-8 px-3 gap-2",
        icon: "size-4"
    },
    lg: {
        button: "h-10 px-4 gap-2",
        icon: "size-5"
    }
}

const labelSizeClasses: Record<AddButtonSize, string> = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
}

/**
 * A reusable Add button component that can be used throughout the application.
 * Commonly used for adding content to prompts, lists, or other interactive elements.
 * 
 * @example
 * // Basic usage
 * <AddButton onClick={handleAdd} />
 * 
 * @example
 * // With label
 * <AddButton label="Add to prompt" onClick={handleAdd} />
 * 
 * @example
 * // Different sizes
 * <AddButton size="xs" onClick={handleAdd} />
 * <AddButton size="lg" onClick={handleAdd} />
 * 
 * @example
 * // Primary variant
 * <AddButton variant="primary" onClick={handleAdd} />
 */
export const AddButton = forwardRef<HTMLButtonElement, AddButtonProps>(
    ({
        size = "sm",
        variant = "ghost",
        isDarkTheme = true,
        icon,
        label,
        iconOnly = true,
        isLoading = false,
        tooltip,
        className,
        disabled,
        onClick,
        ...props
    }, ref) => {
        const hasLabel = label && !iconOnly
        const sizes = hasLabel ? sizeClassesWithLabel[size] : sizeClasses[size]

        // Theme-aware hover styles for ghost variant
        const getVariantClasses = () => {
            switch (variant) {
                case "ghost":
                    return cn(
                        "bg-transparent",
                        isDarkTheme
                            ? "hover:bg-slate-700/50 text-slate-100"
                            : "hover:bg-slate-100 text-slate-900"
                    )
                case "outline":
                    return cn(
                        "bg-transparent border",
                        isDarkTheme
                            ? "border-slate-700 hover:bg-slate-700/50 text-slate-100"
                            : "border-slate-200 hover:bg-slate-100 text-slate-900"
                    )
                case "primary":
                    return cn(
                        "bg-blue-500 hover:bg-blue-600 text-white",
                        "shadow-sm"
                    )
                default:
                    return cn(
                        isDarkTheme
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                            : "bg-white hover:bg-slate-50 text-slate-900 shadow-sm"
                    )
            }
        }

        const iconElement = icon ?? <Plus className={cn(sizes.icon, isLoading && "animate-spin")} />

        return (
            <Button
                ref={ref}
                variant="ghost"
                size="icon"
                className={cn(
                    "rounded-full shrink-0 transition-all duration-200",
                    sizes.button,
                    getVariantClasses(),
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                onClick={onClick}
                disabled={disabled || isLoading}
                title={tooltip ?? (label || "Add")}
                {...props}
            >
                {iconElement}
                {hasLabel && (
                    <span className={cn("font-medium", labelSizeClasses[size])}>
                        {label}
                    </span>
                )}
            </Button>
        )
    }
)

AddButton.displayName = "AddButton"

/**
 * A preset AddButton configured for adding content to prompts.
 * Uses appropriate styling for clipboard pill and prompt input contexts.
 */
export const AddToPromptButton = forwardRef<HTMLButtonElement, AddButtonProps>(
    (props, ref) => (
        <AddButton
            ref={ref}
            tooltip="Add to prompt"
            {...props}
        />
    )
)

AddToPromptButton.displayName = "AddToPromptButton"

/**
 * A compact add button for inline use in lists or compact UIs.
 */
export const CompactAddButton = forwardRef<HTMLButtonElement, Omit<AddButtonProps, 'size'>>(
    (props, ref) => (
        <AddButton
            ref={ref}
            size="xs"
            {...props}
        />
    )
)

CompactAddButton.displayName = "CompactAddButton"

export default AddButton
