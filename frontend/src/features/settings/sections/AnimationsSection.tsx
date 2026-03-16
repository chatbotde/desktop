import { useIsDark } from "@/shared/providers"
import { getThemeClasses } from "@/shared/utils/theme"
import { useAnimations } from "@/shared/providers/AnimationsProvider"
import { ANIMATION_REGISTRY } from "@/shared/registry/animationRegistry"
import {
    SitCat,
    TrimPlane,
    PitchDownPlane
} from "@/components/lottie"
import {
    BasketballSvg as Basketball,
    PaperPlaneSvg as PaperPlane,
    SunSvg as Sun,
    StartSvg as Start,
    SkateboardSvg as Skateboard,
    RollsRoyceSvg as RollsRoyce,
    FighterPlaneSvg as FighterPlane,
    LeftHandSvg as LeftHand,
    RightHandSvg as RightHand
} from "@/components/lottie/assets"
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

            <div className="flex flex-wrap gap-1 mt-4">
                {ANIMATION_REGISTRY.map((anim) => {
                    const isEnabled = isAnimationEnabled(anim.id);
                    // Map animation IDs to the actual SVG components
                    const getIcon = () => {
                        const iconProps = { width: 32, height: 32 };
                        switch (anim.id) {
                            case 'fighterplane': return <FighterPlane {...iconProps} iconMode />;
                            case 'basketball': return <Basketball {...iconProps} />;
                            case 'paperplane': return <PaperPlane {...iconProps} iconMode />;
                            case 'sun': return <Sun {...iconProps} />;
                            case 'start': return <Start {...iconProps} />;
                            case 'skateboard': return <Skateboard {...iconProps} />;
                            case 'rollsroyce': return <RollsRoyce {...iconProps} />;
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
                                dark: isEnabled ? "bg-zinc-700/80 shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-1 ring-zinc-500/30" : "hover:bg-zinc-800/50",
                                light: isEnabled ? "bg-zinc-200/80 shadow-md ring-1 ring-zinc-300" : "hover:bg-zinc-100"
                            }, `
                                w-11 h-11 flex items-center justify-center rounded-lg
                                transition-all duration-200 ease-in-out
                            `)}
                        >
                            <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${isEnabled ? 'scale-[1.15]' : 'scale-100'}`}>
                                <div className="flex items-center justify-center text-zinc-500 pointer-events-none">
                                    {getIcon()}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
