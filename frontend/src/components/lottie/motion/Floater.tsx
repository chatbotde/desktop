import React from 'react';

interface FloaterProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    duration?: string;
}

export const Floater: React.FC<FloaterProps> = ({
    children,
    className = "",
    style,
    duration = "3s"
}) => {
    return (
        <div
            className={`floater-motion ${className}`}
            style={{
                ...style,
                animation: `floater-bob ${duration} ease-in-out infinite alternate, floater-drift ${Number(duration.replace('s', '')) * 1.5}s ease-in-out infinite alternate`
            }}
        >
            <style>
                {`
                @keyframes floater-bob {
                    from { transform: translateY(0); }
                    to { transform: translateY(-20px); }
                }
                @keyframes floater-drift {
                    from { transform: translateX(-10px) rotate(-1deg); }
                    to { transform: translateX(10px) rotate(1deg); }
                }
                `}
            </style>
            {children}
        </div>
    );
};
