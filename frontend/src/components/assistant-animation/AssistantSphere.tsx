import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VoiceSphere } from './assistant-sphere';
import { useLiveAssistant } from './use-live-assistant';
import { ImageGenerationWindow } from '../image-generation-window';
import { VideoGenerationWindow } from '../video-generation-window';


export const AssistantSphere = () => {
    const [isVisible, setIsVisible] = useState(false);
    const {
        connect,
        disconnect,
        connected,
        isSpeaking,
        volume,
        imageGeneration,
        videoGeneration,
        closeImageGeneration,
        closeVideoGeneration
    } = useLiveAssistant();

    useEffect(() => {
        const handleVisibilityToggle = () => setIsVisible(prev => !prev);
        window.addEventListener('toggle-assistant-visibility', handleVisibilityToggle);
        return () => window.removeEventListener('toggle-assistant-visibility', handleVisibilityToggle);
    }, []);

    // Automatically disconnect when hidden
    useEffect(() => {
        if (!isVisible && connected) {
            disconnect();
        }
    }, [isVisible, connected, disconnect]);

    if (!isVisible) return null;

    const handleToggle = () => {
        if (connected) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <>
            <motion.div
                className="relative w-[150px] h-[150px] flex justify-center items-center cursor-pointer outline-none"
                drag
                dragMomentum={false}
                initial={{ scale: 0.2 }}
                animate={{ scale: connected ? 0.4 : 0.2 }}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                }}
            >
                <VoiceSphere
                    isActive={connected}
                    volume={isSpeaking ? (volume ?? 0.5) : 0}
                    onClick={handleToggle}
                />
            </motion.div>

            {/* Tool Popups */}
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

            {/* Whisper Transcription Overlay is now in App.tsx */}
        </>
    );
};

