import { ImageGeneration } from '@/components/image-generation';
import { motion, useDragControls } from 'motion/react';
import { useRef, useCallback, useState } from 'react';

// ─── Resize types ──────────────────────────────────────────────────
type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSOR: Record<ResizeEdge, string> = {
    n: 'ns-resize', s: 'ns-resize',
    e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', sw: 'nesw-resize',
    nw: 'nwse-resize', se: 'nwse-resize',
};

const MIN_W = 120;
const MIN_H = 80;
const GRIP = 6; // edge hitbox in px

/**
 * TestComponent — Flexible Preview Sandbox
 *
 * Drop any component inside. The container wraps around the child's
 * natural size. Resize from any edge/corner. Drag from the title bar.
 */
export const TestComponent = () => {
    const dragControls = useDragControls();
    const isResizing = useRef(false);

    // Starts at 200x200 as requested, use null if you ever want fit-content.
    const [size, setSize] = useState<{ w: number; h: number } | null>({ w: 200, h: 200 });
    const [posOffset, setPosOffset] = useState({ x: 0, y: 0 });

    // ─── Resize from any edge / corner ───────────────────────────
    const startResize = useCallback((edge: ResizeEdge, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;

        const sx = e.clientX, sy = e.clientY;
        const sox = posOffset.x, soy = posOffset.y;

        const el = (e.target as HTMLElement).closest('[data-sandbox]') as HTMLElement;
        const rect = el.getBoundingClientRect();
        const sw = rect.width, sh = rect.height;

        const mx = edge.includes('e') || edge.includes('w');
        const my = edge.includes('n') || edge.includes('s');
        const ix = edge.includes('w');
        const iy = edge.includes('n');

        const onMove = (ev: PointerEvent) => {
            if (!isResizing.current) return;
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            const nw = mx ? Math.max(MIN_W, sw + (ix ? -dx : dx)) : sw;
            const nh = my ? Math.max(MIN_H, sh + (iy ? -dy : dy)) : sh;
            setSize({ w: nw, h: nh });
            setPosOffset({
                x: sox + (mx && ix ? sw - nw : 0),
                y: soy + (my && iy ? sh - nh : 0),
            });
        };
        const onUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        document.body.style.cursor = CURSOR[edge];
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [posOffset]);

    // ─── Edge / corner handle ────────────────────────────────────
    const H = ({ e: edge }: { e: ResizeEdge }) => {
        const corner = edge.length === 2;
        const s = corner ? GRIP * 2 : undefined;
        const pos: Record<string, React.CSSProperties> = {
            n: { top: 0, left: GRIP * 2, right: GRIP * 2, height: GRIP },
            s: { bottom: 0, left: GRIP * 2, right: GRIP * 2, height: GRIP },
            w: { left: 0, top: GRIP * 2, bottom: GRIP * 2, width: GRIP },
            e: { right: 0, top: GRIP * 2, bottom: GRIP * 2, width: GRIP },
            nw: { top: 0, left: 0, width: s, height: s },
            ne: { top: 0, right: 0, width: s, height: s },
            sw: { bottom: 0, left: 0, width: s, height: s },
            se: { bottom: 0, right: 0, width: s, height: s },
        };
        return (
            <div
                onPointerDown={(ev) => startResize(edge, ev)}
                style={{ position: 'absolute', zIndex: 10, cursor: CURSOR[edge], touchAction: 'none', ...pos[edge] }}
            />
        );
    };


    // ─── Content Toggle ───
    // Add multiple components here to easily cycle through them
    const [activeTab, setActiveTab] = useState(0);
    const tabs = [
        { name: 'Image Gen', content: <ImageGeneration imageUrl={"https://images.unsplash.com/photo-1707343843437-caacff5cfa74"} /> },
        { name: 'Empty Box', content: <div style={{ width: 100, height: 100, background: '#ff5f57', borderRadius: 8 }} /> },
        { name: 'Text Mode', content: <p style={{ color: '#fff', padding: 20 }}>Testing simple text layout...</p> }
    ];

    return (
        <motion.div
            data-sandbox
            drag
            dragMomentum={false}
            dragListener={false}
            dragControls={dragControls}
            data-no-clickthrough
            style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 9999,
                pointerEvents: 'auto',
                width: size ? size.w : 'fit-content',
                height: size ? size.h : 'fit-content',
                maxWidth: size ? undefined : '80vw',
                maxHeight: size ? undefined : '60vh',
                minWidth: MIN_W,
                minHeight: MIN_H,
                transform: `translate(${posOffset.x}px, ${posOffset.y}px)`,
                // ─── Liquid Transparent Design ───
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(10, 10, 15, 0.3) 100%)',
                backdropFilter: 'blur(24px) saturate(150%)',
                WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column' as const,
                overflow: 'hidden',
            }}
        >
            {/* 8 resize handles */}
            {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeEdge[]).map(edge => <H key={edge} e={edge} />)}

            {/* ── Title bar (drag) ── */}
            <div
                onPointerDown={(e) => { if (!isResizing.current) dragControls.start(e); }}
                style={{
                    cursor: 'grab',
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    userSelect: 'none',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57', display: 'block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e', display: 'block' }} />
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840', display: 'block' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* UI Switcher */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab((prev) => (prev + 1) % tabs.length);
                        }}
                        style={{
                            fontSize: 10, padding: '3px 8px', borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff', cursor: 'pointer',
                        }}
                    >
                        Rendering: {tabs[activeTab].name} Cycle
                    </button>

                    {/* Reset to fit-content */}
                    {size && (
                        <button
                            onClick={() => { setSize(null); setPosOffset({ x: 0, y: 0 }); }}
                            style={{
                                fontSize: 9, padding: '2px 7px', borderRadius: 5,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700,
                                letterSpacing: '0.04em',
                            }}
                            title="Reset to fit content size"
                        >
                            ↺ Fit
                        </button>
                    )}
                    
                    {/* Explicit clear storage or hide button */}
                    <button
                        onClick={() => {
                            // To actually hide it we dispatch an event or just remove from DOM
                            // For a sandbox, just hiding the element visually locally works for this session
                            const el = document.querySelector('[data-sandbox]') as HTMLElement;
                            if (el) el.style.display = 'none';
                        }}
                        style={{
                            fontSize: 9, padding: '2px 7px', borderRadius: 5,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,50,50,0.2)',
                            color: 'rgba(255,200,200,0.8)',
                            cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700,
                            letterSpacing: '0.04em',
                        }}
                        title="Hide this overlay"
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, minHeight: 0, overflow: size ? 'auto' : 'visible', padding: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {tabs[activeTab].content}
            </div>

            {/* ── Corner grip visual ── */}
            <svg
                style={{ position: 'absolute', bottom: 3, right: 3, width: 12, height: 12, opacity: 0.3, pointerEvents: 'none' }}
                viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1"
            >
                <line x1="8" y1="12" x2="12" y2="8" />
                <line x1="5" y1="12" x2="12" y2="5" />
                <line x1="2" y1="12" x2="12" y2="2" />
            </svg>
        </motion.div>
    );
};
