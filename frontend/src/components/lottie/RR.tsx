import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { RollsRoyceSvg } from './assets/RollsRoyceSvg';

/**
 * Rolls Royce component refactored.
 */
export const RollsRoyce: React.FC = () => {
    return (
        <LottiePlayer
            asset={<RollsRoyceSvg />}
            containerStyle={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
            className="rr-clickable-part"
        />
    );
};

