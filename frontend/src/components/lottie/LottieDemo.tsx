import { useRef } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';
import { LottieAnimation, LottiePlayer } from './index';
import { loadingAnimation, successAnimation } from './animations';

/**
 * Demo component showcasing Lottie animation usage
 * 
 * This is a test/demo component - you can use it to verify 
 * that Lottie is working correctly in your project
 */
export default function LottieDemo() {
    const animationRef = useRef<LottieRefCurrentProps>(null);

    return (
        <div className="flex flex-col items-center gap-8 p-8">
            <h1 className="text-2xl font-bold">Lottie Animation Demo</h1>

            {/* Basic Animation */}
            <section className="flex flex-col items-center gap-4">
                <h2 className="text-lg font-semibold">Basic Loading Animation</h2>
                <LottieAnimation
                    animationData={loadingAnimation}
                    loop
                    style={{ width: 150, height: 150 }}
                />
            </section>

            {/* Animation with Controls */}
            <section className="flex flex-col items-center gap-4">
                <h2 className="text-lg font-semibold">Player with Controls</h2>
                <LottiePlayer
                    animationData={successAnimation}
                    loop={false}
                    showControls
                    style={{ width: 150, height: 150 }}
                />
            </section>

            {/* Animation with Ref for External Control */}
            <section className="flex flex-col items-center gap-4">
                <h2 className="text-lg font-semibold">External Control via Ref</h2>
                <LottieAnimation
                    ref={animationRef}
                    animationData={loadingAnimation}
                    loop
                    speed={0.5}
                    style={{ width: 100, height: 100 }}
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => animationRef.current?.pause()}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Pause
                    </button>
                    <button
                        onClick={() => animationRef.current?.play()}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Play
                    </button>
                    <button
                        onClick={() => animationRef.current?.setSpeed(2)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        2x Speed
                    </button>
                </div>
            </section>
        </div>
    );
}
