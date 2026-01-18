import { useRef, useState, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface DotLottiePlayerProps {
    /** URL or path to .lottie file */
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
    /** Show playback controls */
    showControls?: boolean;
    /** Callback when animation completes */
    onComplete?: () => void;
}

/**
 * A dotLottie player with built-in playback controls
 * 
 * @example
 * ```tsx
 * <DotLottiePlayer
 *   src="https://lottie.host/xxx/xxx.lottie"
 *   showControls
 *   loop={false}
 *   width={200}
 *   height={200}
 * />
 * ```
 */
export default function DotLottiePlayer({
    src,
    loop = true,
    autoplay = true,
    speed = 1,
    className,
    width,
    height,
    showControls = true,
    onComplete,
}: DotLottiePlayerProps) {
    const dotLottieRef = useRef<DotLottie | null>(null);
    const [isPlaying, setIsPlaying] = useState(autoplay);

    const handleDotLottieRef = useCallback((dotLottie: DotLottie) => {
        dotLottieRef.current = dotLottie;

        if (speed !== 1) {
            dotLottie.setSpeed(speed);
        }

        dotLottie.addEventListener('play', () => setIsPlaying(true));
        dotLottie.addEventListener('pause', () => setIsPlaying(false));
        dotLottie.addEventListener('complete', () => {
            if (!loop) setIsPlaying(false);
            onComplete?.();
        });
    }, [speed, loop, onComplete]);

    const handlePlay = useCallback(() => {
        dotLottieRef.current?.play();
    }, []);

    const handlePause = useCallback(() => {
        dotLottieRef.current?.pause();
    }, []);

    const handleToggle = useCallback(() => {
        if (isPlaying) {
            handlePause();
        } else {
            handlePlay();
        }
    }, [isPlaying, handlePlay, handlePause]);

    const handleRestart = useCallback(() => {
        dotLottieRef.current?.setFrame(0);
        dotLottieRef.current?.play();
    }, []);

    const style: React.CSSProperties = {
        width: width ?? '100%',
        height: height ?? '100%',
    };

    return (
        <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
            <div style={style}>
                <DotLottieReact
                    src={src}
                    loop={loop}
                    autoplay={autoplay}
                    dotLottieRefCallback={handleDotLottieRef}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {showControls && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleToggle}
                        className="h-8 w-8"
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRestart}
                        className="h-8 w-8"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
