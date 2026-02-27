import React from 'react';

/**
 * Sun component renders a CSS/SVG animated talking sun.
 * Modified to have no background and be click-through where transparent.
 */
export const Sun: React.FC = () => {
    return (
        <div className="sun-wrapper" style={{
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
                .sun-svg {
                    width: 350px;
                    height: 350px;
                    pointer-events: none;
                    filter: drop-shadow(0 0 30px rgba(255, 193, 7, 0.5));
                }

                .sun-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .sun-clickable-part:hover {
                    filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
                }

                .anim-float {
                    animation: float 4s ease-in-out infinite;
                    transform-origin: center;
                }

                .anim-blink {
                    animation: blink 4.5s infinite;
                }

                .anim-shine {
                    animation: shine 2s ease-in-out infinite alternate;
                }

                .anim-talk {
                    animation: talk 3s infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-18px) rotate(3deg); }
                }

                @keyframes blink {
                    0%, 94%, 98%, 100% { transform: scaleY(1); }
                    96% { transform: scaleY(0.1); }
                }

                @keyframes shine {
                    0% { opacity: 0.3; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.2); }
                }

                @keyframes talk {
                    0%, 100% { transform: scaleY(0.2); }
                    10%, 30% { transform: scaleY(1); }
                    20%, 40% { transform: scaleY(0.4); }
                    50%, 90% { transform: scaleY(0.2); }
                    60%, 80% { transform: scaleY(0.8); }
                    70% { transform: scaleY(0.3); }
                }
                `}
            </style>

            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="sun-svg">
                <g className="anim-float sun-clickable-part">


                    {/* Sun Base Circle */}
                    <circle cx="100" cy="100" r="50" fill="#FFEE58" stroke="#FF8F00" strokeWidth="5" />

                    {/* Glossy Highlight */}
                    <path d="M 60 70 A 40 40 0 0 1 110 55 A 48 48 0 0 0 65 95 Z" fill="#FFFFFF" opacity="0.4" stroke="none" />

                    {/* Rosy Cheeks */}
                    <ellipse cx="68" cy="102" rx="9" ry="5" fill="#FF8A65" opacity="0.7" />
                    <ellipse cx="132" cy="102" rx="9" ry="5" fill="#FF8A65" opacity="0.7" />

                    {/* Face Elements */}
                    <g>
                        {/* Left Eye */}
                        <g className="anim-blink" style={{ transformOrigin: '82px 88px' }}>
                            <circle cx="82" cy="88" r="7" fill="#2C3E50" />
                            <circle cx="80" cy="85" r="2.5" fill="#FFFFFF" />
                            <circle cx="84" cy="90" r="1" fill="#FFFFFF" />
                        </g>

                        {/* Right Eye */}
                        <g className="anim-blink" style={{ transformOrigin: '118px 88px' }}>
                            <circle cx="118" cy="88" r="7" fill="#2C3E50" />
                            <circle cx="116" cy="85" r="2.5" fill="#FFFFFF" />
                            <circle cx="120" cy="90" r="1" fill="#FFFFFF" />
                        </g>
                    </g>

                    {/* Talking Mouth */}
                    <g className="anim-talk" style={{ transformOrigin: '100px 105px' }}>
                        <path d="M 85 105 Q 100 135 115 105 Z" fill="#D32F2F" stroke="#2C3E50" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M 88 113 Q 100 107 112 113 Q 100 128 88 113 Z" fill="#FF8A80" />
                    </g>
                </g>
            </svg>
        </div>
    );
};