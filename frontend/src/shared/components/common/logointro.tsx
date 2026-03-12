import React, { useState, useRef, useEffect } from 'react';

interface LogoIntroProps {
    /** Called when the entire intro animation sequence is complete */
    onComplete?: () => void;
    /** Colors for the three SVG segments */
    colors?: {
        top: string;
        middle: string;
        bottom: string;
    };
    /** Duration in ms for logo to stay visible before snap starts */
    logoDisplayDuration?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    delay: number;
}

const LogoIntro: React.FC<LogoIntroProps> = ({
    onComplete,
    colors: colorsProp,
    logoDisplayDuration = 1800,
}) => {
    const colors = colorsProp ?? {
        top: '#3b82f6',
        middle: '#10b981',
        bottom: '#8b5cf6',
    };

    // Phases: 'logo' = draw in, 'fading' = logo fading out, 'snap' = particles fly, 'fadeout' = overlay fading, 'done' = finished
    const [phase, setPhase] = useState<'logo' | 'fading' | 'snap' | 'fadeout' | 'done'>('logo');
    const [particles, setParticles] = useState<Particle[]>([]);
    const [logoOpacity, setLogoOpacity] = useState(1);

    const pathRefs = {
        top: useRef<SVGPathElement>(null),
        middle: useRef<SVGPathElement>(null),
        bottom: useRef<SVGPathElement>(null),
    };

    // Store generated particles so we don't depend on refs after snap
    const particlesGenerated = useRef(false);

    // ── Phase 1 → Phase 1.5: after logo draws, start fading it out ────────
    useEffect(() => {
        if (phase !== 'logo') return;
        const timer = setTimeout(() => {
            // Generate particles while SVG paths are still mounted
            const newParticles: Particle[] = [];
            const particleCountPerPath = 400;

            Object.entries(pathRefs).forEach(([key, ref]) => {
                if (!ref.current) return;
                const path = ref.current;
                const length = path.getTotalLength();
                const color = colors[key as keyof typeof colors];

                for (let i = 0; i < particleCountPerPath; i++) {
                    const distance = Math.random() * length;
                    const point = path.getPointAtLength(distance);

                    newParticles.push({
                        x: point.x,
                        y: point.y,
                        // Lower initial burst velocities for smoother separation
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        size: Math.random() * 2.0 + 0.5,
                        color,
                        alpha: 1,
                        // Widen delay spread so particles disintegrate gradually instead of all at once
                        delay: Math.random() * 1.5,
                    });

                }
            });

            // Store particles, start fading logo
            setParticles(newParticles);
            particlesGenerated.current = true;
            setLogoOpacity(0); // triggers CSS transition
            setPhase('fading');
        }, logoDisplayDuration);

        return () => clearTimeout(timer);
    }, [phase, logoDisplayDuration]);

    // ── Phase 1.5 → Phase 2: after logo fades, switch to snap ─────────────
    useEffect(() => {
        if (phase !== 'fading') return;
        const timer = setTimeout(() => {
            setPhase('snap');
        }, 500); // matches the CSS transition duration
        return () => clearTimeout(timer);
    }, [phase]);

    // ── Phase 2: Animate particles ────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'snap' || !particlesGenerated.current) return;

        let raf: number;
        const tick = () => {
            setParticles(prev => {
                const updated = prev
                    .map(p => {
                        if (p.delay > 0) return { ...p, delay: p.delay - 0.016 };
                        return {
                            ...p,
                            x: p.x + p.vx,
                            y: p.y + p.vy,
                            // Slower fading
                            alpha: Math.max(0, p.alpha - 0.003),
                            // Add slight drag (p.vx * 0.99) and very subtle directional drift
                            vx: p.vx * 0.99 + 0.001,
                            vy: p.vy * 0.99 - 0.002,
                        };
                    })
                    .filter(p => p.alpha > 0);

                if (updated.length === 0) {
                    setPhase('fadeout');
                } else {
                    raf = requestAnimationFrame(tick);
                }
                return updated;
            });
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    // ── Phase 3: smooth fade-out of entire overlay ────────────────────────
    useEffect(() => {
        if (phase !== 'fadeout') return;
        // Wait for the CSS fade-out transition to finish
        const timer = setTimeout(() => {
            setPhase('done');
            onComplete?.();
        }, 800); // matches the CSS transition duration below
        return () => clearTimeout(timer);
    }, [phase, onComplete]);

    // Once done, stop rendering entirely
    if (phase === 'done') return null;

    const showLogo = phase === 'logo' || phase === 'fading';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                background: 'transparent',
                opacity: phase === 'fadeout' ? 0 : 1,
                transition: 'opacity 0.8s ease-out',
            }}
        >
            <style>{`
                @keyframes li-drawPath {
                    0% { stroke-dashoffset: 1000; opacity: 0; }
                    20% { opacity: 1; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes li-fluidFill {
                    0% { fill-opacity: 0; transform: translateY(10px); filter: blur(4px); }
                    100% { fill-opacity: 1; transform: translateY(0); filter: blur(0px); }
                }

                @keyframes li-scaleIn {
                    0% { transform: scale(0.6); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes li-glow {
                    0%, 100% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.15)); }
                    50% { filter: drop-shadow(0 0 30px rgba(255,255,255,0.35)); }
                }
                .li-path-draw {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    stroke-width: 0.5px;
                    animation: li-drawPath 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .li-path-fill {
                    fill-opacity: 0;
                    animation: li-fluidFill 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                .li-scale-in {
                    animation: li-scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                               li-glow 2s ease-in-out infinite;
                }
            `}</style>

            <div
                style={{ width: 280, height: 280, position: 'relative' }}
            >
                {/* SVG Logo — stays in DOM during 'logo' phase so refs are valid */}
                {showLogo && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="280"
                        height="280"
                        viewBox="0 0 256 256"
                        className="li-scale-in"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: logoOpacity,
                            transition: 'opacity 0.5s ease-out',
                        }}
                    >
                        <path
                            ref={pathRefs.top}
                            d="m250 112.7-17.47-41.63c-0.14-0.35-0.38 0-0.38 0-1.5 8.78-29.84 28.65-54.01 42.16-27.5 15.11-66.87 33.42-107.9 39.65-18.86 3.04-36.29 3.51-50.18-1.32 8.95 6.37 25.7 17.12 39.37 26.46 9.2 7.01 25.18 10.13 42.87 9.83 41.94-0.69 93.5-22 127.6-50.18 12.2-9.89 22.27-17.64 20.07-24.97z"
                            fill={colors.top}
                            stroke={colors.top}
                            className="li-path-draw li-path-fill"
                            style={{ animationDelay: '0.4s' }}
                        />
                        <path
                            ref={pathRefs.middle}
                            d="m31.5 100.7 31.55-15.69c14.43-7.75 26.94-12.42 45.57-12.42 7.04 0 12.19 0.87 21.09 1.32 18.78 1.22 36.26 1.18 59.21-1.92 17.05-2.49 25.99-4.85 33.27-4.7 6.13-0.09 7.4 1.41 7.43 2.9 0.15 6.73-19.88 21.5-33.81 30.95-10.1 6.87-25.67 15.22-34.56 18.46-19.43-2.86-40.53-11.8-63.06-18.31-15.2-4.43-31.23-5.47-42.16-4.38-8.22 0.68-14.65 1.63-24.53 3.79z"
                            fill={colors.middle}
                            stroke={colors.middle}
                            className="li-path-draw li-path-fill"
                            style={{ animationDelay: '0.2s' }}
                        />
                        <path
                            ref={pathRefs.bottom}
                            d="m51.97 152.3c-4.06-15.1-0.19-36.16 8.75-54.31-15.74 0.19-38.64 4.1-48.45 15.9-7.53 8.89-10.44 21.33-2.15 30.27 7.94 7.71 22.99 8.72 36.39 8.33l5.46-0.19z"
                            fill={colors.bottom}
                            stroke={colors.bottom}
                            className="li-path-draw li-path-fill"
                            style={{ animationDelay: '0s' }}
                        />
                    </svg>
                )}

                {/* Particle snap effect — rendered AFTER logo hides */}
                {phase === 'snap' && particles.length > 0 && (
                    <svg
                        width="280"
                        height="280"
                        viewBox="0 0 256 256"
                        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
                    >
                        {particles.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={p.size}
                                fill={p.color}
                                opacity={p.alpha}
                            />
                        ))}
                    </svg>
                )}
            </div>
        </div>
    );
};

export default LogoIntro;