
// import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechToText } from '../../hooks/use-speech-to-text';
import { Mic, Square, X, MessageSquare, Loader2, Copy, Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { AddToPromptButton } from '../add-button';
import { InsertButton } from '../insert-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';

export const TranscriptionOverlay = () => {
    const {
        isRecording,
        isTranscribing,
        transcript,
        startRecording,
        stopRecording,
        error
    } = useSpeechToText();

    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [, setIsHovered] = useState(false);

    useEffect(() => {
        const handleVisibilityToggle = () => setIsVisible(prev => !prev);
        window.addEventListener('toggle-transcription-visibility', handleVisibilityToggle);
        return () => window.removeEventListener('toggle-transcription-visibility', handleVisibilityToggle);
    }, []);

    const handleCopy = useCallback(() => {
        if (transcript) {
            navigator.clipboard.writeText(transcript);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [transcript]);

    const handleAddToPrompt = useCallback(() => {
        if (transcript) {
            window.dispatchEvent(new CustomEvent('add-to-prompt', { detail: { text: transcript } }));
        }
    }, [transcript]);

    if (!isVisible) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="absolute z-[2001] flex flex-col items-center pointer-events-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {/* Added a transparent hit area around the pill to make hover easier to trigger */}
            <div className="py-4 px-8 flex flex-col items-center">
                <div className="relative flex flex-col items-center overflow-visible">
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="flex flex-col items-center gap-3 p-1"
                    >
                        {/* Control Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    onClick={() => isRecording ? stopRecording() : startRecording()}
                                    className={`
                                        group relative flex items-center justify-center
                                        transition-all duration-300 ease-out
                                        ${isRecording
                                            ? 'w-12 h-12 bg-red-600 border-red-500'
                                            : 'w-10 h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}
                                        rounded-full border shadow-lg
                                    `}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {isRecording ? (
                                        <>
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-red-500/20"
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <Square className="w-5 h-5 text-white fill-white" />
                                        </>
                                    ) : (
                                        <Mic className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                                    )}
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {isRecording ? "Stop Listening" : "Start Whisper"}
                            </TooltipContent>
                        </Tooltip>

                        {/* Transcription & Status Card */}
                        <AnimatePresence>
                            {(transcript || isTranscribing || error) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="
                                        relative w-80 bg-zinc-950 
                                        rounded-2xl overflow-hidden
                                        shadow-[0_12px_40px_rgba(0,0,0,0.3)]
                                        border border-zinc-800
                                    "
                                >
                                    <div className="p-2 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                                <MessageSquare className="w-3 h-3" />
                                                Transcription
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {isTranscribing && (
                                                    <Loader2 className="w-3 h-3 text-blue-300 animate-spin" />
                                                )}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setIsVisible(false)}
                                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                                        >
                                                            <X className="w-3 h-3 text-white/40 hover:text-white" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Close card</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {error ? (
                                            <p className="text-xs text-red-300 font-medium">{error}</p>
                                        ) : (
                                            <div className="min-h-[40px] max-h-[120px] overflow-y-auto custom-scrollbar">
                                                <p className="text-sm text-white inline-flex leading-relaxed font-bold">
                                                    {transcript || (isRecording ? "Listening..." : "Waiting for speech...")}
                                                </p>
                                            </div>
                                        )}

                                        {isTranscribing && !transcript && (
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-500/50"
                                                    animate={{ x: [-100, 300] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                />
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {transcript && (
                                            <div className="flex items-center gap-2 pt-0 border-none">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AddToPromptButton
                                                            onClick={handleAddToPrompt}
                                                            size="md"
                                                            variant="outline"
                                                            iconOnly={true}
                                                            tooltip=""
                                                            className="bg-transparent border-white/10 hover:bg-white/5"
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Add to chat</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="inline-block">
                                                            <InsertButton
                                                                text={transcript}
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-transparent border-white/10 hover:bg-white/5 text-white/70"
                                                            />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Insert</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={handleCopy}
                                                            className="flex items-center justify-center h-8 w-8 bg-transparent border border-white/10 hover:bg-white/5 rounded-full transition-all text-white/70"
                                                        >
                                                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-400 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        {isCopied ? 'Copied' : 'Copy to clipboard'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};



