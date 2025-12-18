import { forwardRef } from "react"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"

export type ExpandButtonSize = "xs" | "sm" | "md" | "lg"
export type ExpandButtonVariant = "default" | "ghost" | "outline" | "primary" | "gradient"
export type ExpandDirection = "up" | "down" | "left" | "right"
export type IconStyle = "chevron" | "double-chevron" | "maximize"

interface ExpandButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
    /** Whether the component is in expanded state */
    isExpanded?: boolean
    /** Direction the expand arrow should point when collapsed (default: "up") */
    direction?: ExpandDirection
    /** Size of the button */
    size?: ExpandButtonSize
    /** Visual variant of the button */
    variant?: ExpandButtonVariant
    /** Whether to use dark theme styling */
    isDarkTheme?: boolean
    /** Show label text next to the icon */
    label?: string
    /** Custom labels for expanded/collapsed states */
    expandedLabel?: string
    /** Custom labels for expanded/collapsed states */
    collapsedLabel?: string
    /** Show icon only (no label, compact) */
    iconOnly?: boolean
    /** Icon style to use */
    iconStyle?: IconStyle
    /** Whether to animate the icon rotation */
    animateIcon?: boolean
    /** Tooltip text */
    tooltip?: string
}

const sizeClasses: Record<ExpandButtonSize, { button: string; icon: string }> = {
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

const sizeClassesWithLabel: Record<ExpandButtonSize, { button: string; icon: string }> = {
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

const labelSizeClasses: Record<ExpandButtonSize, string> = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
}

// Get the appropriate icon based on direction and style
const getIcon = (direction: ExpandDirection, iconStyle: IconStyle, isExpanded: boolean) => {
    // For maximize style, use Maximize2/Minimize2
    if (iconStyle === "maximize") {
        return isExpanded ? Minimize2 : Maximize2
    }

    // For animated icons, we'll always return the "collapsed" direction icon
    // and rotate it via CSS when expanded
    const IconMap = iconStyle === "double-chevron"
        ? { up: ChevronsUp, down: ChevronsDown, left: ChevronLeft, right: ChevronRight }
        : { up: ChevronUp, down: ChevronDown, left: ChevronLeft, right: ChevronRight }

    return IconMap[direction]
}

// Get rotation for animated icon
const getIconRotation = (direction: ExpandDirection, isExpanded: boolean, animateIcon: boolean) => {
    if (!animateIcon || !isExpanded) return ""

    switch (direction) {
        case "up": return "rotate-180"
        case "down": return "rotate-180"
        case "left": return "rotate-180"
        case "right": return "rotate-180"
        default: return ""
    }
}

/**
 * A reusable Expand/Collapse button component that can be used throughout the application.
 * Commonly used for expanding panels, showing more content, or toggling collapsed states.
 * 
 * @example
 * // Basic usage (toggles between up/down)
 * <ExpandButton isExpanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)} />
 * 
 * @example
 * // With labels
 * <ExpandButton 
 *   isExpanded={isExpanded} 
 *   expandedLabel="Show less" 
 *   collapsedLabel="Show more" 
 *   iconOnly={false}
 *   onClick={handleToggle} 
 * />
 * 
 * @example
 * // Gradient variant (like ExpandToggle)
 * <ExpandButton variant="gradient" isExpanded={isExpanded} onClick={handleToggle} />
 * 
 * @example
 * // Different directions
 * <ExpandButton direction="down" isExpanded={isExpanded} onClick={handleToggle} />
 * <ExpandButton direction="left" isExpanded={isExpanded} onClick={handleToggle} />
 */
export const ExpandButton = forwardRef<HTMLButtonElement, ExpandButtonProps>(
    ({
        isExpanded = false,
        direction = "up",
        size = "sm",
        variant = "ghost",
        isDarkTheme = true,
        label,
        expandedLabel,
        collapsedLabel,
        iconOnly = true,
        iconStyle = "chevron",
        animateIcon = true,
        tooltip,
        className,
        disabled,
        onClick,
        ...props
    }, ref) => {
        const hasLabel = !iconOnly && (label || expandedLabel || collapsedLabel)
        const sizes = hasLabel ? sizeClassesWithLabel[size] : sizeClasses[size]

        // Determine the display label
        const displayLabel = label || (isExpanded ? expandedLabel : collapsedLabel)

        // Theme-aware hover styles
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
                case "gradient":
                    return cn(
                        "text-blue-100 hover:text-white border-2",
                        isExpanded
                            ? "bg-gradient-to-r from-blue-700 via-blue-600 to-violet-700 border-blue-500 shadow-lg"
                            : "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 border-blue-400/70 shadow-md",
                        "hover:scale-[1.03] active:scale-95 backdrop-blur-md"
                    )
                default:
                    return cn(
                        isDarkTheme
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                            : "bg-white hover:bg-slate-50 text-slate-900 shadow-sm"
                    )
            }
        }

        const Icon = getIcon(direction, iconStyle, isExpanded)
        const iconRotation = getIconRotation(direction, isExpanded, animateIcon)

        // Generate tooltip
        const defaultTooltip = isExpanded ? "Collapse" : "Expand"
        const finalTooltip = tooltip ?? displayLabel ?? defaultTooltip

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
                disabled={disabled}
                title={finalTooltip}
                {...props}
            >
                <Icon className={cn(
                    sizes.icon,
                    "transition-transform duration-200",
                    iconRotation
                )} />
                {hasLabel && displayLabel && (
                    <span className={cn("font-medium", labelSizeClasses[size])}>
                        {displayLabel}
                    </span>
                )}
            </Button>
        )
    }
)

ExpandButton.displayName = "ExpandButton"

/**
 * A preset ExpandButton configured for "Show more/less" toggle actions.
 * Uses gradient styling similar to ExpandToggle component.
 */
export const ShowMoreButton = forwardRef<HTMLButtonElement, Omit<ExpandButtonProps, 'expandedLabel' | 'collapsedLabel' | 'iconOnly' | 'variant'>>(
    ({ isExpanded, size = "md", ...props }, ref) => (
        <ExpandButton
            ref={ref}
            isExpanded={isExpanded}
            expandedLabel="Show less"
            collapsedLabel="Show more"
            iconOnly={false}
            variant="gradient"
            size={size}
            direction="down"
            {...props}
        />
    )
)

ShowMoreButton.displayName = "ShowMoreButton"

/**
 * A compact expand button for inline use in headers or toolbars.
 */
export const CompactExpandButton = forwardRef<HTMLButtonElement, Omit<ExpandButtonProps, 'size'>>(
    (props, ref) => (
        <ExpandButton
            ref={ref}
            size="xs"
            {...props}
        />
    )
)

CompactExpandButton.displayName = "CompactExpandButton"

/**
 * An expand button using maximize/minimize icons instead of chevrons.
 * Useful for panel or window expansion.
 */
export const MaximizeButton = forwardRef<HTMLButtonElement, Omit<ExpandButtonProps, 'iconStyle'>>(
    ({ isExpanded, ...props }, ref) => (
        <ExpandButton
            ref={ref}
            isExpanded={isExpanded}
            iconStyle="maximize"
            tooltip={isExpanded ? "Minimize" : "Maximize"}
            {...props}
        />
    )
)

MaximizeButton.displayName = "MaximizeButton"

export default ExpandButton
