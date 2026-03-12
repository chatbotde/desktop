import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { StartSvg } from './assets/StartSvg';

/**
 * Start component refactored.
 */
export const Start: React.FC = () => {
    return (
        <LottiePlayer
            asset={<StartSvg />}
            containerStyle={{
                width: '350px',
                height: '350px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 50
            }}
            className="start-clickable-part"
        />
    );
};
