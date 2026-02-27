import React from 'react';

/**
 * FighterPlane component renders a CSS/SVG animated fighter jet.
 * Modified to have no background and be click-through where transparent.
 */
export const FighterPlane: React.FC = () => {
    return (
        <div className="fighterplane-wrapper" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'hidden',
            zIndex: 50
        }}>
            <style>
                {`
                .fighterplane-svg {
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .fighterplane-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .fighterplane-clickable-part:hover {
                    filter: brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
                }
                `}
            </style>
            <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="fighterplane-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    {/* Plane Drop Shadow for realistic depth */}
                    <filter id="plane-shadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="-10" dy="15" stdDeviation="6" floodColor="#020617" floodOpacity="0.6" />
                    </filter>
                </defs>

                {/* The Airplane Container */}
                <g id="plane-container" className="fighterplane-clickable-part">
                    {/* Adding a subtle continuous bobbing and tilting effect */}
                    <g id="fighter-plane-bobbing">
                        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="1.5s" repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="rotate" values="0; -2; 0; 2; 0" dur="2s" repeatCount="indefinite" additive="sum" />

                        {/* Fighter Jet Geometry */}
                        <g transform="scale(1.8)" filter="url(#plane-shadow)">
                            {/* Animated Afterburner Flame */}
                            <g transform="translate(-50, 0)">
                                <polygon points="0,-6 -30,0 0,6" fill="#ea580c">
                                    <animateTransform attributeName="transform" type="scale" values="1 1; 1.3 1; 1 1" dur="0.1s" repeatCount="indefinite" />
                                </polygon>
                                <polygon points="0,-3 -15,0 0,3" fill="#fef08a">
                                    <animateTransform attributeName="transform" type="scale" values="1 1; 1.4 1; 1 1" dur="0.05s" repeatCount="indefinite" />
                                </polygon>
                            </g>

                            {/* Main Delta Wings */}
                            <polygon points="10,0 -30,-50 -45,-50 -20,0 -45,50 -30,50" fill="#475569" />
                            {/* Wing Leading Edge Highlights */}
                            <polygon points="10,0 -30,-50 -35,-50 -20,0" fill="#64748b" />
                            <polygon points="10,0 -30,50 -35,50 -20,0" fill="#94a3b8" />

                            {/* Tail Fins (Horizontal Stabilizers) */}
                            <polygon points="-35,0 -45,-25 -52,-25 -42,0 -52,25 -45,25" fill="#334155" />

                            {/* Jet Fuselage (Main Body) */}
                            <path d="M 60,0 C 40,-10 -30,-10 -50,-6 L -50,6 C -30,10 40,10 60,0 Z" fill="#475569" />
                            {/* Fuselage Top Highlight */}
                            <path d="M 60,0 C 40,-10 -30,-10 -50,-6 L -50,0 Z" fill="#64748b" />

                            {/* Vertical Tail Fin (Top Edge View) */}
                            <polygon points="-50,-1 -35,-1 -30,1 -50,1" fill="#1e293b" />

                            {/* Sleek Glass Canopy */}
                            <ellipse cx="15" cy="0" rx="16" ry="5" fill="#0284c7" />
                            {/* Canopy Sun Glint Reflection */}
                            <ellipse cx="18" cy="-1.5" rx="8" ry="2" fill="#7dd3fc" opacity="0.8" />

                            {/* Nose Radome Cone */}
                            <path d="M 60,0 C 50,-3 45,-3 40,0 C 45,3 50,3 60,0 Z" fill="#1e293b" />
                        </g>
                    </g>

                    {/* Binds the plane to a random free-flying invisible curve */}
                    <animateMotion dur="14s" repeatCount="indefinite" rotate="auto"
                        path="M -200 400 C 100 100, 300 900, 600 500 S 1100 100, 1400 400 C 1100 800, 600 100, 400 600 S -100 700, -200 400 Z" />
                </g>
            </svg>
        </div>
    );
};