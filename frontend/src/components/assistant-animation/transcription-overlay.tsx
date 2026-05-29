import { motion, AnimatePresence } from 'motion/react';
import { useSpeechToText } from '../../hooks/use-speech-to-text';
import { Mic, X, Loader2, Copy, Check, Zap, ZapOff, Trash2, Sparkles, Wand2, Type, Save, History } from 'lucide-react';
import { useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { InsertButton } from '../insert-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useTheme, useFeature } from '@/shared/providers';
import { sendMessageComplete } from '@/lib/ai';
import { buildVoiceRewritePromptFromLiveTranscription } from '@/lib/prompt';

const BASE_HEIGHTS = [0.3, 0.5, 0.8, 1, 0.8, 0.5, 0.3];

export const TranscriptionOverlay = () => {
    const {
        isRecording,
        isTranscribing,
        transcript,
        error,
        startRecording,
        stopRecording,
        clearTranscript
    } = useSpeechToText();

    const { isDark } = useTheme();
    const { isFeatureEnabled, toggleFeature } = useFeature();

    // transcription feature flag acts as "Auto Mode"
    const isAutoMode = isFeatureEnabled('transcription');

    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // AI & Editing state
    const [editedTranscript, setEditedTranscript] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isPromptWriterOpen, setIsPromptWriterOpen] = useState(false);
    const [examplePrompt, setExamplePrompt] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const lastInsertedRef = useRef<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Visualizer state - computed from isRecording without useEffect
    const vizHeights = isRecording 
        ? BASE_HEIGHTS.map((base) => base * (Math.random() * 0.4 + 0.6))
        : BASE_HEIGHTS;

    // Auto-insertion logic - inline instead of useEffect
    if (isAutoMode && transcript && isVisible) {
        const tsfAPI = (window as any).tsfAPI;
        if (tsfAPI) {
            const currentText = transcript;
            const previousText = lastInsertedRef.current;
            
            let commonLength = 0;
            const maxLen = Math.min(currentText.length, previousText.length);
            while (commonLength < maxLen && currentText[commonLength] === previousText[commonLength]) {
                commonLength++;
            }
            
            const newPart = currentText.slice(commonLength);
            if (newPart.length > 0) {
                lastInsertedRef.current = currentText;
                tsfAPI.focusAndInsertText(newPart).catch(console.error);
            }
        }
    } else if (!transcript) {
        lastInsertedRef.current = '';
    }

    // Load saved prompts on mount - using syncExternalStore pattern
    const savedPromptsStore = useSyncExternalStore(
        () => () => {}, // no cleanup needed
        () => {
            if (typeof window === 'undefined') return '[]';
            return localStorage.getItem('transcription-example-prompts') || '[]';
        },
        () => '[]'
    );
    
    // Parse prompts once on first render
    const [savedPrompts, setSavedPrompts] = useState<string[]>(() => {
        try {
            return JSON.parse(savedPromptsStore);
        } catch {
            return [];
        }
    });

    const saveCurrentExample = () => {
        if (!examplePrompt || savedPrompts.includes(examplePrompt)) return;
        const newPrompts = [examplePrompt, ...savedPrompts].slice(0, 10);
        setSavedPrompts(newPrompts);
        localStorage.setItem('transcription-example-prompts', JSON.stringify(newPrompts));
    };

    const deleteSavedPrompt = (promptToDelete: string) => {
        const newPrompts = savedPrompts.filter(p => p !== promptToDelete);
        setSavedPrompts(newPrompts);
        localStorage.setItem('transcription-example-prompts', JSON.stringify(newPrompts));
    };

    // Global manual visibility toggle (event-based) using syncExternalStore
    useSyncExternalStore(
        useCallback(() => {
            const handleVisibilityToggle = () => setIsVisible(prev => !prev);
            window.addEventListener('toggle-transcription-visibility', handleVisibilityToggle);
            return () => window.removeEventListener('toggle-transcription-visibility', handleVisibilityToggle);
        }, []),
        () => null,
        () => null
    );

    // Keep editedTranscript in sync with transcript while recording
    // Use derived state pattern instead of useEffect
    const effectiveEditedTranscript = isRecording || !editedTranscript 
        ? (transcript || '') 
        : editedTranscript;
    
    // Sync back to state when needed
    if (effectiveEditedTranscript !== editedTranscript && (isRecording || !editedTranscript)) {
        setEditedTranscript(effectiveEditedTranscript);
    }

    // Auto-resize textarea when content changes
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    const handleCopy = useCallback(() => {
        const textToCopy = editedTranscript || transcript;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, [transcript, editedTranscript]);

    const handleRefine = async () => {
        const textToRefine = editedTranscript || transcript;
        if (!textToRefine || isRefining) return;

        setIsRefining(true);
        try {
            const prompt = buildVoiceRewritePromptFromLiveTranscription(textToRefine);

            const result = await sendMessageComplete(prompt);
            if (result && typeof result === 'string') {
                const cleaned = result.trim().replace(/^["'`]|["'`]$/g, '');
                setEditedTranscript(cleaned);
            }
        } catch (err) {
            console.error('Refinement failed:', err);
        } finally {
            setIsRefining(false);
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            className="absolute z-[2001] flex flex-col items-center pointer-events-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="py-4 px-8 flex flex-col items-center">
                <div className="relative flex flex-col items-center overflow-visible">
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="flex flex-col items-center gap-3 p-1"
                    >
                        {/* Control Button / Pill */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    onClick={() => isRecording ? stopRecording() : startRecording()}
                                    className={`
                                        group relative flex items-center justify-center gap-3
                                        transition-all duration-300 ease-out
                                        ${isRecording
                                            ? 'px-5 h-11 bg-zinc-950 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white'
                                            : isDark
                                                ? 'px-5 h-10 bg-zinc-950 border-zinc-800 hover:bg-zinc-900 text-white shadow-xl'
                                                : 'px-5 h-10 bg-white border-zinc-200 hover:bg-zinc-50 text-black shadow-lg'}
                                        rounded-full border
                                    `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Mic className={`w-4 h-4 transition-colors ${isRecording ? 'text-blue-500' : isDark ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-black'}`} />

                                    <div className="flex items-center gap-1 h-5 w-12 justify-center">
                                        {vizHeights.map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className={`w-1 rounded-full transition-all duration-200 ${isRecording
                                                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                    : isDark ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                                                animate={{
                                                    height: `${h * 100}%`,
                                                    opacity: 1
                                                }}
                                                transition={{
                                                    type: 'spring',
                                                    bounce: 0,
                                                    duration: 0.1
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {isRecording ? "Stop Listening" : "Start"}
                            </TooltipContent>
                        </Tooltip>

                        {/* Transcription & Status Card */}
                        <AnimatePresence>
                            {(transcript || isTranscribing || error) && !isAutoMode && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`
                                        relative min-w-[300px] max-w-[420px]
                                        rounded-2xl overflow-hidden
                                        shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                                        border transition-all duration-500
                                        ${isRecording || isTranscribing
                                            ? 'bg-zinc-950 border-zinc-800'
                                            : isDark
                                                ? 'bg-zinc-950 border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
                                                : 'bg-white border-zinc-200'}
                                    `}
                                >
                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isTranscribing && (
                                                    <Loader2 className={`w-3.5 h-3.5 animate-spin ${isRecording || isTranscribing || isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                                                )}
                                                {isRecording && !isTranscribing && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                        <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-zinc-500">Listening</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => setIsVisible(false)}
                                                        className={`p-1.5 rounded-lg transition-colors ${isRecording || isTranscribing || isDark
                                                            ? 'hover:bg-white/5 text-zinc-500 hover:text-white'
                                                            : 'hover:bg-black/5 text-zinc-400 hover:text-zinc-900'
                                                            }`}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">Dismiss</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {error ? (
                                            <p className="text-xs text-red-400 font-medium bg-red-500/5 p-2 rounded-lg border border-red-500/10">{error}</p>
                                        ) : (
                                            <div className="min-h-[40px] max-h-[220px] overflow-y-auto custom-scrollbar px-0.5">
                                                <textarea
                                                    ref={textareaRef}
                                                    value={editedTranscript}
                                                    onChange={(e) => setEditedTranscript(e.target.value)}
                                                    placeholder={isRecording ? "Listening..." : "Type or refine your message..."}
                                                    spellCheck={false}
                                                    className={`
                                                        w-full bg-transparent border-none resize-none p-0
                                                        text-[15px] leading-relaxed font-bold tracking-tight focus:outline-none focus:ring-0
                                                        ${isRecording || isTranscribing || isDark ? 'text-zinc-100' : 'text-zinc-900'}
                                                        ${isRecording ? 'pointer-events-none opacity-80' : 'pointer-events-auto'}
                                                    `}
                                                    rows={1}
                                                />
                                            </div>
                                        )}

                                        {transcript && (
                                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                                                <div className="flex items-center gap-0.5">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => toggleFeature('transcription')}
                                                                className={`
                                                                    flex items-center justify-center h-8 w-8 rounded-lg transition-all
                                                                    ${isAutoMode
                                                                        ? 'text-blue-500'
                                                                        : `bg-transparent ${isRecording || isTranscribing || isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
                                                                `}
                                                            >
                                                                {isAutoMode ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Auto Mode</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={clearTranscript}
                                                                className={`flex items-center justify-center h-8 w-8 bg-transparent border-none rounded-lg transition-all hover:text-red-500 ${isRecording || isTranscribing || isDark ? 'text-zinc-500 hover:bg-white/5' : 'text-zinc-500 hover:bg-black/5'}`}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Clear</TooltipContent>
                                                    </Tooltip>

                                                    <div className="w-px h-4 bg-zinc-800/50 mx-1" />

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={handleRefine}
                                                                disabled={isRefining || !editedTranscript}
                                                                className={`
                                                                    flex items-center justify-center h-8 w-8 rounded-lg transition-all
                                                                    ${isRefining
                                                                        ? 'animate-pulse bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                                        : isRecording
                                                                            ? 'opacity-50 cursor-not-allowed text-zinc-500'
                                                                            : `hover:bg-blue-600/10 hover:text-blue-500 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`
                                                                    }
                                                                `}
                                                            >
                                                                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Refine with AI</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => setIsPromptWriterOpen(prev => !prev)}
                                                                disabled={isRecording}
                                                                className={`
                                                                    flex items-center justify-center h-8 w-8 rounded-lg transition-all
                                                                    ${isPromptWriterOpen
                                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                                        : isRecording
                                                                            ? 'opacity-50 cursor-not-allowed text-zinc-500'
                                                                            : `hover:bg-blue-600/10 hover:text-blue-500 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`
                                                                    }
                                                                `}
                                                            >
                                                                <Wand2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Prompt Writer</TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={handleCopy}
                                                                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${isRecording || isTranscribing || isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
                                                            >
                                                                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Copy</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-block">
                                                                <InsertButton
                                                                    text={editedTranscript || transcript}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className={`h-8 w-8 p-0 rounded-lg ${isRecording || isTranscribing || isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Insert</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        )}

                                        {isPromptWriterOpen && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                                    <Type className="w-3 h-3" />
                                                    Style Reference / Example
                                                </div>
                                                <div className="flex gap-1.5 flex-1">
                                                    <div className="relative flex-1 group">
                                                        <input
                                                            type="text"
                                                            value={examplePrompt}
                                                            onChange={(e) => setExamplePrompt(e.target.value)}
                                                            placeholder="Paste example prompt here..."
                                                            className={`
                                                                w-full h-8 px-2 pr-14 rounded-lg text-xs bg-zinc-900/50 border border-zinc-800
                                                                focus:outline-none focus:border-blue-500 transition-colors
                                                                ${isDark ? 'text-white' : 'text-black'}
                                                            `}
                                                        />
                                                        <div className="absolute right-1 top-1 flex items-center gap-0.5">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const text = await navigator.clipboard.readText();
                                                                        setExamplePrompt(text);
                                                                    } catch (err) {
                                                                        console.error('Failed to paste', err);
                                                                    }
                                                                }}
                                                                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 text-zinc-500 hover:text-blue-400 transition-all shadow-sm"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                            {examplePrompt && (
                                                                <button
                                                                    onClick={saveCurrentExample}
                                                                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 text-zinc-500 hover:text-green-500 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Save className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setShowHistory(!showHistory)}
                                                        className={`h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-800 transition-all ${showHistory ? 'bg-blue-600/20 text-blue-500' : 'bg-zinc-900/50 text-zinc-500 hover:text-white'}`}
                                                    >
                                                        <History className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {showHistory && savedPrompts.length > 0 && (
                                                    <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar p-1 bg-black/20 rounded-lg border border-zinc-800/50">
                                                        {savedPrompts.map((p, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 group p-1.5 rounded hover:bg-white/5 transition-colors">
                                                                <button
                                                                    onClick={() => setExamplePrompt(p)}
                                                                    className="flex-1 text-[11px] text-zinc-400 hover:text-zinc-100 text-left line-clamp-1"
                                                                >
                                                                    {p}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteSavedPrompt(p)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-500 transition-all"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
