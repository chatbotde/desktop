import React, { useEffect, useRef, useState } from 'react';
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

    // State to hold earth particles once generated
    const [earthParticles, setEarthParticles] = useState<Particle[]>([]);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    // Load Earth Data
    useEffect(() => {
        let isMounted = true;
        const loadWorldData = async () => {
            try {
                const response = await fetch(
                    "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
                );
                if (!response.ok) throw new Error("Failed to load land data");

                const landFeatures = await response.json();
                if (!isMounted) return;

                const generatedParticles: Particle[] = [];
                const coreRadius = 35; // Match previous core radius

                // Helper to check point inside polygon (from rotate-earth.tsx)
                const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
                    const [x, y] = point;
                    let inside = false;
                    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                        const [xi, yi] = polygon[i];
                        const [xj, yj] = polygon[j];
                        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                            inside = !inside;
                        }
                    }
                    return inside;
                };

                const pointInFeature = (point: [number, number], feature: any): boolean => {
                    const geometry = feature.geometry;
                    if (geometry.type === "Polygon") {
                        const coordinates = geometry.coordinates;
                        if (!pointInPolygon(point, coordinates[0])) return false;
                        for (let i = 1; i < coordinates.length; i++) {
                            if (pointInPolygon(point, coordinates[i])) return false;
                        }
                        return true;
                    } else if (geometry.type === "MultiPolygon") {
                        for (const polygon of geometry.coordinates) {
                            if (pointInPolygon(point, polygon[0])) {
                                let inHole = false;
                                for (let i = 1; i < polygon.length; i++) {
                                    if (pointInPolygon(point, polygon[i])) {
                                        inHole = true;
                                        break;
                                    }
                                }
                                if (!inHole) return true;
                            }
                        }
                        return false;
                    }
                    return false;
                };

                // Generate dots
                landFeatures.features.forEach((feature: any) => {
                    const bounds = d3.geoBounds(feature);
                    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
                    // Lower density for small canvas (150px)
                    // The original had 16 spacing, likely too dense for 150px canvas
                    const dotSpacing = 20;
                    const stepSize = dotSpacing * 0.15;

                    for (let lng = minLng; lng <= maxLng; lng += stepSize) {
                        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
                            const point: [number, number] = [lng, lat];
                            if (pointInFeature(point, feature)) {
                                // Convert Lat/Lng to Spherical angles for our system
                                // Phi (0..PI) from North(0) to South(PI)
                                const phi = (90 - lat) * (Math.PI / 180);
                                // Theta (0..2PI) from -180 to 180
                                const theta = (lng + 180) * (Math.PI / 180);

                                generatedParticles.push({
                                    x: 0, y: 0, z: 0, // Will be calculated in render loop
                                    baseR: coreRadius,
                                    theta,
                                    phi,
                                    type: 'core', // Treat as core so it glows
                                    randomOffset: Math.random() * 10
                                });
                            }
                        }
                    }
                });

                setEarthParticles(generatedParticles);
            } catch (error) {
                console.error("Failed to load earth data:", error);
                // Fallback to random core if failed? 
                // For now, empty core is better than crash
            }
        };

        loadWorldData();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Configuration ---
        const width = 150;
        const height = 150;
        const shellRadius = 60;
        // Core radius is defined in particle generation

        // Physics & Animation State
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
        // 1. Add Shell Particles (The "Container")
        // NOTE: Core particles are added from state inside the loop or we merge them here.
        // Since the timer runs continuously, we can merge existing earthParticles each frame OR
        // just push them once into a ref. However, to keep it simple with React state:
        // We will construct the render list inside the timer or setup `particles` array to include them.

        // Let's generate Shell once
        const shellParticles: Particle[] = [];
        const shellCount = 325;
        for (let i = 0; i < shellCount; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / shellCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            shellParticles.push({
                x: 0, y: 0, z: 0,
                baseR: shellRadius,
                theta,
                phi,
                type: 'shell',
                randomOffset: Math.random() * 10
            });
        }

        // --- Animation Loop ---
        const timer = d3.timer((elapsed: number) => {
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
            const breathing = Math.sin(time * 2.5) * 0.03;
            // Snappy shrink on volume
            const shrink = smoothedVolume * 0.55;
            const currentScale = Math.max(0.3, 1.0 + breathing - shrink);

            // 4. Clear Canvas
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;

            // Use Lighter blending for glowing effect
            ctx.globalCompositeOperation = 'lighter';

            // 5. Combine Shell + Earth
            // If earth isn't loaded yet, show nothing effectively (or fallback)
            // But we want shell always
            const allParticles = [...shellParticles, ...earthParticles];

            // 6. Project and Transform Particles
            const projectedParticles = allParticles.map(p => {
                let r = p.baseR * currentScale;

                // Core spins on multiple axes for "Nucleus" feel
                let pTheta = p.theta;
                let pPhi = p.phi;

                if (p.type === 'core') {
                    // Earth rotation 
                    // Adjust speed to look good
                    pTheta -= time * 0.5; // Reverse spin to West-to-East
                    // Remove wiggle for Earth to keep geography stable
                }

                // Convert Spherical -> Cartesian
                let x = -r * Math.sin(pPhi) * Math.cos(pTheta); // Flip X to un-mirror
                let y = -r * Math.cos(pPhi); // Negate Y to put North Pole (phi=0) at Top
                let z = r * Math.sin(pPhi) * Math.sin(pTheta);

                // Apply Global Rotation (Y-axis) - applies to both shell and core relative to viewer
                // Note: Earth already rotating by changing pTheta above. 
                // Adding global rotationY makes the whole system spin (shell + earth together).
                const cosY = Math.cos(rotationY);
                const sinY = Math.sin(rotationY);

                // We actually want the Earth to rotate independently inside the shell?
                // Or the whole thing rotates?
                // The current code rotates everything by `rotationY`. 
                // If we also rotated pTheta for Earth, it spins faster or differently.
                // Let's rely on global rotation for the main spin, 
                // but maybe offset Earth slightly if requested.
                // For now, let's keep them unified so it feels like one device.

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
                    // EARTH DOTS
                    ctx.beginPath();
                    // Core flickers less, more stable
                    // Core gets denser/hotter when shrunk (volume high)
                    const heat = 1 + smoothedVolume * 2;
                    // Slightly smaller dots for earth to verify detail
                    const size = 1.2 * p.scale * heat;

                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${alpha})`;
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
    }, [isActive, earthParticles]); // Re-run when earth data loads

    return (
        <canvas
            ref={canvasRef}
            onClick={onClick}
            className="w-full h-full cursor-pointer touch-none outline-none"
            style={{
                filter: isActive
                    ? 'drop-shadow(0 0 25px rgba(14, 165, 233, 0.5))'
                    : 'none',
                transition: 'filter 0.5s ease'
            }}
        />
    );
};