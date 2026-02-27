import { ImageGeneration } from '../../components/image-generation/image-generation';
import { motion, useDragControls } from 'motion/react';
import { useAnimations } from '@/shared/providers/AnimationsProvider';

/**
 * TestComponent
 * 
 * A sandbox container for you to easily test new components or isolated features 
 * without affecting the rest of the application.
 * 
 * It is already registered and rendered on top of everything. 
 * Just import your new components here and place them inside the return statement!
 */
export const TestComponent = () => {
    // Return null when you are not actively testing something to hide the test container
    // return null;

    const { isAnimationEnabled } = useAnimations();
    const dragControls = useDragControls();

    if (!isAnimationEnabled('test')) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragListener={false} // Disable drag on the whole div to allow children to be clicked
            dragControls={dragControls}
            data-no-clickthrough
            className="absolute top-4 right-4 z-[9999] pointer-events-auto bg-zinc-900 border border-zinc-700/50 p-4 rounded-xl shadow-2xl text-white min-w-[200px] w-[280px]"
        >
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab active:cursor-grabbing pb-2 mb-2 border-b border-zinc-700/50"
            >
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-center">Test Sandbox (Drag)</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4 text-center">
                Experimental components sandbox
            </p>

            <div className="mt-3 border border-dashed border-zinc-600 rounded-lg p-2 bg-zinc-950/50 flex items-center justify-center min-h-[180px] w-full overflow-hidden">
                <ImageGeneration
                    images={[
                        "https://images.unsplash.com/photo-1707343843437-caacff5cfa74",
                        "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
                        "https://images.unsplash.com/photo-1707345512638-997d31a10eaa",
                        "https://images.unsplash.com/photo-1707343843982-f82335133642",
                        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                    ]}
                    onClose={() => console.log('Close clicked')}
                />
            </div>
        </motion.div>
    );
};
