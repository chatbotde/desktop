import React, { type ReactElement } from 'react';
import SnapEffectContainer from '@/shared/components/common/SnapEffectContainer';

interface LottiePlayerProps {
    /** The SVG asset to render */
    asset: ReactElement;
    /** Optional motion wrapper */
    motion?: React.FC<{ children: React.ReactNode }>;
    /** Optional layout wrapper style */
    containerStyle?: React.CSSProperties;
    /** Props for SnapEffectContainer */
    snapProps?: {
        particleDensity?: number;
        triggerOnDoubleClick?: boolean;
    };
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    className?: string;
}

/**
 * LottiePlayer unified component.
 * Separates Asset (SVG) from Motion (Logic/Animation).
 */
export const LottiePlayer: React.FC<LottiePlayerProps> = ({
    asset,
    motion: MotionWrapper,
    containerStyle,
    snapProps,
    onClick,
    className = ""
}) => {
    const content = MotionWrapper ? (
        <MotionWrapper>{asset}</MotionWrapper>
    ) : (
        asset
    );

    return (
        <SnapEffectContainer {...snapProps}>
            <div
                className={`lottie-player-inner ${className}`}
                onClick={onClick}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'auto',
                    cursor: onClick ? 'pointer' : 'default',
                    ...containerStyle
                }}
            >
                {content}
            </div>
        </SnapEffectContainer>
    );
};
