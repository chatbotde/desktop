import React from 'react';

/**
 * Start component renders a CSS/SVG animated talking star.
 * Modified to have no background and be click-through where transparent.
 */
export const Start: React.FC = () => {
    return (
        <div className="start-wrapper" style={{
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
                .start-svg {
                    width: 350px;
                    height: 350px;
                    pointer-events: none;
                    filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.4));
                }

                .start-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .start-clickable-part:hover {
                    filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
                }

                .anim-float-star {
                    animation: float-star 4s ease-in-out infinite;
                    transform-origin: center;
                }

                .anim-blink-star {
                    animation: blink-star 4.5s infinite;
                }

                .anim-shine-star {
                    animation: shine-star 2s ease-in-out infinite alternate;
                }

                @keyframes float-star {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-18px) rotate(4deg); }
                }

                @keyframes blink-star {
                    0%, 94%, 98%, 100% { transform: scaleY(1); }
                    96% { transform: scaleY(0.1); }
                }

                @keyframes shine-star {
                    0% { opacity: 0.3; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.2); }
                }
                `}
            </style>

            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="start-svg">
                <g className="anim-float-star start-clickable-part">
                    {/* Little magical sparkles */}
                    <g className="anim-shine-star" style={{ transformOrigin: '30px 40px', animationDelay: '0s' }}>
                        <path d="M 30 55 L 34 44 L 45 40 L 34 36 L 30 25 L 26 36 L 15 40 L 26 44 Z" fill="#FFF" />
                    </g>
                    <g className="anim-shine-star" style={{ transformOrigin: '170px 30px', animationDelay: '0.7s' }}>
                        <path d="M 170 45 L 173 37 L 181 34 L 173 31 L 170 23 L 167 31 L 159 34 L 167 37 Z" fill="#FFF" />
                    </g>
                    <g className="anim-shine-star" style={{ transformOrigin: '155px 160px', animationDelay: '1.4s' }}>
                        <path d="M 155 170 L 158 162 L 166 159 L 158 156 L 155 148 L 152 156 L 144 159 L 152 162 Z" fill="#FFF" />
                    </g>

                    {/* Base Star Shape */}
                    <polygon points="100,20 125,70 180,80 140,120 150,175 100,150 50,175 60,120 20,80 75,70"
                        fill="#FFD700" stroke="#F57F17" strokeWidth="14" strokeLinejoin="round" />

                    {/* Inner Star Fill */}
                    <polygon points="100,20 125,70 180,80 140,120 150,175 100,150 50,175 60,120 20,80 75,70"
                        fill="#FFEE58" stroke="#FFCA28" strokeWidth="4" strokeLinejoin="round" />

                    {/* Rosy Cheeks */}
                    <ellipse cx="65" cy="115" rx="12" ry="7" fill="#FF8A65" opacity="0.6" />
                    <ellipse cx="135" cy="115" rx="12" ry="7" fill="#FF8A65" opacity="0.6" />

                    {/* Face Elements */}
                    <g>
                        {/* Left Eye */}
                        <g className="anim-blink-star" style={{ transformOrigin: '75px 100px' }}>
                            <circle cx="75" cy="100" r="9" fill="#2C3E50" />
                            <circle cx="72" cy="96" r="3.5" fill="#FFFFFF" />
                            <circle cx="78" cy="103" r="1.5" fill="#FFFFFF" />
                        </g>

                        {/* Right Eye */}
                        <g className="anim-blink-star" style={{ transformOrigin: '125px 100px' }}>
                            <circle cx="125" cy="100" r="9" fill="#2C3E50" />
                            <circle cx="122" cy="96" r="3.5" fill="#FFFFFF" />
                            <circle cx="128" cy="103" r="1.5" fill="#FFFFFF" />
                        </g>
                    </g>

                    {/* Happy Open Mouth */}
                    <path d="M 88 114 Q 100 138 112 114 Z" fill="#D32F2F" stroke="#2C3E50" strokeWidth="3" strokeLinejoin="round" />

                    {/* Cute Pink Tongue */}
                    <path d="M 91 121 Q 100 117 109 121 Q 100 136 91 121 Z" fill="#FF8A80" />

                    {/* Glossy Highlight */}
                    <path d="M 85 40 L 100 25 L 115 60 Q 105 70 85 40 Z" fill="#FFFFFF" opacity="0.3" stroke="none" />
                </g>
            </svg>
        </div>
    );
};