import React from 'react';
import type { SvgProps } from './BasketballSvg';

export const PaperPlaneSvg: React.FC<SvgProps> = ({ width = "100%", height = "100%", ...props }) => {
    return (
        <svg viewBox="0 0 1200 800" width={width} height={height} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Plane Geometry */}
            <g transform="scale(0.6)">
                {/* Top Right Wing (Brightest) */}
                <polygon points="60,0 -60,-50 -40,0" fill="hsla(0, 0%, 100%, 0.99)" />
                {/* Bottom Left Wing (Shaded) */}
                <polygon points="60,0 -40,0 -60,50" fill="#e2e8f0" />
                {/* Underbelly Fold (Darkest shadow) */}
                <polygon points="60,0 -40,0 -25,20" fill="#cbd5e1" />
            </g>
        </svg>
    );
};
