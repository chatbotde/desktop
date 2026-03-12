import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { SunSvg } from './assets/SunSvg';

/**
 * Sun component refactored.
 */
export const Sun: React.FC = () => {
    return (
        <LottiePlayer
            asset={<SunSvg />}
            containerStyle={{
                width: '350px',
                height: '350px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 50
            }}
            className="sun-clickable-part"
        />
    );
};
