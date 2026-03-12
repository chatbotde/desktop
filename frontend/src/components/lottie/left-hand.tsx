import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { LeftHandSvg } from './assets/LeftHandSvg';

export const LeftHand: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
    return (
        <LottiePlayer
            asset={<LeftHandSvg {...props} />}
        />
    );
};

export default LeftHand;
