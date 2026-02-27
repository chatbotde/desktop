import React from 'react';

/**
 * Skateboard component renders a CSS-animated SVG skater.
 * Modified to have no background and be click-through where transparent.
 */
export const Skateboard: React.FC = () => {
    return (
        <div className="skateboard-wrapper" style={{
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
                .skater-svg {
                    width: clamp(200px, 30vw, 400px);
                    height: auto;
                    aspect-ratio: 250 / 400;
                    pointer-events: none;
                }

                .skater-clicakble-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .skater-clicakble-part:hover {
                    filter: brightness(1.1);
                }
                
                :root {
                    --skate-speed: 0.8s;
                }

                @keyframes skate-spin {
                    100% { transform: rotate(360deg); }
                }

                .anim-wheel {
                    animation: skate-spin 0.3s linear infinite;
                }

                @keyframes skate-body-bob {
                    0%, 100% { transform: translateY(4px); }
                    20% { transform: translateY(6px); }
                    60% { transform: translateY(-3px); }
                    80% { transform: translateY(-5px); }
                }

                .anim-body-bob {
                    animation: skate-body-bob var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-torso-tilt {
                    0%, 100% { transform: rotate(10deg); }
                    20% { transform: rotate(16deg); }
                    60% { transform: rotate(4deg); }
                }

                .anim-torso {
                    animation: skate-torso-tilt var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-back-thigh {
                    0%, 100% { transform: rotate(15deg); }
                    25% { transform: rotate(-45deg); }
                    50% { transform: rotate(-25deg); }
                    75% { transform: rotate(35deg); }
                }

                .anim-back-thigh {
                    animation: skate-back-thigh var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-back-calf {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    50% { transform: rotate(80deg); }
                    75% { transform: rotate(45deg); }
                }

                .anim-back-calf {
                    animation: skate-back-calf var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-front-thigh {
                    0%, 100% { transform: rotate(6deg); }
                    20% { transform: rotate(8deg); }
                    60% { transform: rotate(-4deg); }
                    80% { transform: rotate(-6deg); }
                }

                .anim-front-thigh {
                    animation: skate-front-thigh var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-front-calf {
                    0%, 100% { transform: rotate(-8deg); }
                    20% { transform: rotate(-10deg); }
                    60% { transform: rotate(4deg); }
                    80% { transform: rotate(6deg); }
                }

                .anim-front-calf {
                    animation: skate-front-calf var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-front-arm {
                    0%, 100% { transform: rotate(-20deg); }
                    25% { transform: rotate(30deg); }
                    75% { transform: rotate(-40deg); }
                }

                .anim-front-arm {
                    animation: skate-front-arm var(--skate-speed) infinite ease-in-out;
                }

                @keyframes skate-back-arm {
                    0%, 100% { transform: rotate(30deg); }
                    25% { transform: rotate(-30deg); }
                    75% { transform: rotate(45deg); }
                }

                .anim-back-arm {
                    animation: skate-back-arm var(--skate-speed) infinite ease-in-out;
                }
                `}
            </style>
            <svg viewBox="400 200 250 400" className="skater-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    {/* Hoodie Gradient */}
                    <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#118AB2" />
                        <stop offset="50%" stopColor="#25A5D1" />
                        <stop offset="100%" stopColor="#118AB2" />
                    </linearGradient>

                    {/* Skin Gradient */}
                    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFD8BE" />
                        <stop offset="100%" stopColor="#FFC8A2" />
                    </linearGradient>

                    {/* Skateboard Deck Gradient */}
                    <linearGradient id="deckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF5E8E" />
                        <stop offset="100%" stopColor="#EF476F" />
                    </linearGradient>

                    {/* Global Glow Filter */}
                    <filter id="skaterGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <g id="skater_container" className="skater-clicakble-part" style={{ stroke: '#FFFFFF', strokeWidth: '1px', strokeLinejoin: 'round' }}>
                    {/* SHADOW */}
                    <ellipse cx="510" cy="542" rx="60" ry="6" fill="#000000" opacity="0.0" />

                    {/* == BACKGROUND ELEMENTS (Left Side) == */}
                    <g className="anim-body-bob">
                        {/* Back Arm */}
                        <g className="anim-back-arm" style={{ transformOrigin: '530px 270px' }}>
                            <path d="M 530 270 L 560 320 L 585 350" fill="none" stroke="#0D5C75" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="585" cy="350" r="9" fill="url(#skinGrad)" />
                        </g>

                        {/* Back Leg (Pushing) */}
                        <g className="anim-back-thigh" style={{ transformOrigin: '500px 380px' }}>
                            <line x1="500" y1="380" x2="500" y2="450" stroke="#052736" strokeWidth="26" strokeLinecap="round" />
                            <g className="anim-back-calf" style={{ transformOrigin: '500px 450px' }}>
                                <line x1="500" y1="450" x2="500" y2="525" stroke="#052736" strokeWidth="22" strokeLinecap="round" />
                                <g transform="translate(-10, 0)">
                                    <path d="M 480 525 L 530 525 A 12 12 0 0 0 530 510 L 490 510 Z" fill="#CCC" />
                                    <path d="M 480 525 L 530 525" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
                                    <circle cx="510" cy="517" r="4" fill="#118AB2" />
                                </g>
                            </g>
                        </g>
                    </g>

                    {/* == SKATEBOARD == */}
                    <g id="skateboard">
                        <g style={{ transformOrigin: '470px 530px' }} className="anim-wheel">
                            <circle cx="470" cy="530" r="12" fill="#06D6A0" />
                            <circle cx="470" cy="530" r="4" fill="#0A0F1D" />
                            <line x1="470" y1="518" x2="470" y2="542" stroke="#0A0F1D" strokeWidth="2" />
                            <line x1="458" y1="530" x2="482" y2="530" stroke="#0A0F1D" strokeWidth="2" />
                        </g>
                        <g style={{ transformOrigin: '550px 530px' }} className="anim-wheel">
                            <circle cx="550" cy="530" r="12" fill="#06D6A0" />
                            <circle cx="550" cy="530" r="4" fill="#0A0F1D" />
                            <line x1="550" y1="518" x2="550" y2="542" stroke="#0A0F1D" strokeWidth="2" />
                            <line x1="538" y1="530" x2="562" y2="530" stroke="#0A0F1D" strokeWidth="2" />
                        </g>
                        <path d="M 425 510 L 445 515 L 575 515 L 595 510" fill="none" stroke="url(#deckGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 440 512 L 580 512" fill="none" stroke="#222" strokeWidth="5" strokeLinecap="round" />
                    </g>

                    {/* == FOREGROUND ELEMENTS == */}
                    <g className="anim-body-bob">
                        <g className="anim-torso" style={{ transformOrigin: '500px 380px' }}>
                            <path d="M 500 240 Q 480 260 485 300 Q 510 270 530 270 Z" fill="#0D5C75" />
                            <path d="M 530 270 C 520 300 480 340 500 380 L 515 380 C 530 350 550 300 530 270 Z" fill="url(#hoodieGrad)" stroke="url(#hoodieGrad)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Highlight on hoodie */}
                            <path d="M 520 280 C 515 300 495 320 505 350" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="1.0" />

                            <path d="M 505 350 L 530 350 L 520 320 Z" fill="#0D5C75" opacity="1.0" />
                            <path d="M 525 280 Q 520 300 525 310 M 535 280 Q 530 300 535 305" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                            <g id="head">
                                <line x1="530" y1="270" x2="535" y2="255" stroke="url(#skinGrad)" strokeWidth="16" strokeLinecap="round" />
                                <circle cx="540" cy="235" r="22" fill="url(#skinGrad)" />
                                <path d="M 560 235 L 565 240 L 558 245 Z" fill="url(#skinGrad)" />
                                <circle cx="550" cy="230" r="3" fill="#111" />
                                <path d="M 555 215 Q 568 220 565 235 Q 560 225 555 225 Z" fill="#FFD166" />
                                <path d="M 518 235 A 22 22 0 0 1 562 235 Z" fill="#EF476F" />
                                <path d="M 525 235 Q 500 235 490 225" fill="none" stroke="#EF476F" strokeWidth="6" strokeLinecap="round" />
                                <circle cx="540" cy="213" r="3" fill="#FFF" />
                            </g>
                        </g>

                        <g className="anim-front-thigh" style={{ transformOrigin: '500px 380px' }}>
                            <line x1="500" y1="380" x2="540" y2="440" stroke="#073B4C" strokeWidth="28" strokeLinecap="round" />
                            <g className="anim-front-calf" style={{ transformOrigin: '540px 440px' }}>
                                <line x1="540" y1="440" x2="530" y2="505" stroke="#073B4C" strokeWidth="24" strokeLinecap="round" />
                                <g>
                                    <path d="M 500 505 L 550 505 A 12 12 0 0 0 550 490 L 515 490 Z" fill="#FFF" />
                                    <path d="M 500 505 L 550 505" stroke="#EF476F" strokeWidth="4" strokeLinecap="round" />
                                    <circle cx="530" cy="497" r="4" fill="#06D6A0" />
                                    <path d="M 515 490 L 545 490" stroke="#073B4C" strokeWidth="8" strokeLinecap="round" />
                                </g>
                            </g>
                        </g>

                        <g className="anim-front-arm" style={{ transformOrigin: '530px 270px' }}>
                            <path d="M 530 270 L 510 330 L 525 370" fill="none" stroke="#25A5D1" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="518" y1="360" x2="532" y2="365" stroke="#0D5C75" strokeWidth="6" strokeLinecap="round" />
                            <circle cx="525" cy="370" r="9" fill="url(#skinGrad)" />
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    );
};