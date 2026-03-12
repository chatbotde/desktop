import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { FighterPlaneSvg } from './assets/FighterPlaneSvg';

/**
 * FighterPlane component refactored.
 */
export const FighterPlane: React.FC = () => {
    return (
        <LottiePlayer
            asset={<FighterPlaneSvg />}
            containerStyle={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 50
            }}
            className="fighterplane-clickable-part"
        />
    );
};
