import { useRef, forwardRef, useImperativeHandle } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import type { LottieAnimationProps } from './types';

/**
 * A simple Lottie animation component
 * 
 * @example
 * ```tsx
 * import animationData from './animations/loading.json';
 * 
 * <LottieAnimation
 *   animationData={animationData}
 *   loop
 *   style={{ width: 200, height: 200 }}
 * />
 * ```
 */
const LottieAnimation = forwardRef<LottieRefCurrentProps, LottieAnimationProps>(
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
            onComplete,
            onLoopComplete,
            onLoad,
        },
        ref
    ) => {
        const lottieRef = useRef<LottieRefCurrentProps>(null);

        // Expose the lottie ref to parent components
        useImperativeHandle(ref, () => lottieRef.current as LottieRefCurrentProps);

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
            <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={loop}
                autoplay={autoplay}
                style={containerStyle}
                className={className}
                onComplete={onComplete}
                onLoopComplete={onLoopComplete}
                onDOMLoaded={onLoad}
            />
        );
    }
);

LottieAnimation.displayName = 'LottieAnimation';

export default LottieAnimation;
