import { useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"
import { useAnimations } from "@/shared/providers/AnimationsProvider"
import { ANIMATION_REGISTRY } from "@/shared/registry/animationRegistry"
import {
    FighterPlane,
    Basketball,
    PaperPlane,
    Sun,
    Start,
    Skateboard,
    RollsRoyce,
    SitCat,
    TrimPlane,
    PitchDownPlane,
    LeftHand,
    RightHand
} from "@/components/lottie"
import { Sparkles, Bug } from "lucide-react"

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
                    Enable or disable specific interactive elements.
                </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
                {ANIMATION_REGISTRY.map((anim) => {
                    const isEnabled = isAnimationEnabled(anim.id);
                    // Map animation IDs to the actual SVG components
                    const getIcon = () => {
                        const iconProps = { width: 32, height: 32 };
                        switch (anim.id) {
                            case 'fighterplane': return <FighterPlane />;
                            case 'basketball': return <Basketball />;
                            case 'paperplane': return <PaperPlane />;
                            case 'sun': return <Sun />;
                            case 'start': return <Start />;
                            case 'skateboard': return <Skateboard />;
                            case 'rollsroyce': return <RollsRoyce />;
                            case 'cat': return <SitCat {...iconProps} />;
                            case 'trimplane': return <TrimPlane {...iconProps} />;
                            case 'pitchdownplane': return <PitchDownPlane {...iconProps} />;
                            case 'lefthand': return <LeftHand {...iconProps} />;
                            case 'righthand': return <RightHand {...iconProps} />;
                            case 'test': return <Bug className="w-8 h-8" />;
                            default: return <Sparkles className="w-8 h-8" />;
                        }
                    };

                    return (
                        <button
                            key={anim.id}
                            onClick={() => toggleAnimation(anim.id)}
                            title={`${anim.label}: ${anim.description}`}
                            className={getThemeClasses(isDark, {
                                dark: isEnabled
                                    ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_4px_20px_rgba(37,99,235,0.25)]"
                                    : "bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/60",
                                light: isEnabled
                                    ? "bg-blue-500/10 border-blue-400/50 text-blue-600 shadow-sm"
                                    : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"
                            }, `
                                flex items-center justify-center 
                                w-20 h-20 rounded-2xl border
                                transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                                hover:scale-105 active:scale-95
                                relative group overflow-hidden
                            `)}
                        >
                            {/* Icon Container */}
                            <div className={`
                                w-full h-full flex items-center justify-center pointer-events-none transform transition-all duration-500
                                ${isEnabled ? 'scale-110 opacity-100 rotate-0' : 'scale-90 opacity-40 grayscale group-hover:opacity-60'}
                            `}>
                                <div className="w-10 h-10 flex items-center justify-center">
                                    {getIcon()}
                                </div>
                            </div>

                            {/* Enable Status Glow Bar */}
                            {isEnabled && (
                                <div className="absolute bottom-0 left-2 right-2 h-1 bg-blue-500 rounded-t-full shadow-[0_-4px_12px_rgba(59,130,246,0.8)]" />
                            )}

                            {/* Hover Tooltip Overlay for Description */}
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider mb-1 px-2 py-0.5 bg-blue-600 rounded-full">
                                    {anim.label}
                                </span>
                                <span className="text-[9px] text-zinc-300 leading-tight">
                                    {anim.description}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
