import React from 'react';

/**
 * PaperPlane component renders a CSS/SVG animated paper airplane.
 * Modified to have no background and be click-through where transparent.
 */
export const PaperPlane: React.FC = () => {
    return (
        <div className="paperplane-wrapper" style={{
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
                .paperplane-svg {
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .paperplane-clickable-part {
                    pointer-events: auto;
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }

                .paperplane-clickable-part:hover {
                    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
                }
                `}
            </style>
            <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="paperplane-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    {/* The Flight Path Curve */}
                    <path id="flight-path"
                        d="M -200 500 
                         C 200 500, 300 650, 500 500 
                         C 800 300, 650 100, 500 250 
                         C 300 450, 350 600, 550 450 
                         C 800 250, 1000 250, 1400 250"
                        pathLength="100"
                        fill="none" />

                    {/* Mask for the Dashed Trail */}
                    <mask id="trail-mask">
                        <use href="#flight-path" stroke="white" strokeWidth="20" strokeDasharray="100" strokeDashoffset="100" fill="none">
                            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="6s" repeatCount="indefinite" />
                        </use>
                    </mask>
                </defs>

                {/* The Dynamic Dashed Trail */}
                <use href="#flight-path" stroke="rgba(255, 255, 255, 0.0)" strokeWidth="3" strokeDasharray="8 12" strokeLinecap="round" mask="url(#trail-mask)" />

                {/* The Paper Airplane Container */}
                <g id="plane-container" className="paperplane-clickable-part">
                    {/* Adding a subtle continuous bobbing and tilting effect */}
                    <g id="plane-bobbing">
                        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="1.5s" repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="rotate" values="0; -2; 0; 2; 0" dur="2s" repeatCount="indefinite" additive="sum" />

                        {/* Plane Geometry */}
                        <g transform="scale(0.6)">
                            {/* Top Right Wing (Brightest) */}
                            <polygon points="60,0 -60,-50 -40,0" fill="hsla(0, 0%, 100%, 0.99)" />
                            {/* Bottom Left Wing (Shaded) */}
                            <polygon points="60,0 -40,0 -60,50" fill="#e2e8f0" />
                            {/* Underbelly Fold (Darkest shadow) */}
                            <polygon points="60,0 -40,0 -25,20" fill="#cbd5e1" />
                        </g>
                    </g>

                    {/* Binds the plane to the curve, auto-rotating to face the tangent */}
                    <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                        <mpath href="#flight-path" />
                    </animateMotion>
                </g>
            </svg>
        </div>
    );
};