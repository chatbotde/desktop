import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VoiceSphere } from './assistant-sphere';
import { useLiveAssistant } from './use-live-assistant';

export const AssistantSphere = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { connect, disconnect, connected, isSpeaking, volume } = useLiveAssistant();

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
        <motion.div
            className="relative w-[150px] h-[150px] flex justify-center items-center cursor-pointer outline-none"
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <VoiceSphere
                isActive={connected}
                volume={isSpeaking ? (volume ?? 0.5) : 0}
                onClick={handleToggle}
            />
        </motion.div>
    );
};
