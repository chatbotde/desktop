import { useRef, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';

export interface DotLottieAnimationProps {
    /** URL or path to .lottie file, or a Lottie JSON URL */
    src: string;
    /** Whether to loop the animation */
    loop?: boolean;
    /** Whether to autoplay on mount */
    autoplay?: boolean;
    /** Playback speed (1 = normal) */
    speed?: number;
    /** Container className */
    className?: string;
    /** Width of the animation */
    width?: number | string;
    /** Height of the animation */
    height?: number | string;
    /** Callback when animation completes */
    onComplete?: () => void;
    /** Callback when animation starts playing */
    onPlay?: () => void;
    /** Callback when animation pauses */
    onPause?: () => void;
    /** Callback to get the dotLottie instance for external control */
    onReady?: (dotLottie: DotLottie) => void;
    /** Background color */
    backgroundColor?: string;
    /** Render mode: 'svg' or 'canvas' */
    renderMode?: 'svg' | 'canvas';
}

/**
 * A dotLottie animation component - uses optimized .lottie format (up to 80% smaller files)
 * 
 * @example
 * ```tsx
 * // Using a .lottie URL
 * <DotLottieAnimation
 *   src="https://lottie.host/xxx/xxx.lottie"
 *   loop
 *   autoplay
 *   width={200}
 *   height={200}
 * />
 * 
 * // Using a Lottie JSON URL (also works!)
 * <DotLottieAnimation
 *   src="https://lottie.host/xxx/xxx.json"
 *   loop
 * />
 * ```
 */
export default function DotLottieAnimation({
    src,
    loop = true,
    autoplay = true,
    speed = 1,
    className,
    width,
    height,
    onComplete,
    onPlay,
    onPause,
    onReady,
    backgroundColor,
    // renderMode can be used in future for canvas vs svg rendering
}: DotLottieAnimationProps) {
    const dotLottieRef = useRef<DotLottie | null>(null);

    const handleDotLottieRef = useCallback((dotLottie: DotLottie) => {
        dotLottieRef.current = dotLottie;

        // Set speed if not default
        if (speed !== 1) {
            dotLottie.setSpeed(speed);
        }

        // Add event listeners
        if (onComplete) {
            dotLottie.addEventListener('complete', onComplete);
        }
        if (onPlay) {
            dotLottie.addEventListener('play', onPlay);
        }
        if (onPause) {
            dotLottie.addEventListener('pause', onPause);
        }

        // Notify parent that animation is ready
        onReady?.(dotLottie);
    }, [speed, onComplete, onPlay, onPause, onReady]);

    const style: React.CSSProperties = {
        width: width ?? '100%',
        height: height ?? '100%',
        backgroundColor,
    };

    return (
        <div className={className} style={style}>
            <DotLottieReact
                src={src}
                loop={loop}
                autoplay={autoplay}
                dotLottieRefCallback={handleDotLottieRef}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}

export type { DotLottie };
