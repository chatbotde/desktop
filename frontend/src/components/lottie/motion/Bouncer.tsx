import React from 'react';

interface BouncerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    duration?: string;
}

export const Bouncer: React.FC<BouncerProps> = ({
    children,
    className = "",
    style,
    duration = "1.2s"
}) => {
    return (
        <div
            className={`bouncer-motion ${className}`}
            style={{
                ...style,
                animation: `bouncer-jump ${duration} infinite cubic-bezier(0.45, 0, 0.55, 1)`
            }}
        >
            <style>
                {`
                @keyframes bouncer-jump {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(120px) rotate(15deg);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }
                `}
            </style>
            {children}
        </div>
    );
};
