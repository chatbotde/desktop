import React from 'react';

interface PathFlyerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    duration?: string;
}

export const PathFlyer: React.FC<PathFlyerProps> = ({
    children,
    className = "",
    style,
    duration = "14s"
}) => {
    // We use CSS offset-path to define a flight path across the screen.
    // The offset-rotate property ensures the element visually "follows" the curve.
    return (
        <div
            className={`path-flyer-motion ${className}`}
            style={{
                ...style,
                // A beautiful seamless figure-eight (infinity loop) centered on screen
                offsetPath: 'path("M 0 0 C 450 -450, 900 0, 0 0 C -900 0, -450 450, 0 0")',
                // 'auto' makes it point along the path. 35deg precisely aligns the plane's nose.
                offsetRotate: 'auto 35deg',
                animation: `fly-along-path ${duration} linear infinite`
            } as any}
        >
            <style>
                {`
                @keyframes fly-along-path {
                    0% { offset-distance: 0%; }
                    100% { offset-distance: 100%; }
                }
                `}
            </style>
            {children}
        </div>
    );
};
