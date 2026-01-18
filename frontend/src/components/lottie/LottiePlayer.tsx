import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { LottiePlayerProps } from './types';

/**
 * A Lottie player with playback controls
 * 
 * @example
 * ```tsx
 * import animationData from './animations/loading.json';
 * 
 * <LottiePlayer
 *   animationData={animationData}
 *   showControls
 *   style={{ width: 300, height: 300 }}
 * />
 * ```
 */
const LottiePlayer = forwardRef<LottieRefCurrentProps, LottiePlayerProps>(
    (
        {
            animationData,
            loop = true,
            autoplay = true,
            speed = 1,
            style,
            className,
            width,
            height,
            showControls = true,
            initialPlaying = true,
            onComplete,
            onLoopComplete,
            onLoad,
        },
        ref
    ) => {
        const lottieRef = useRef<LottieRefCurrentProps>(null);
        const [isPlaying, setIsPlaying] = useState(autoplay && initialPlaying);

        // Expose the lottie ref to parent components
        useImperativeHandle(ref, () => lottieRef.current as LottieRefCurrentProps);

        const handlePlay = useCallback(() => {
            lottieRef.current?.play();
            setIsPlaying(true);
        }, []);

        const handlePause = useCallback(() => {
            lottieRef.current?.pause();
            setIsPlaying(false);
        }, []);

        const handleToggle = useCallback(() => {
            if (isPlaying) {
                handlePause();
            } else {
                handlePlay();
            }
        }, [isPlaying, handlePlay, handlePause]);

        const handleRestart = useCallback(() => {
            lottieRef.current?.goToAndPlay(0);
            setIsPlaying(true);
        }, []);

        // Apply speed when ref is available
        if (lottieRef.current && speed !== 1) {
            lottieRef.current.setSpeed(speed);
        }

        const containerStyle: React.CSSProperties = {
            width: width ?? style?.width,
            height: height ?? style?.height,
            ...style,
        };

        return (
            <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
                <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={loop}
                    autoplay={autoplay && initialPlaying}
                    style={containerStyle}
                    onComplete={() => {
                        if (!loop) setIsPlaying(false);
                        onComplete?.();
                    }}
                    onLoopComplete={onLoopComplete}
                    onDOMLoaded={onLoad}
                />

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
);

LottiePlayer.displayName = 'LottiePlayer';

export default LottiePlayer;
