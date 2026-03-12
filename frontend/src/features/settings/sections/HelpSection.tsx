import { cn } from "@/shared/lib/utils"

interface HelpSectionProps {
    isDarkTheme?: boolean
}

export function HelpSection({
    isDarkTheme = false,
}: HelpSectionProps) {
    const textColor = isDarkTheme ? "text-zinc-400" : "text-zinc-600"
    const titleColor = isDarkTheme ? "text-white" : "text-zinc-900"
    const cardBg = isDarkTheme ? "bg-zinc-800" : "bg-zinc-50"
    const cardBorder = isDarkTheme ? "border-zinc-700" : "border-zinc-200"

    const shortcuts = [
        {
            description: "Close the application",
            keys: ["Ctrl", "H"],
        },
        {
            description: "Hide/Show Interface Window",
            keys: ["Ctrl", "I"],
        },
        {
            description: "Assistant Global",
            keys: ["Ctrl", "\\"],
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className={cn("text-lg font-semibold mb-4", titleColor)}>
                    Help & Shortcuts
                </h3>
                <p className={cn("text-sm mb-6", textColor)}>
                    Keyboard shortcuts and help for using the application.
                </p>
            </div>

            <div className="space-y-4">
                <h4 className={cn("text-sm font-medium", titleColor)}>Keyboard Shortcuts</h4>

                <div className="grid gap-3">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                cardBg,
                                cardBorder
                            )}
                        >
                            <span className={cn("text-sm", titleColor)}>
                                {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {shortcut.keys.map((key, kIndex) => (
                                    <span
                                        key={kIndex}
                                        className={cn(
                                            "inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded text-xs font-medium border shadow-sm",
                                            isDarkTheme
                                                ? "bg-zinc-900 border-zinc-700 text-zinc-300"
                                                : "bg-white border-zinc-200 text-zinc-600"
                                        )}
                                    >
                                        {key}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
