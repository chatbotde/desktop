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
            className={`floater-motion-bob ${className}`}
            style={{
                ...style,
                animation: `floater-bob ${duration} ease-in-out infinite alternate`
            }}
        >
            <div
                className="floater-motion-drift w-full h-full flex items-center justify-center"
                style={{
                    animation: `floater-drift ${Number(duration.replace('s', '')) * 1.5}s ease-in-out infinite alternate`
                }}
            >
                <style>
                    {`
                    @keyframes floater-bob {
                        from { transform: translateY(0); }
                        to { transform: translateY(-30px); }
                    }
                    @keyframes floater-drift {
                        from { transform: translateX(-15px) rotate(-3deg); }
                        to { transform: translateX(15px) rotate(3deg); }
                    }
                    `}
                </style>
                {children}
            </div>
        </div>
    );
};
