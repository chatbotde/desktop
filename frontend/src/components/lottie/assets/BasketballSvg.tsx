import React from 'react';

export interface SvgProps extends React.SVGProps<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
}

export const BasketballSvg: React.FC<SvgProps> = ({ width = "100%", height = "100%", ...props }) => {
    return (
        <svg viewBox="0 0 256 256" width={width} height={height} xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <radialGradient id="ballGradient" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#ffb37b" />
                    <stop offset="20%" stopColor="#f57c23" />
                    <stop offset="70%" stopColor="#cc4a00" />
                    <stop offset="100%" stopColor="#802000" />
                </radialGradient>

                <pattern id="dotTexture" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(15)">
                    <circle cx="3" cy="3" r="1.1" fill="#000000" fillOpacity="0.18" />
                    <circle cx="2.5" cy="2.5" r="0.8" fill="#ffffff" fillOpacity="0.1" />
                </pattern>

                <clipPath id="ballClip">
                    <circle cx="128" cy="128" r="120" />
                </clipPath>
            </defs>

            <circle cx="128" cy="128" r="120" fill="url(#ballGradient)" />
            <circle cx="128" cy="128" r="120" fill="url(#dotTexture)" />

            <g clipPath="url(#ballClip)">
                <g transform="rotate(-22 128 128)">
                    <line x1="128" y1="-20" x2="128" y2="276" stroke="#24140f" strokeWidth="7" />
                    <line x1="-20" y1="128" x2="276" y2="128" stroke="#24140f" strokeWidth="7" />
                    <ellipse cx="20" cy="128" rx="75" ry="145" fill="none" stroke="#24140f" strokeWidth="7" />
                    <ellipse cx="236" cy="128" rx="75" ry="145" fill="none" stroke="#24140f" strokeWidth="7" />
                </g>
            </g>

            <circle cx="128" cy="128" r="120" fill="none" stroke="#24140f" strokeWidth="8" />
            <circle cx="128" cy="128" r="116" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.15" />
        </svg>
    );
};
