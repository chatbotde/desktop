import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VoiceSphereProps {
    isActive: boolean;
    volume: number; // 0.0 to 1.0
    onClick?: () => void;
}

interface Particle {
    x: number;
    y: number;
    z: number;
    baseR: number;     // Original radius
    theta: number;     // Horizontal angle
    phi: number;       // Vertical angle
    type: 'core' | 'shell';
    randomOffset: number;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({ isActive, volume, onClick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Use a ref for volume to access it inside the d3 timer without restarting the effect
    const volumeRef = useRef(volume);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Configuration ---
        const width = 150;
        const height = 150;
        const shellRadius = 60;
        const coreRadius = 35;

        // Physics & Animation State
        // We initialize these once. They persist as long as isActive doesn't change 
        let time = 0;
        let rotationY = 0;
        let smoothedVolume = 0;

        // Setup High DPI Canvas
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // --- Particle Generation ---
        const particles: Particle[] = [];

        // 1. Core Particles (The "Inside")
        const coreCount = 175;
        for (let i = 0; i < coreCount; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / coreCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            particles.push({
                x: 0, y: 0, z: 0,
                baseR: coreRadius,
                theta,
                phi,
                type: 'core',
                randomOffset: Math.random() * 10
            });
        }

        // 2. Shell Particles (The "Container")
        const shellCount = 325;
        for (let i = 0; i < shellCount; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / shellCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            particles.push({
                x: 0, y: 0, z: 0,
                baseR: shellRadius,
                theta,
                phi,
                type: 'shell',
                randomOffset: Math.random() * 10
            });
        }

        // --- Animation Loop ---
        const timer = d3.timer((elapsed) => {
            time = elapsed * 0.0005;

            // 1. Physics Smoothing (using ref to avoid stutter)
            const targetVolume = isActive ? volumeRef.current : 0;

            // Asymmetric smoothing: Attack fast, release slow
            if (targetVolume > smoothedVolume) {
                smoothedVolume += (targetVolume - smoothedVolume) * 0.2; // Attack
            } else {
                smoothedVolume += (targetVolume - smoothedVolume) * 0.05; // Decay
            }

            // 2. Rotation
            rotationY += isActive ? 0.008 : 0.002;

            // 3. Squeeze Logic (Radial Shrink)
            // Stronger squeeze factor
            const breathing = Math.sin(time * 2.5) * 0.03;

            // Shrink based on volume. 
            // We want significant shrink. 0.55 means at max volume it shrinks to 45% size.
            const shrink = smoothedVolume * 0.55;

            // Calculate effective scale. 
            // We clamp it so it doesn't disappear completely.
            const currentScale = Math.max(0.3, 1.0 + breathing - shrink);

            // 4. Clear Canvas
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;

            // Use Lighter blending for glowing effect
            ctx.globalCompositeOperation = 'lighter';

            // 6. Project and Transform Particles
            const projectedParticles = particles.map(p => {
                let r = p.baseR * currentScale;

                // Core spins on multiple axes for "Nucleus" feel
                let pTheta = p.theta;
                let pPhi = p.phi;

                if (p.type === 'core') {
                    pTheta += time * 1.5;
                    pPhi += Math.sin(time + p.randomOffset) * 0.1; // Wiggle
                }

                // Convert Spherical -> Cartesian
                let x = r * Math.sin(pPhi) * Math.cos(pTheta);
                let y = r * Math.cos(pPhi);
                let z = r * Math.sin(pPhi) * Math.sin(pTheta);

                // Apply Global Rotation (Y-axis)
                const cosY = Math.cos(rotationY);
                const sinY = Math.sin(rotationY);
                let x1 = x * cosY - z * sinY;
                let z1 = z * cosY + x * sinY;

                // Tilt X slightly
                const tiltAngle = Math.sin(time * 0.5) * 0.1;
                const cosX = Math.cos(tiltAngle);
                const sinX = Math.sin(tiltAngle);
                let y2 = y * cosX - z1 * sinX;
                let z2 = z1 * cosX + y * sinX;

                // Bobbing (floating)
                y2 += Math.sin(time * 1.5) * 8;

                // 3D Projection
                const fov = 400;
                const scale = fov / (fov + z2);
                const x2d = x1 * scale + cx;
                const y2d = y2 * scale + cy;

                return {
                    x: x2d, y: y2d, z: z2,
                    scale,
                    type: p.type,
                    alphaSeed: p.randomOffset
                };
            });

            // 7. Sort by Depth
            projectedParticles.sort((a, b) => b.z - a.z);

            // 8. Render Particles
            const shellR = isActive ? 14 : 255;
            const shellG = isActive ? 165 : 200;
            const shellB = isActive ? 233 : 0;

            const coreR = isActive ? 220 : 255;
            const coreG = isActive ? 245 : 255;
            const coreB = isActive ? 255 : 0;

            projectedParticles.forEach((p) => {
                const alpha = Math.max(0.05, p.scale - 0.2);

                if (p.type === 'shell') {
                    ctx.beginPath();
                    const size = 1.2 * p.scale;
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${shellR}, ${shellG}, ${shellB}, ${alpha})`;
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    // Core flickers
                    const flicker = 0.8 + Math.sin(time * 20 + p.alphaSeed) * 0.2;
                    // Core gets denser/hotter when shrunk (volume high)
                    const heat = 1 + smoothedVolume * 2;
                    const size = 1.8 * p.scale * heat;

                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${alpha * flicker})`;
                    ctx.fill();
                }
            });

            // 9. Draw Connections (Shell only)
            if (isActive) {
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = `rgba(${shellR}, ${shellG}, ${shellB}, 0.2)`;
                ctx.beginPath();

                // Optimized mesh generation
                // Only connect neighbors in the sorted array. 
                // This creates horizontal "strips" of connections that scan across the sphere.
                for (let i = 0; i < projectedParticles.length; i++) {
                    const p1 = projectedParticles[i];
                    if (p1.type !== 'shell') continue;

                    // Reduced look-ahead to 3 for performance/clean look
                    for (let j = 1; j < 4; j++) {
                        const p2 = projectedParticles[i + j];
                        if (!p2 || p2.type !== 'shell') continue;

                        const dx = p1.x - p2.x;
                        const dy = p1.y - p2.y;
                        const distSq = dx * dx + dy * dy;

                        // Dynamic threshold: when shrunk, points are closer, so we reduce threshold
                        // slightly to avoid the ball turning into a solid mess of lines, 
                        // BUT we want it to look dense.
                        // Actually, maintaining constant threshold means MORE lines appear when shrunk, 
                        // which increases intensity. That is good.
                        const threshold = 40 * p1.scale;

                        if (distSq < threshold * threshold) {
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                        }
                    }
                }
                ctx.stroke();
            }
        });

        return () => {
            timer.stop();
        };
    }, [isActive]); // Removed volume from dependency array to prevent reset

    return (
        <canvas
            ref={canvasRef}
            onClick={onClick}
            className="w-full h-full cursor-pointer touch-none"
            style={{
                filter: isActive
                    ? 'drop-shadow(0 0 25px rgba(14, 165, 233, 0.5))'
                    : 'none',
                transition: 'filter 0.5s ease'
            }}
        />
    );
};