import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { PaperPlaneSvg } from './assets/PaperPlaneSvg';
import { PathFlyer } from './motion/PathFlyer';

/**
 * PaperPlane component refactored.
 */
export const PaperPlane: React.FC = () => {
    return (
        <LottiePlayer
            asset={<PaperPlaneSvg className="w-32 h-32 md:w-48 md:h-48 drop-shadow-xl" iconMode={true} />}
            motion={PathFlyer}
            containerStyle={{
                position: 'relative',
                zIndex: 50
            }}
            className="paperplane-clickable-part"
        />
    );
};

