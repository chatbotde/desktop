import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { PaperPlaneSvg } from './assets/PaperPlaneSvg';
import { Floater } from './motion/Floater';

/**
 * PaperPlane component refactored.
 */
export const PaperPlane: React.FC = () => {
    return (
        <LottiePlayer
            asset={<PaperPlaneSvg className="w-full h-full" />}
            motion={Floater}
            containerStyle={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 50
            }}
            className="paperplane-clickable-part"
        />
    );
};

