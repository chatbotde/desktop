import React from 'react';

export interface PaperPlaneSvgProps extends React.SVGProps<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
    iconMode?: boolean;
}

export const PaperPlaneSvg: React.FC<PaperPlaneSvgProps> = ({ width = "100%", height = "100%", iconMode, ...props }) => {
    return (
        <svg 
            viewBox={iconMode ? "-100 -100 200 200" : "0 0 1200 800"} 
            width={width} 
            height={height} 
            preserveAspectRatio={iconMode ? "xMidYMid meet" : "xMidYMid slice"} 
            xmlns="http://www.w3.org/2000/svg" 
            {...props}
        >
            {/* Plane Geometry */}
            <g transform={iconMode ? "scale(1) rotate(-30)" : "scale(0.6)"}>
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
