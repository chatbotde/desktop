import { Switch } from "@/shared/components/ui/switch"
import { useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"
import { useAnimations } from "@/shared/providers/AnimationsProvider"
import { ANIMATION_REGISTRY } from "@/shared/registry/animationRegistry"

/**
 * AnimationsSection — Settings panel for enabling/disabling animations.
 * Reads entirely from ANIMATION_REGISTRY — no separate list to maintain.
 */
export function AnimationsSection() {
    const isDark = useIsDark()
    const { isAnimationEnabled, toggleAnimation } = useAnimations()

    return (
        <div className="space-y-4">
            <div className="min-w-0">
                <div className={getThemeClasses(isDark, {
                    dark: "text-zinc-100",
                    light: "text-zinc-900"
                }, "text-sm font-medium")}>
                    Animations
                </div>
                <p className={getThemeClasses(isDark, {
                    dark: "text-zinc-400",
                    light: "text-zinc-600"
                }, "text-xs mt-1")}>
                    Enable or disable specific lottie animations that overlay on your screen.
                </p>
            </div>

            <div className="space-y-3 mt-4">
                {ANIMATION_REGISTRY.map((anim) => (
                    <div
                        key={anim.id}
                        className={getThemeClasses(isDark, {
                            dark: "border-zinc-800 bg-zinc-900/50",
                            light: "border-zinc-200 bg-zinc-50"
                        }, "flex items-center justify-between p-4 rounded-lg border")}
                    >
                        <div className="flex flex-col gap-1 pr-4 min-w-0 flex-1">
                            <div className={getThemeClasses(isDark, {
                                dark: "text-zinc-100",
                                light: "text-zinc-900"
                            }, "text-sm font-medium")}>
                                {anim.label}
                            </div>
                            <div className={getThemeClasses(isDark, {
                                dark: "text-zinc-400",
                                light: "text-zinc-600"
                            }, "text-xs mt-0.5 line-clamp-2")}>
                                {anim.description}
                            </div>
                        </div>
                        <Switch
                            checked={isAnimationEnabled(anim.id)}
                            onCheckedChange={() => toggleAnimation(anim.id)}
                            aria-label={`Toggle ${anim.label}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
