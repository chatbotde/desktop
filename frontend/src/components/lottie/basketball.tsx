import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { BasketballSvg } from './assets/BasketballSvg';
import { Bouncer } from './motion/Bouncer';

/**
 * Basketball component refactored to use the dynamic LottiePlayer system.
 */
export const Basketball: React.FC = () => {
    return (
        <LottiePlayer
            asset={<BasketballSvg className="w-full h-full" />}
            motion={Bouncer}
            containerStyle={{
                width: '256px',
                height: '384px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 50,
                paddingTop: '40px'
            }}
            className="basketball-clickable-part"
        />
    );
};

