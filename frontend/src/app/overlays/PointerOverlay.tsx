'use client'

import { useEffect, useState } from 'react'
import { MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeature } from '@/contexts/FeatureContext'

export function PointerOverlay() {
    const { isFeatureEnabled } = useFeature();
    const isAlwaysVisible = isFeatureEnabled("pointer-always-visible");

    const [pointerState, setPointerState] = useState<{ x: number, y: number, visible: boolean }>({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
        visible: isAlwaysVisible
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handlePointTo = (event: Event) => {
            const customEvent = event as CustomEvent<{ x: number, y: number }>;
            setPointerState({
                x: customEvent.detail.x,
                y: customEvent.detail.y,
                visible: true
            });

            // Clear any existing timeout so tracking is continuous if multiple calls happen
            clearTimeout(timeoutId);

            // Hide after some time if NOT always visible
            if (!isAlwaysVisible) {
                timeoutId = setTimeout(() => {
                    setPointerState(prev => ({ ...prev, visible: false }));
                }, 6000); // 6 seconds
            }
        };

        window.addEventListener('assistant-point-to', handlePointTo);
        return () => {
            window.removeEventListener('assistant-point-to', handlePointTo);
            clearTimeout(timeoutId);
        };
    }, [isAlwaysVisible]);

    useEffect(() => {
        if (isAlwaysVisible) {
            setPointerState(prev => ({ ...prev, visible: true }));
        } else {
            setPointerState(prev => ({ ...prev, visible: false }));
        }
    }, [isAlwaysVisible]);

    return (
        <AnimatePresence>
            {pointerState.visible && (
                <div
                    className="fixed inset-0 pointer-events-none z-[9999]"
                    style={{ background: 'transparent' }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight : 0, scale: 0.8 }}
                        animate={{ opacity: 1, x: pointerState.x, y: pointerState.y, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            type: "spring",
                            stiffness: 70, // Slower movement to show it gliding
                            damping: 15,
                            mass: 0.8
                        }}
                        className="absolute flex items-start justify-start"
                        style={{
                            // Adjusting slightly so the mouse pointer tip stays exactly on the requested x, y
                            marginLeft: '-4px',
                            marginTop: '-4px'
                        }}
                    >
                        <div className="relative">
                            {/* Mouse Arrow Icon */}
                            <MousePointer2 className="w-10 h-10 text-white fill-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] relative z-20" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
