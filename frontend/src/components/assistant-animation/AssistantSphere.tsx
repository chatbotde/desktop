import React from 'react';
import { motion } from 'motion/react';
import './assistant-sphere.css';
import { useLiveAssistant } from './use-live-assistant';

interface AssistantSphereProps {
    isVisible?: boolean;
}

export const AssistantSphere: React.FC<AssistantSphereProps> = ({ isVisible = true }) => {
    const { connect, disconnect, connected, isSpeaking } = useLiveAssistant();

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
            title={connected ? "Tap to disconnect" : "Tap to chat with Gemini Live"}
        >
            <div className={coreClass}></div>
            <div className={`${shellClass} shell-1`}></div>
            <div className={`${shellClass} shell-2`}></div>
            <div className={`${shellClass} shell-3`}></div>
        </motion.div>
    );
};
