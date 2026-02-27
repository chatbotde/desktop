import React from 'react';

/**
 * Rolls Royce component renders a CSS/SVG animated car.
 * Transformed from raw HTML/SVG to a React component.
 */
export const RollsRoyce: React.FC = () => {
    return (
        <div className="rr-wrapper" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>
                {`
                .rr-svg {
                    width: 90%;
                    max-width: 1000px;
                    height: auto;
                    filter: drop-shadow(0 30px 20px rgba(0, 0, 0, 0.6));
                    pointer-events: none;
                    transform: scaleX(-1);
                }

                .rr-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .rr-clickable-part:hover {
                    filter: brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
                }

                /* Subtle glowing effect for the headlight */
                .rr-headlight-glow {
                    animation: rr-pulse 3s infinite alternate;
                }

                @keyframes rr-pulse {
                    0% { opacity: 0.6; filter: blur(2px); }
                    100% { opacity: 1; filter: blur(4px); }
                }

                /* --- NEW ANIMATION STYLES --- */
                .rr-wheel-spin {
                    animation: rr-spin 0.6s linear infinite;
                    transform-origin: 0 0; /* Spins around the 0,0 center defined in the SVG */
                }

                @keyframes rr-spin {
                    100% { transform: rotate(-360deg); }
                }

                .rr-chassis-bounce {
                    animation: rr-bounce 1.5s ease-in-out infinite;
                }

                @keyframes rr-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }

                .rr-speed-lines line {
                    stroke: rgba(255, 255, 255, 0.15);
                    stroke-width: 3;
                    stroke-linecap: round;
                    animation: rr-dash linear infinite;
                }

                .rr-line-1 { animation-duration: 0.8s; animation-delay: 0.1s; }
                .rr-line-2 { animation-duration: 1.2s; animation-delay: 0.4s; }
                .rr-line-3 { animation-duration: 0.9s; animation-delay: 0.2s; }
                .rr-line-4 { animation-duration: 1.5s; animation-delay: 0.6s; }

                @keyframes rr-dash {
                    0% { transform: translateX(1100px); }
                    100% { transform: translateX(-200px); }
                }

                /* --- CUTE FACE ANIMATION --- */
                .rr-cute-eyes {
                    animation: rr-blink 4s infinite;
                    transform-origin: center;
                    transform-box: fill-box;
                }

                @keyframes rr-blink {
                    0%, 92%, 100% { transform: scaleY(1); }
                    96% { transform: scaleY(0.1); }
                }

                /* --- TALKING MOUTH ANIMATION --- */
                .rr-mouth-talk {
                    animation: rr-talk 0.3s ease-in-out infinite alternate;
                    transform-origin: center;
                    transform-box: fill-box;
                }

                @keyframes rr-talk {
                    0% { transform: scaleY(0.3); opacity: 0.6; }
                    50% { transform: scaleY(1); opacity: 1; }
                    100% { transform: scaleY(0.5); opacity: 0.8; }
                }

                .rr-mouth-smile {
                    animation: rr-smile-hide 0.3s ease-in-out infinite alternate;
                    transform-origin: center;
                    transform-box: fill-box;
                }

                @keyframes rr-smile-hide {
                    0% { opacity: 0; }
                    100% { opacity: 0; }
                }
                
                .rr-emblem {
                    font-family: serif;
                    font-weight: bold;
                }
                `}
            </style>

            <svg className="rr-svg" viewBox="0 0 1000 450" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="rr-lowerBody" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a1c29" />
                        <stop offset="50%" stopColor="#0d0f18" />
                        <stop offset="100%" stopColor="#050508" />
                    </linearGradient>

                    <linearGradient id="rr-upperBody" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f5f7fa" />
                        <stop offset="40%" stopColor="#d3d7df" />
                        <stop offset="100%" stopColor="#9ba3b5" />
                    </linearGradient>

                    <linearGradient id="rr-glass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2c3e50" />
                        <stop offset="50%" stopColor="#1a252f" />
                        <stop offset="100%" stopColor="#0d131a" />
                    </linearGradient>

                    <linearGradient id="rr-chrome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="25%" stopColor="#cccccc" />
                        <stop offset="50%" stopColor="#555555" />
                        <stop offset="75%" stopColor="#dddddd" />
                        <stop offset="100%" stopColor="#888888" />
                    </linearGradient>

                    <linearGradient id="rr-wheelRim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#e0e0e0" />
                        <stop offset="50%" stopColor="#7a7a7a" />
                        <stop offset="100%" stopColor="#222222" />
                    </linearGradient>

                    <linearGradient id="rr-glassReflection" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                        <stop offset="30%" stopColor="rgba(255,255,255,0.0)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                    </linearGradient>
                </defs>

                <g className="rr-clickable-part">
                    {/* Floor Shadow */}
                    <ellipse cx="505" cy="355" rx="390" ry="12" fill="rgba(0,0,0,0.7)" filter="blur(8px)" />
                    <ellipse cx="505" cy="355" rx="340" ry="6" fill="rgba(0,0,0,0.9)" filter="blur(3px)" />



                    {/* Chassis */}
                    <g className="rr-chassis-bounce">
                        <path d="M 148 175 L 862 175" stroke="#d4af37" strokeWidth="3" fill="none" opacity="0.4" filter="blur(2px)" />
                        <path d="M 150 175 L 860 175 C 870 180, 875 220, 865 280 L 785 280 A 65 65 0 0 0 655 280 L 355 280 A 65 65 0 0 0 225 280 L 145 280 C 135 220, 140 185, 150 175 Z" fill="url(#rr-lowerBody)" stroke="#000" strokeWidth="1" />
                        <path d="M 150 175 L 155 155 C 200 152, 300 152, 320 152 C 350 152, 380 95, 410 90 C 480 85, 580 85, 620 90 C 670 95, 730 145, 760 155 C 810 155, 840 160, 860 175 Z" fill="url(#rr-upperBody)" />
                        <path d="M 148 175 L 862 175" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.9" />

                        {/* Windows */}
                        <path d="M 335 152 C 360 152, 385 102, 405 98 L 500 98 L 500 152 Z" fill="url(#rr-glass)" />
                        <path d="M 335 152 C 360 152, 385 102, 405 98 L 500 98 L 500 152 Z" fill="url(#rr-glassReflection)" />
                        <path d="M 515 98 L 605 98 C 635 100, 680 140, 715 152 L 515 152 Z" fill="url(#rr-glass)" />
                        <path d="M 515 98 L 605 98 C 635 100, 680 140, 715 152 L 515 152 Z" fill="url(#rr-glassReflection)" />
                        <path d="M 335 152 C 360 152, 385 102, 405 98 L 605 98 C 635 100, 680 140, 715 152" fill="none" stroke="url(#rr-chrome)" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 335 152 L 715 152" fill="none" stroke="url(#rr-chrome)" strokeWidth="2" opacity="0.6" />
                        <rect x="500" y="98" width="15" height="54" fill="#0a0a0d" />

                        {/* Details */}
                        <line x1="507" y1="175" x2="507" y2="278" stroke="#000" strokeWidth="1.5" opacity="0.6" />
                        <rect x="480" y="165" width="16" height="5" rx="2.5" fill="url(#rr-chrome)" />
                        <rect x="515" y="165" width="16" height="5" rx="2.5" fill="url(#rr-chrome)" />

                        {/* Cute Face */}
                        <g className="rr-cute-face">
                            <ellipse cx="430" cy="225" rx="16" ry="8" fill="#ff66aa" opacity="0.6" filter="blur(3px)" />
                            <ellipse cx="570" cy="225" rx="16" ry="8" fill="#ff66aa" opacity="0.6" filter="blur(3px)" />
                            <g className="rr-cute-eyes">
                                <ellipse cx="460" cy="205" rx="18" ry="26" fill="#ffffff" />
                                <ellipse cx="540" cy="205" rx="18" ry="26" fill="#ffffff" />
                                <ellipse cx="454" cy="205" rx="11" ry="16" fill="#111111" />
                                <ellipse cx="534" cy="205" rx="11" ry="16" fill="#111111" />
                                <circle cx="448" cy="196" r="5" fill="#ffffff" />
                                <circle cx="458" cy="212" r="2.5" fill="#ffffff" />
                                <circle cx="528" cy="196" r="5" fill="#ffffff" />
                                <circle cx="538" cy="212" r="2.5" fill="#ffffff" />
                            </g>
                            {/* Smile (hidden during talking) */}
                            <path className="rr-mouth-smile" d="M 485 225 Q 492.5 238 500 225 Q 507.5 238 515 225" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Talking Mouth */}
                            <ellipse className="rr-mouth-talk" cx="500" cy="232" rx="12" ry="8" fill="#111111" stroke="#ffffff" strokeWidth="3" />
                            <ellipse cx="500" cy="229" rx="6" ry="2" fill="#ff6699" opacity="0.5" />
                        </g>

                        {/* Grille & Lights */}
                        <rect x="142" y="150" width="13" height="120" rx="2" fill="url(#rr-chrome)" />
                        <line x1="145" y1="152" x2="145" y2="268" stroke="#111" strokeWidth="1.5" />
                        <line x1="148" y1="152" x2="148" y2="268" stroke="#111" strokeWidth="1.5" />
                        <line x1="151" y1="152" x2="151" y2="268" stroke="#111" strokeWidth="1.5" />
                        <path d="M 148 150 C 145 135, 158 138, 153 145 L 138 140 C 145 145, 150 148, 148 150 Z" fill="url(#rr-chrome)" />

                        <rect x="151" y="172" width="6" height="20" rx="3" fill="#ffffff" className="rr-headlight-glow" />
                        <rect x="153" y="172" width="8" height="20" rx="3" fill="#eef7ff" opacity="0.9" />
                        <rect x="152" y="171" width="10" height="22" rx="3" fill="none" stroke="url(#rr-chrome)" strokeWidth="2" />
                        <rect x="148" y="245" width="5" height="10" rx="2" fill="#eef7ff" opacity="0.8" />

                        <path d="M 860 182 L 867 182 L 864 210 L 857 210 Z" fill="#dd0000" />
                        <path d="M 860 182 L 867 182 L 864 210 L 857 210 Z" fill="none" stroke="url(#rr-chrome)" strokeWidth="1.5" />
                        <path d="M 862 195 L 865 195 L 864 205 L 861 205 Z" fill="#ffffff" opacity="0.5" />

                        <rect x="830" y="270" width="30" height="8" rx="4" fill="url(#rr-chrome)" />
                        <rect x="835" y="272" width="20" height="4" rx="2" fill="#111" />
                        <path d="M 145 275 L 860 275" stroke="url(#rr-chrome)" strokeWidth="2" fill="none" opacity="0.5" />

                        {/* Wheels */}
                        <g transform="translate(290, 280)">
                            <circle cx="0" cy="0" r="53" fill="#000" />
                            <g className="rr-wheel-spin">
                                <circle cx="0" cy="0" r="51" fill="#151515" />
                                <circle cx="0" cy="0" r="48" fill="none" stroke="#2a2a2a" strokeWidth="2" />
                                <circle cx="0" cy="0" r="38" fill="url(#rr-wheelRim)" />
                                <circle cx="0" cy="0" r="32" fill="#111" />
                                <g stroke="url(#rr-chrome)" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="0" y1="-32" x2="0" y2="32" />
                                    <line x1="-32" y1="0" x2="32" y2="0" />
                                    <line x1="-22.6" y1="-22.6" x2="22.6" y2="22.6" />
                                    <line x1="-22.6" y1="22.6" x2="22.6" y2="-22.6" />
                                    <line x1="-12.2" y1="-29.5" x2="12.2" y2="29.5" />
                                    <line x1="-29.5" y1="-12.2" x2="29.5" y2="12.2" />
                                    <line x1="-29.5" y1="12.2" x2="29.5" y2="-12.2" />
                                    <line x1="-12.2" y1="29.5" x2="12.2" y2="-29.5" />
                                </g>
                                <circle cx="0" cy="0" r="38" fill="none" stroke="url(#rr-chrome)" strokeWidth="3" />
                            </g>
                            <circle cx="0" cy="0" r="9" fill="url(#rr-chrome)" />
                            <circle cx="0" cy="0" r="6" fill="#111" />
                            <text className="rr-emblem" x="0" y="2.5" fontSize="7.5" fill="#fff" textAnchor="middle">RR</text>
                        </g>

                        <g transform="translate(720, 280)">
                            <circle cx="0" cy="0" r="53" fill="#000" />
                            <g className="rr-wheel-spin">
                                <circle cx="0" cy="0" r="51" fill="#151515" />
                                <circle cx="0" cy="0" r="48" fill="none" stroke="#2a2a2a" strokeWidth="2" />
                                <circle cx="0" cy="0" r="38" fill="url(#rr-wheelRim)" />
                                <circle cx="0" cy="0" r="32" fill="#111" />
                                <g stroke="url(#rr-chrome)" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="0" y1="-32" x2="0" y2="32" />
                                    <line x1="-32" y1="0" x2="32" y2="0" />
                                    <line x1="-22.6" y1="-22.6" x2="22.6" y2="22.6" />
                                    <line x1="-22.6" y1="22.6" x2="22.6" y2="-22.6" />
                                    <line x1="-12.2" y1="-29.5" x2="12.2" y2="29.5" />
                                    <line x1="-29.5" y1="-12.2" x2="29.5" y2="12.2" />
                                    <line x1="-29.5" y1="12.2" x2="29.5" y2="-12.2" />
                                    <line x1="-12.2" y1="29.5" x2="12.2" y2="-29.5" />
                                </g>
                                <circle cx="0" cy="0" r="38" fill="none" stroke="url(#rr-chrome)" strokeWidth="3" />
                            </g>
                            <circle cx="0" cy="0" r="9" fill="url(#rr-chrome)" />
                            <circle cx="0" cy="0" r="6" fill="#111" />
                            <text className="rr-emblem" x="0" y="2.5" fontSize="7.5" fill="#fff" textAnchor="middle">RR</text>
                        </g>

                    </g>
                </g>
            </svg>
        </div>
    );
};