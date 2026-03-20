import React from 'react';

export interface FighterPlaneSvgProps extends React.SVGProps<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
    iconMode?: boolean;
}

export const FighterPlaneSvg: React.FC<FighterPlaneSvgProps> = ({ iconMode, ...props }) => {
    const SvgContent = (
        <svg 
            viewBox={iconMode ? "-150 -150 300 300" : "0 0 1200 800"} 
            preserveAspectRatio={iconMode ? "xMidYMid meet" : "xMidYMid slice"} 
            className={iconMode ? "" : "fighterplane-svg"} 
            xmlns="http://www.w3.org/2000/svg" 
            {...props}
        >
            <defs>
                <filter id="plane-shadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="-10" dy="15" stdDeviation="6" floodColor="#020617" floodOpacity="0.6" />
                </filter>
            </defs>

            <g id="plane-container" transform={iconMode ? "scale(1.5) rotate(-45)" : ""}>
                <g id="fighter-plane-bobbing">
                    {!iconMode && (
                        <>
                            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="1.5s" repeatCount="indefinite" />
                            <animateTransform attributeName="transform" type="rotate" values="0; -2; 0; 2; 0" dur="2s" repeatCount="indefinite" additive="sum" />
                        </>
                    )}

                    <g transform="scale(1.8)" filter="url(#plane-shadow)">
                        <g transform="translate(-50, 0)">
                            <polygon points="0,-6 -30,0 0,6" fill="#ea580c">
                                <animateTransform attributeName="transform" type="scale" values="1 1; 1.3 1; 1 1" dur="0.1s" repeatCount="indefinite" />
                            </polygon>
                            <polygon points="0,-3 -15,0 0,3" fill="#fef08a">
                                <animateTransform attributeName="transform" type="scale" values="1 1; 1.4 1; 1 1" dur="0.05s" repeatCount="indefinite" />
                            </polygon>
                        </g>

                        <polygon points="10,0 -30,-50 -45,-50 -20,0 -45,50 -30,50" fill="#475569" />
                        <polygon points="10,0 -30,-50 -35,-50 -20,0" fill="#64748b" />
                        <polygon points="10,0 -30,50 -35,50 -20,0" fill="#94a3b8" />

                        <polygon points="-35,0 -45,-25 -52,-25 -42,0 -52,25 -45,25" fill="#334155" />

                        <path d="M 60,0 C 40,-10 -30,-10 -50,-6 L -50,6 C -30,10 40,10 60,0 Z" fill="#475569" />
                        <path d="M 60,0 C 40,-10 -30,-10 -50,-6 L -50,0 Z" fill="#64748b" />

                        <polygon points="-50,-1 -35,-1 -30,1 -50,1" fill="#1e293b" />

                        <ellipse cx="15" cy="0" rx="16" ry="5" fill="#0284c7" />
                        <ellipse cx="18" cy="-1.5" rx="8" ry="2" fill="#7dd3fc" opacity="0.8" />

                        <path d="M 60,0 C 50,-3 45,-3 40,0 C 45,3 50,3 60,0 Z" fill="#1e293b" />
                    </g>
                </g>

                {!iconMode && (
                    <animateMotion dur="14s" repeatCount="indefinite" rotate="auto"
                        path="M -200 400 C 100 100, 300 900, 600 500 S 1100 100, 1400 400 C 1100 800, 600 100, 400 600 S -100 700, -200 400 Z" />
                )}
            </g>
        </svg>
    );

    if (iconMode) {
        return SvgContent;
    }

    return (
        <div className="fighterplane-asset-wrapper" style={{ width: '100%', height: '100%' }}>
            <style>
                {`
                .fighterplane-svg {
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                `}
            </style>
            {SvgContent}
        </div>
    );
};
