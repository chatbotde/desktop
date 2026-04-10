import React, { useState, useRef, useCallback, useSyncExternalStore, type ReactElement } from 'react';

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

interface SnapEffectContainerProps {
    children: ReactElement<any>;
    /** How many particles per pixel/unit area */
    particleDensity?: number;
    /** Whether it should triggered by double click (default true) */
    triggerOnDoubleClick?: boolean;
    /** Callback when snap complete */
    onComplete?: () => void;
}

/**
 * A container that wraps an SVG or a component that renders an SVG.
 * On trigger, it captures the paths of the SVG, accounting for nested transforms,
 * and converts them to particles for a disintegration effect.
 */
const SnapEffectContainer: React.FC<SnapEffectContainerProps> = ({
    children,
    particleDensity = 400, // Increased density for more "dust"
    triggerOnDoubleClick = true,
    onComplete,
}) => {
    const [isSnapping, setIsSnapping] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [defsHtml, setDefsHtml] = useState<string>('');

    const handleTrigger = (e: React.MouseEvent | React.TouchEvent) => {
        if (isSnapping) return;

        // Try to prevent conflict with other handlers if it's a double click
        if (triggerOnDoubleClick && e.type === 'click') return;

        // Find the SVG inside the container
        const svgElement = containerRef.current?.querySelector('svg');
        if (!svgElement) return;

        // Capture ViewBox correctly
        const vb = svgElement.viewBox.baseVal;
        const currentViewBox = {
            x: vb.x || 0,
            y: vb.y || 0,
            w: vb.width || 256,
            h: vb.height || 256
        };
        setViewBox(currentViewBox);

        // Capture DEFS to maintain gradients/patterns
        const defs = svgElement.querySelector('defs');
        if (defs) {
            setDefsHtml(defs.innerHTML);
        }

        const newParticles: Particle[] = [];
        const paths = svgElement.querySelectorAll('path, polygon, rect, circle, ellipse, line');

        // Matrix to convert element-local coordinates to SVG-root coordinates
        const rootCTMInverse = svgElement.getScreenCTM()?.inverse();

        paths.forEach((el) => {
            const svgEl = el as SVGGraphicsElement;
            const style = window.getComputedStyle(el);

            // Check fill and stroke
            const fill = svgEl.getAttribute('fill') || style.fill;
            const stroke = svgEl.getAttribute('stroke') || style.stroke;

            const hasFill = fill && fill !== 'none' && fill !== 'transparent';
            const hasStroke = stroke && stroke !== 'none' && stroke !== 'transparent';

            if (!hasFill && !hasStroke) return;
            if (style.visibility === 'hidden' || style.display === 'none') return;

            const color = hasFill ? fill : stroke;

            // Get transform matrix from this element to the screen, then to the SVG root
            const elementCTM = svgEl.getScreenCTM();
            if (!elementCTM || !rootCTMInverse) return;

            // This matrix takes element-local (0,0) to root-relative (x,y)
            const matrix = rootCTMInverse.multiply(elementCTM);

            const transformPoint = (x: number, y: number) => {
                const pt = svgElement.createSVGPoint();
                pt.x = x;
                pt.y = y;
                const transformed = pt.matrixTransform(matrix);
                return { x: transformed.x, y: transformed.y };
            };

            let pointsToCapture: { x: number, y: number }[] = [];

            if (el instanceof SVGPathElement) {
                const pathLength = el.getTotalLength();
                const count = Math.max(15, Math.floor(pathLength * (particleDensity / 80)));
                for (let i = 0; i < count; i++) {
                    const dist = Math.random() * pathLength;
                    const p = el.getPointAtLength(dist);
                    pointsToCapture.push({ x: p.x, y: p.y });
                }
            } else if (el instanceof SVGLineElement) {
                const x1 = el.x1.baseVal.value;
                const y1 = el.y1.baseVal.value;
                const x2 = el.x2.baseVal.value;
                const y2 = el.y2.baseVal.value;
                const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                const count = Math.max(5, Math.floor(len * (particleDensity / 100)));
                for (let i = 0; i < count; i++) {
                    const t = Math.random();
                    pointsToCapture.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
                }
            } else {
                const bbox = svgEl.getBBox();
                const count = Math.max(8, Math.floor(Math.sqrt(bbox.width * bbox.height) * (particleDensity / 40)));
                for (let i = 0; i < count; i++) {
                    pointsToCapture.push({
                        x: bbox.x + Math.random() * bbox.width,
                        y: bbox.y + Math.random() * bbox.height
                    });
                }
            }

            pointsToCapture.forEach(pt => {
                const transformed = transformPoint(pt.x, pt.y);
                newParticles.push({
                    x: transformed.x,
                    y: transformed.y,
                    vx: (Math.random() - 0.5) * 0.7 + 0.3, // increased spread
                    vy: (Math.random() - 0.5) * 0.7 - 0.4,
                    size: Math.random() * 2.5 + 0.4,
                    color,
                    alpha: 1,
                    delay: Math.random() * 2.5, // wider delay for gradual disintegration
                });
            });
        });

        if (newParticles.length > 0) {
            setParticles(newParticles);
            setIsSnapping(true);
        }
    };

    // Animation Tick - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (!isSnapping || particles.length === 0) return () => {};

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
                                alpha: Math.max(0, p.alpha - 0.003), // slower fade
                                vx: p.vx * 0.98 + 0.01,
                                vy: p.vy * 0.98 - 0.01,
                            };
                        })
                        .filter(p => p.alpha > 0);

                    if (updated.length === 0) {
                        setIsSnapping(false);
                        onComplete?.();
                        setDefsHtml('');
                        return [];
                    } else {
                        raf = requestAnimationFrame(tick);
                        return updated;
                    }
                });
            };

            raf = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(raf);
        }, [isSnapping, onComplete, particles.length]),
        () => null,
        () => null
    )

    return (
        <div
            ref={containerRef}
            onDoubleClick={triggerOnDoubleClick ? handleTrigger : undefined}
            onClick={!triggerOnDoubleClick ? handleTrigger : undefined}
            style={{
                position: 'relative',
                display: 'inline-block',
                cursor: !isSnapping ? 'pointer' : 'default'
            }}
        >
            {/* Original content hidden but defs preserved */}
            <div style={{
                opacity: isSnapping ? 0 : 1,
                pointerEvents: isSnapping ? 'none' : 'auto',
                transition: 'opacity 0.6s ease-out',
                visibility: isSnapping ? 'hidden' : 'visible'
            }}>
                {children}
            </div>

            {/* Particle Layer - Uses the same coordinate system as the root SVG */}
            {isSnapping && particles.length > 0 && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                >
                    {/* Inject original defs so fill="url(#...)" works */}
                    <defs dangerouslySetInnerHTML={{ __html: defsHtml }} />

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
    );
};

export default SnapEffectContainer;
