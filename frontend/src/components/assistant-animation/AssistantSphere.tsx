import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { VoiceSphere } from './assistant-sphere';
import { useLiveAssistant } from './live-assistant-provider';
import { ImageGenerationWindow } from '../image-generation-window';
import { VideoGenerationWindow } from '../video-generation-window';


export const AssistantSphere = () => {
    const {
        connect,
        disconnect,
        connected,
        isVisible,
        isConnecting,
        isSpeaking,
        volume,
        imageGeneration,
        videoGeneration,
        closeImageGeneration,
        closeVideoGeneration
    } = useLiveAssistant();

    if (!isVisible) return null;

    const handleToggle = () => {
        if (isConnecting) return;
        if (connected) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <>
            <motion.div
                data-no-clickthrough
                role="button"
                tabIndex={0}
                aria-label={connected ? 'Disconnect voice assistant' : 'Connect voice assistant'}
                onTap={handleToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle();
                    }
                }}
                className={cn(
                    'relative w-[150px] h-[150px] flex justify-center items-center cursor-pointer outline-none pointer-events-auto rounded-full transition-shadow duration-300',
                    connected && 'ring-2 ring-blue-500 shadow-[0_0_28px_rgba(37,99,235,0.7)]',
                    isConnecting && !connected && 'ring-2 ring-blue-400/60 animate-pulse',
                )}
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ scale: 0.35 }}
                animate={{ scale: connected ? 0.55 : isConnecting ? 0.45 : 0.35 }}
                whileHover={{ scale: connected ? 0.6 : 0.55 }}
                whileTap={{ scale: 0.45 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                }}
            >
                <VoiceSphere
                    isActive={connected}
                    isConnecting={isConnecting && !connected}
                    volume={connected ? Math.max(volume, isSpeaking ? 0.15 : 0.03) : 0}
                />
            </motion.div>

            <ImageGenerationWindow
                isVisible={imageGeneration.isVisible}
                images={imageGeneration.images}
                isLoading={imageGeneration.isLoading}
                onClose={closeImageGeneration}
            />

            <VideoGenerationWindow
                isVisible={videoGeneration.isVisible}
                videos={videoGeneration.videos}
                isLoading={videoGeneration.isLoading}
                onClose={closeVideoGeneration}
            />
        </>
    );
};
