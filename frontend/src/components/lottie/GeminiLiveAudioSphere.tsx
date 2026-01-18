/**
 * GeminiLiveAudioSphere Component
 * 
 * A draggable Lottie audio sphere that provides real-time voice conversation
 * with Gemini AI. Click to start/stop talking, with visual states for:
 * - Idle: Subtle animation
 * - Connecting: Pulsing animation
 * - Listening: Active listening animation
 * - Processing: Thinking animation
 * - Speaking: Speaking animation
 * - Error: Red tint with error state
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LottiePlayer } from '@/components/lottie';
import { audioSphereAnimation } from '@/components/lottie/animations';
import { useGeminiLiveAudioStream, type AudioState } from '@/hooks/useGeminiLiveAudioStream';
import { Mic, MicOff, Loader2, AlertCircle, Volume2 } from 'lucide-react';

interface GeminiLiveAudioSphereProps {
    /** Size of the sphere */
    size?: number;
    /** Initial position (x, y) */
    initialPosition?: { x: number; y: number };
    /** Model ID for the Gemini Live API */
    modelId?: string;
    /** System instruction for the AI */
    systemInstruction?: string;
    /** Voice to use */
    voiceName?: 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' | 'Puck';
    /** Callback when state changes */
    onStateChange?: (state: AudioState) => void;
    /** Callback when error occurs */
    onError?: (error: string) => void;
}

// State-specific styles
const stateStyles: Record<AudioState, {
    borderColor: string;
    glowColor: string;
    backgroundColor: string;
    animationSpeed: number;
}> = {
    idle: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        glowColor: 'rgba(100, 150, 255, 0.15)',
        backgroundColor: 'rgba(100, 150, 255, 0.08)',
        animationSpeed: 0.5,
    },
    connecting: {
        borderColor: 'rgba(255, 200, 100, 0.3)',
        glowColor: 'rgba(255, 200, 100, 0.3)',
        backgroundColor: 'rgba(255, 200, 100, 0.1)',
        animationSpeed: 1.5,
    },
    listening: {
        borderColor: 'rgba(100, 200, 255, 0.4)',
        glowColor: 'rgba(100, 200, 255, 0.4)',
        backgroundColor: 'rgba(100, 200, 255, 0.15)',
        animationSpeed: 1,
    },
    processing: {
        borderColor: 'rgba(200, 150, 255, 0.4)',
        glowColor: 'rgba(200, 150, 255, 0.4)',
        backgroundColor: 'rgba(200, 150, 255, 0.15)',
        animationSpeed: 2,
    },
    speaking: {
        borderColor: 'rgba(100, 255, 150, 0.4)',
        glowColor: 'rgba(100, 255, 150, 0.4)',
        backgroundColor: 'rgba(100, 255, 150, 0.15)',
        animationSpeed: 1.2,
    },
    error: {
        borderColor: 'rgba(255, 100, 100, 0.5)',
        glowColor: 'rgba(255, 100, 100, 0.4)',
        backgroundColor: 'rgba(255, 100, 100, 0.15)',
        animationSpeed: 0.3,
    },
};

// Status labels
const stateLabels: Record<AudioState, string> = {
    idle: 'Click to talk',
    connecting: 'Connecting...',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Error',
};

// Status icons
const StateIcon = ({ state }: { state: AudioState }) => {
    const iconClass = "w-5 h-5 text-white/90";
    
    switch (state) {
        case 'idle':
            return <MicOff className={iconClass} />;
        case 'connecting':
            return <Loader2 className={`${iconClass} animate-spin`} />;
        case 'listening':
            return <Mic className={iconClass} />;
        case 'processing':
            return <Loader2 className={`${iconClass} animate-spin`} />;
        case 'speaking':
            return <Volume2 className={iconClass} />;
        case 'error':
            return <AlertCircle className={iconClass} />;
        default:
            return <Mic className={iconClass} />;
    }
};

export function GeminiLiveAudioSphere({
    size = 150,
    initialPosition = { x: 0, y: 0 },
    modelId,
    systemInstruction = 'You are a helpful and friendly AI assistant. Keep responses concise.',
    voiceName = 'Aoede',
    onStateChange,
    onError,
}: GeminiLiveAudioSphereProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    // Use the live audio stream hook
    const {
        audioState,
        isStreaming,
        error,
        toggleStreaming,
    } = useGeminiLiveAudioStream({
        modelId,
        systemInstruction,
        voiceName,
        onAudioStateChange: onStateChange,
        onError,
    });

    // Get current style based on state
    const currentStyle = useMemo(() => stateStyles[audioState], [audioState]);

    // Handle click to toggle streaming
    const handleClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        setAnimationKey(prev => prev + 1);
        await toggleStreaming();
    }, [toggleStreaming]);

    // Determine if animation should play
    const shouldPlay = audioState !== 'idle' && audioState !== 'error';

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            initial={{ x: initialPosition.x, y: initialPosition.y, opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-4 left-4 z-[200] pointer-events-auto cursor-grab active:cursor-grabbing group"
            style={{
                width: size,
                height: size,
                touchAction: 'none'
            }}
            data-no-clickthrough
            whileDrag={{ scale: 1.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Glassmorphic Background with state-dependent styling */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: `0 8px 32px ${currentStyle.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 60px ${currentStyle.glowColor}`,
                }}
                transition={{ duration: 0.3 }}
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${currentStyle.backgroundColor}, ${currentStyle.backgroundColor} 50%, rgba(60, 80, 180, 0.05) 100%)`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${currentStyle.borderColor}`,
                }}
            />

            {/* Pulse ring animation for active states */}
            {(audioState === 'listening' || audioState === 'speaking') && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        border: `2px solid ${currentStyle.borderColor}`,
                    }}
                />
            )}

            {/* Lottie Animation */}
            <div className="relative w-full h-full p-2">
                <LottiePlayer
                    key={animationKey}
                    animationData={audioSphereAnimation}
                    loop
                    autoplay={shouldPlay}
                    speed={currentStyle.animationSpeed}
                    showControls={false}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Central Action Button - Always visible on hover or when active */}
            <AnimatePresence>
                {(isHovered || isStreaming) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                        onClick={handleClick}
                    >
                        {/* Button Background */}
                        <motion.div
                            className="rounded-full flex items-center justify-center"
                            style={{
                                width: '45%',
                                height: '45%',
                                background: audioState === 'error' 
                                    ? 'rgba(255, 100, 100, 0.3)' 
                                    : isStreaming 
                                        ? 'rgba(255, 100, 100, 0.2)' 
                                        : 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <StateIcon state={audioState} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Label - Appears below on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    >
                        <span 
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(8px)',
                                color: audioState === 'error' ? '#ff6b6b' : 'white',
                            }}
                        >
                            {error || stateLabels[audioState]}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default GeminiLiveAudioSphere;
