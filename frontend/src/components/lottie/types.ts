import type { CSSProperties } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';

export interface LottieAnimationProps {
    /** Lottie animation JSON data */
    animationData: object;
    /** Whether to loop the animation */
    loop?: boolean;
    /** Whether to autoplay on mount */
    autoplay?: boolean;
    /** Playback speed (1 = normal) */
    speed?: number;
    /** Container styles */
    style?: CSSProperties;
    /** Container className */
    className?: string;
    /** Width of the animation */
    width?: number | string;
    /** Height of the animation */
    height?: number | string;
    /** Callback when animation completes */
    onComplete?: () => void;
    /** Callback when animation loops */
    onLoopComplete?: () => void;
    /** Callback when animation enters a segment */
    onEnterFrame?: (frame: number) => void;
    /** Callback when animation is loaded */
    onLoad?: () => void;
}

export interface LottiePlayerProps extends LottieAnimationProps {
    /** Show playback controls */
    showControls?: boolean;
    /** Initial play state */
    initialPlaying?: boolean;
}

export type { LottieRefCurrentProps };
