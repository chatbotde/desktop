import React from "react";

interface TrimPlaneProps {
    width?: number | string;
    height?: number | string;
    className?: string;
    style?: React.CSSProperties;
}

const TrimPlane: React.FC<TrimPlaneProps> = ({
    width = 250,
    height = 250,
    className,
    style,
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        fill="none"
        viewBox="0 0 250 250"
        className={className}
        style={style}
    >
    <path d="m11.48 87.41 6.21 0.19c2.69-0.03 5.22 0.59 6.78 2.39l26.02 27.44c3.89 4.18 8.22 5.91 13.72 6.33l-1.45 0.95-37.6 3.71-13.68-41.01z" fill="#0E304D" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m12.93 87.61 5.03 0.42c2.3-0.1 4.05 0.66 5.81 2.54l24.84 26.96c4.11 4.51 8.34 6.44 14.15 7.09l-37.05 3.26-12.78-40.27z" fill="#29B5E1" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m16.95 88.46 18.34 35.6-1.23 2.86 2.78-1.33-1.08-2.43-17.15-34.25-1.66-0.45z" fill="#0082B1" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m62.76 123.8 7.45 0.13 132 0.17c14.63 0 27.57 2.66 35.77 9.4 5.22 4.38 9.24 6.35 9.24 10.45 0 3.5-7.3 6.25-20.22 7.83l-0.1 2.32-6.49 0.85-0.03-2.43-46.83 0.14-0.13 3.75c-0.05 1.51-6.37 1.61-9.52 1.51-6.09-0.2-12.92-1.72-13.45-2.26l-0.54-1.86-6.83-0.41-7.03-0.94-9.22-0.2-42.69-0.68c-13.32 0-36.36-5.14-45.85-7.9l-26.01-7.77 0.34-3.15 2.49-0.88-10.65-3.89 6.87-0.34 8.88 1.29 42.54-5.13z" fill="#FEFFFE" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m246.4 144.9c-1.52 2.78-8.4 5.27-19.39 6.6l-0.27 2.32-6.19 0.88-0.11-2.23-46.86 0.14v-0.21l-0.14 3.21c-0.07 1.66-7.17 1.93-9.51 1.86-6.09-0.2-12.59-1.65-13.27-2.33l-0.61-1.8-6.94-0.2-6.76-1.01-9.42-0.07-42.76-0.61c-12.91 0-34.13-5-45.85-8.04l-18.18-6.05-0.2-4.46 10.99 1.15 11.33 0.68c2.39 0.2 3.74-1.73 1.88-2.03l-2.29-0.55 3.04 0.35c17.76 2.6 29.09 6.42 50.85 6.42l24.5-0.27 18.99 1.09 24.7-0.82 35.05-0.41c12 0 29.13 3.22 40.87 4.19 4.08 0.34 7.4 0.65 6.55 2.2z" fill="url(#paint0_linear_101_1728)" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m240.5 137.1 0.61 9.61" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m232.4 132.8h1.79c0.95 0 1.83 1.09 2.71 2.82l0.41 0.68h-5.11c-1.29 0-1.7-0.41-1.43-1.63 0.28-1.22 0.75-1.87 1.63-1.87z" fill="#6D7888" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m73.42 115.1 3.65 0.27c1.05 0.07 1.66 1.02 2.88 2.3 2.76 3.05 6.82 6.26 9.97 7.48l1.32 0.95-9.01-0.95-8.81-10.05z" fill="#29B5E1" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m89.92 125.2 68.31 14.76-6.02 1.08-22.5-0.27-11.8-2.75-12.2-2.22-9.58-5.58-6.21-4.07v-0.95z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m96.12 130.2 6.6 2.77c2.09 0.88 3.54 1.49 4.99 2.1 1.32 0.58 1.93 1.26 0.68 1.32l-11.18-0.13-1.09-6.06z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m108.3 136.3 5.49 0.13 8.2 1.44c0.95 0.17 1.22 0.95 0.14 1.02l-9.09 0.88-4.74-3.47z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m118.5 141.2 27.56 3.89 6.19-4.02-5.72-0.41-26.27-1.96-1.76 2.5z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m120.1 143.9 12.27 0.48 3.4 3.21-5.49 8.41-4.34-1.12 1.12-2.7-5.03-5.14-1.93-3.14z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m142.8 150.7 6.97 1.02v-6.89l-6.97 3.51v2.36z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m150.5 143.7c4.74-1.32 9.64-2.2 15.69-1.72l6.06 0.7c1.02 0.14 1.56 0.55 1.56 2v10.98c0 1.66-5.42 1.79-9.46 1.66-5.75-0.21-13.06-1.73-13.85-2.47v-9.83c0-0.71-0.41-1.12 0-1.32z" fill="#FEFFFE" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m162.2 141.7v15.61" stroke="#979A9C" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m173.6 152.6-0.13 3.14c-0.07 1.45-6.7 1.65-9.12 1.59-5.72-0.21-12.55-1.66-13.6-2.34l-0.27-2.39h23.12z" fill="#979A9C" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m126.9 156.5c-2.43 0-3.04 1.66-3.04 2.88 0 1.45 1.19 3.38 3.04 3.38 2.06 0 3.15-1.79 3.15-3.24 0-1.59-1.22-3.02-3.15-3.02z" fill="#0E304D" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m127.4 158.4c-1.12 0-1.46 0.61-1.46 1.22 0 0.68 0.61 1.49 1.46 1.49 0.95 0 1.46-0.81 1.46-1.49s-0.61-1.22-1.46-1.22z" fill="#6D7888" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m133.6 156.8c-2.43 0-3.04 1.66-3.04 2.88 0 1.45 1.19 3.04 3.04 3.04 2.06 0 3.15-1.66 3.15-2.97 0-1.56-1.22-2.95-3.15-2.95z" fill="#0E304D" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m133.6 158.4c-1.12 0-1.46 0.61-1.46 1.22 0 0.68 0.61 1.49 1.46 1.49 0.95 0 1.46-0.81 1.46-1.49s-0.61-1.22-1.46-1.22z" fill="#6D7888" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m221.9 157.4c-2 0-2.54 1.45-2.54 2.51 0 1.25 0.95 2.77 2.54 2.77 1.76 0 2.64-1.46 2.64-2.57 0-1.39-1.06-2.71-2.64-2.71z" fill="#0E304D" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m221.9 158.7c-0.98 0-1.29 0.61-1.29 1.16 0 0.67 0.61 1.38 1.29 1.38 0.85 0 1.32-0.78 1.32-1.38 0-0.68-0.61-1.16-1.32-1.16z" fill="#6D7888" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".3" />
    <path d="m220.9 154 6.19-0.74 0.13-1.86-6.32 0.38v2.22z" fill="#005492" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m5.42 127.9 8.82 0.21 30.7 5.47c1.45 0.31 0.67 1.83-1.75 1.7l-11.47-0.85c-5.56-0.41-10.67-1.83-15.58-3.99l-10.72-2.54z" fill="#6D7888" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".7" />
    <path d="m12.76 133 6.36 1.12v2.07l-6.76-1.19 0.4-2z" fill="#005492" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m105.4 149.6c0.95-3.92 4.67-6.95 9.51-6.95h3.95l2.19 5.89-15.65 1.06z" fill="#0082B1" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m64.76 129.4h-4.34c-0.68 0-0.81 0.34-0.81 0.98v8.39c0 0.54 0.13 0.95 0.81 0.95h4.34c0.68 0 0.75-0.41 0.75-0.95v-8.39c0-0.64-0.14-0.98-0.75-0.98z" fill="#FEFFFE" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m185.2 129.4h-3.43c-0.68 0-0.81 0.34-0.81 0.98v8.39c0 0.54 0.13 0.95 0.81 0.95h3.43c0.68 0 0.75-0.41 0.75-0.95v-8.39c0-0.64-0.14-0.98-0.75-0.98z" fill="#FEFFFE" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m219.8 129.4h-4.06c-0.61 0-0.81 0.34-0.81 0.98v8.39c0 0.54 0.2 0.95 0.81 0.95h4.06c0.68 0 0.81-0.41 0.81-0.95v-8.39c0-0.64-0.2-0.98-0.81-0.98z" fill="#FEFFFE" stroke="#0E304D" strokeMiterlimit="10" strokeWidth=".5" />
    <path d="m68.94 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m72.37 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m75.8 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m79.23 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m84.35 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m87.78 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m91.21 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m94.64 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m97.54 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m130 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m133.4 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m136.8 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m140.3 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m143.7 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m147.1 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m150.6 133.2v1.15" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m154.6 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m158.1 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m161.5 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m164.9 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m168.4 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m171.8 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m175.2 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m190.6 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m193.5 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m196.3 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m199.2 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m202.1 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m204.9 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <path d="m207.8 133.2v1.66" stroke="#0E304D" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" />
    <defs>
        <linearGradient id="paint0_linear_101_1728" x1="125.8" x2="125.8" y1="131.1" y2="157.6" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1761A0" offset="0" />
            <stop stopColor="#283661" offset="1" />
        </linearGradient>
    </defs>
    </svg>
);

export default TrimPlane;
