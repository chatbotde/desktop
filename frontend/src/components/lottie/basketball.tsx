import React from 'react';

/**
 * Basketball component renders a CSS-animated SVG basketball.
 * Modified to have no background and be click-through where transparent.
 */
export const Basketball: React.FC = () => {
    return (
        <div className="basketball-wrapper" style={{
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
                @keyframes bounce-ball {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(120px) rotate(15deg);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }

                .animate-bounce-ball {
                    animation: bounce-ball 1.2s infinite;
                }

                .basketball-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .basketball-clickable-part:hover {
                    filter: brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
                }
                
                .svg-container {
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                }
                `}
            </style>

            <div className="relative w-64 h-96 flex flex-col items-center justify-start pt-10">
                <div className="w-64 h-64 relative z-10 animate-bounce-ball svg-container basketball-clickable-part">
                    <svg viewBox="0 0 256 256" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            {/* 3D Spherical Gradient */}
                            <radialGradient id="ballGradient" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stopColor="#ffb37b" />
                                <stop offset="20%" stopColor="#f57c23" />
                                <stop offset="70%" stopColor="#cc4a00" />
                                <stop offset="100%" stopColor="#802000" />
                            </radialGradient>

                            {/* Dimple Texture Pattern */}
                            <pattern id="dotTexture" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(15)">
                                <circle cx="3" cy="3" r="1.1" fill="#000000" fillOpacity="0.18" />
                                <circle cx="2.5" cy="2.5" r="0.8" fill="#ffffff" fillOpacity="0.1" />
                            </pattern>

                            {/* Clip path to keep lines perfectly inside the circle */}
                            <clipPath id="ballClip">
                                <circle cx="128" cy="128" r="120" />
                            </clipPath>
                        </defs>

                        {/* Base Colored Sphere */}
                        <circle cx="128" cy="128" r="120" fill="url(#ballGradient)" />

                        {/* Applied Texture Layer */}
                        <circle cx="128" cy="128" r="120" fill="url(#dotTexture)" />

                        {/* Basketball Seams/Lines */}
                        <g clipPath="url(#ballClip)">
                            {/* Rotated group to give it a dynamic angle */}
                            <g transform="rotate(-22 128 128)">
                                {/* Vertical Center Line */}
                                <line x1="128" y1="-20" x2="128" y2="276" stroke="#24140f" strokeWidth="7" />

                                {/* Horizontal Center Line */}
                                <line x1="-20" y1="128" x2="276" y2="128" stroke="#24140f" strokeWidth="7" />

                                {/* Left Arc */}
                                <ellipse cx="20" cy="128" rx="75" ry="145" fill="none" stroke="#24140f" strokeWidth="7" />

                                {/* Right Arc */}
                                <ellipse cx="236" cy="128" rx="75" ry="145" fill="none" stroke="#24140f" strokeWidth="7" />
                            </g>
                        </g>

                        {/* Outer Stroke / Border definition */}
                        <circle cx="128" cy="128" r="120" fill="none" stroke="#24140f" strokeWidth="8" />

                        {/* Inner soft highlight for extra 3D pop */}
                        <circle cx="128" cy="128" r="116" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.15" />
                    </svg>
                </div>
            </div>
        </div>
    );
};