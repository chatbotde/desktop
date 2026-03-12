import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { SkateboardSvg } from './assets/SkateboardSvg';

/**
 * Skateboard component refactored.
 */
export const Skateboard: React.FC = () => {
    return (
        <LottiePlayer
            asset={<SkateboardSvg />}
            containerStyle={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
            className="skater-clicakble-part"
        />
    );
};
