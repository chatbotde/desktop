import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import './assistant-sphere.css';
import { useLiveAssistant } from './use-live-assistant';

interface AssistantSphereProps {
    isVisible?: boolean;
}

export const AssistantSphere: React.FC<AssistantSphereProps> = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { connect, disconnect, connected, isSpeaking } = useLiveAssistant();

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

    const coreClass = `sphere-core ${connected ? 'connected' : ''} ${isSpeaking ? 'speaking' : ''}`;
    const shellClass = `particle-shell ${connected ? 'connected' : ''}`;

    return (
        <motion.div
            className="assistant-sphere-container cursor-pointer active:cursor-grabbing"
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
        >
            <div className={coreClass}></div>
            <div className={`${shellClass} shell-1`}></div>
            <div className={`${shellClass} shell-2`}></div>
            <div className={`${shellClass} shell-3`}></div>
        </motion.div>
    );
};
