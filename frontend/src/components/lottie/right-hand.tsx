import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { RightHandSvg } from './assets/RightHandSvg';

export const RightHand: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
    return (
        <LottiePlayer
            asset={<RightHandSvg {...props} />}
        />
    );
};

export default RightHand;
