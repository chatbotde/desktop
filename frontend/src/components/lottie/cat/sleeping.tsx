import React from "react";

interface SleepingCatProps {
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}

const SleepingCat: React.FC<SleepingCatProps> = ({
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
        <path d="m243.1 125.5c-2.34-13.46-9.25-24.63-20.79-38.58l0.79-2-3.34-2.22c-9.67-9.28-18.33-12.61-27.33-17.17-6.17-2.5-12.61-4.26-19.19-5.28-4.16-3.5-17.05-3.72-22.27-3.61-13.28 0.28-23.83 1.95-39.06 7.78l-1.55-0.17c-4.61 2.12-9.15 4.01-11.55 5.78-2.11-7.39-4.89-13.22-8.45-13.22-4.45 0-15.33 15.28-20.17 23.11l-1.83 1.83c-11.33 0.44-22.33 4.39-30.99 12.5-10.23-1.11-26.06-4.33-29.34-1.39-5.33 3.28 2.17 20.9 14.67 34.85l0.89 1.11-0.56 1.39 0.56 11.22-2.78 6.5 6.44 2.78 0.56 1.72 3.11 2.72c-0.89 3.11-0.89 11.5 4.28 17.33 5.16 4 13.55 5.39 20.55 5.67 4.95 0 10.28-1.44 12.17-2.67 1.39 3.72 5.34 7.28 11 7.28 5.94 0 10.5-1.11 13.89-3.45 2.61 3.45 8.44 6.12 14 8.39 8.11 2.28 15.78 3.06 32.89 3.06l0.27 1.28c9.5 1.11 38-2.72 52.62-7 5.72-1.61 12.33-4.28 15.11-5.73l1 1.12c10.89-4.39 20.33-12.78 24.5-18.34 8-10.83 12-24 9.9-36.59z" fill="#FEFFFB" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m237.9 115c6 13.78 1.89 33.78-10.83 48.17-4.84 5.56-14.28 12.89-15.12 12.34l2.5-3.45c-7.83 5.83-13.27 10.22-29.72 13.94-11.33 2.95-32.11 5.06-41.33 3.73l3.22-2.11c-15.11 1.11-25.5 0.77-37.39-3.23l3.89-0.55c-11.61-1.67-23-7.78-24-15.67l0.44-6.5c3.67 7.06 12.67 16.22 35 20.22 15.28 2.39 35.39 1.28 51.17-3.16 12.5-2.73 22.5-2.84 33.89-11.56 4.11-2.33 7.33-6.11 8.89-6.11l0.89-0.78c12.78-12.28 20.33-25.94 18.5-45.28z" fill="#9B8676" opacity=".2" />
        <path d="m134.7 115c3.39-10 7.5-15 15.39-19-5.83 5.56-9.5 10.56-10.61 16.67l-0.56 13.33c1.67 7.89 7.17 18.56 13.28 21.67 11 5.56 26 7.33 37.72 3.33 5.28-1.72 9.45-3.33 12.84-7l0.83 1.89c7-2.5 16.22-10.89 20.95-18.78-1.12 14.67-15.34 26.23-30.45 31.39-12.83 4.06-24 6.23-35.89 4.28-7.11-1.11-12.94-3.94-16-5.39l-5.11 0.56-2.78 0.28-4.89-1.11-11.22-5.84-0.84 1.11 5.84 1.11c5.39-1.39 8.89-2.77 9.72-15 0.45-7.44-2.55-19.66-4.83-25.11l6.61 1.61z" fill="#9B8676" opacity=".2" />
        <path d="m23.61 128 2.5-0.55-0.83-2.22 0.83-1.11 1.39-7.62 2-3.11-2.56-0.83 4.56-3.34-4.84-1.72c1.84-2.28 5.56-2.5 9.45-2.5-3-3.67-16.39-9.23-24.78-10.34l-2.5 0.56-0.56 1.67c0.28 8.66 8.67 23.94 15.34 31.11z" fill="#9B8676" opacity=".2" />
        <path d="m24.16 146.8 3.11-3.67 0.56-8.94-0.89-7.06 2.28 0.56 0.55 11.94v7.06l6.5 0.83-2.77 2.28 3.66 2.45 12.78 4.89 9.22 3.11 7.56 1.11 5.55 0.83-5.16 2-6.28-0.56-10.56-1.44-12.55-5.17-6.22-3.11-0.28-2.89-7.06-2.49v-1.73z" fill="#9B8676" opacity=".2" />
        <path d="m170.7 59.41c-15-2.39-39.11-2.39-57.5 4.78" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m171.8 60.24c14.45 2.17 32.11 9.17 44.67 19.17" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m217.3 85.8c9.17 5.83 17 19 21.84 30.89" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m100.2 93.68c4.72 5 8.11 11.5 16 12.89l-2 6.78 3.72 0.28c-2.83 13.17-9.11 26-19.67 36-6.77 6.12-11.05 10.67-22.05 12.34-10.39 1.66-20.28 0.11-28.11-2.67-5.56-1.89-11.67-4.39-15.95-7.17l1.11-3.44-11.88-1.11 2.77-6.17-0.83-13.95c-9.17-8.66-18.61-27.44-15.94-34.05 2.5-4.28 18.83-0.84 31.94 1.66l-2.5-0.55c8.11-7.06 18.33-11.95 31.72-12.5l0.83-0.56c4.84-8.66 15.39-23.44 20.45-24.28 5.11-0.38 10 15.95 10.39 36.5z" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m170.1 91.41c-9.5-0.56-25.5 8.61-29.72 20.5l2.83-2.22c-8.61 13.22-7.5 35 4.11 44.72 3.17 2.78 8.78 3.28 8.78 3.28-7.28 1.11-13.28-0.55-17.17-2.16l-2.83 1.61 1.39-10-2 3.66c0.83-9.78-2-20.61-6.17-31.78" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m118.3 138.5c-7.22 1.39-14 4.84-18.22 10" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m127.3 119c-9.22 1.67-21.11 7.23-30.61 14.56" stroke="#9B8676" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
        <path d="m126.8 131.3c-6.45 0-15.56 1.72-25.56 4.5" stroke="#9B8676" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
        <path d="m90.39 177.9c-3.73 3.17-7.67 3.45-11.89 3.45-6.39 0-10.28-4.56-10.28-7.06-0.56-7.05 7-12.22 8.94-12.78" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m67.94 172.4c0.28-4.22 1.39-6 2.78-7.11" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m72.11 177.6c-0.84-2.84 0-6.56 2.5-8.56" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m81.55 179.9c-1.11-3.11-0.55-5.78 1.11-7.11" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m67.66 174c-2.55 3-9.33 4.17-13.05 3.89-7.06-0.55-15.67-2.22-19.39-6.61-4.11-4.61-4.39-10.44-3.11-15.16" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m56.61 175.9c1.11-1.66 1.11-3.89-0.56-5.61" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m224.3 127.7c-2.72 17.17-20.95 28.45-37.78 32.61-15.06 4.11-26.39 4.39-38.28 1.56-3.61-0.95-4.11 0.22-2.11 1.77-8.61 0-19.5-7.05-28.95-10.11-9.5-3.61-20.94-1.94-27.05 8.06-2.17 4.83-1.34 13.22 2.94 17.78" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="m37.83 106.1c-5.17-5.56-20-11.67-27.33-11.67-4.28 0 0.27 11.67 3.66 17.78 3.95 7.06 7.56 11.17 10.56 13.34l1.67-1.78 1.44-8.67 2.78-3.11-3.34-0.56 4.5-3.94-5.16-0.28c2.22-2.44 5.89-2.44 11.22-1.11z" fill="url(#sc_grad0)" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m93.22 59.91c-3.95-3.73-13.45 14.5-14.56 28.16l8.61-4.83-2.78 4.83 5.12-0.83-2.28 1.67c5.39 0.55 9.05 3.66 11.83 5.33-0.28-11.17-3.44-30.22-5.94-34.33z" fill="url(#sc_grad1)" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m47.33 138.5c6.39 3.34 13.44 1.67 17.11-2.89 1.39-1.94 1.11 0.28 0 1.95-3.94 4.61-12.06 5.72-17.22 2.61-1.11-0.83-1.39-2.28 0.11-1.67z" fill="#452215" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m97.61 117.4c-1.39 6.39-6 10.06-13.06 9.78-1.44 0-0.33 0.83 0.5 1.11 6.67 1.11 12.22-3.5 13.33-9.94 0.23-1.67-0.5-2.34-0.77-0.95z" fill="#452215" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m74.94 142.7c0.28-1.39 5.67-3.39 7.61-4.5 1.39-0.56 1.95 0.83 1.39 1.94l-1.67 5.12c-0.28 0.83-2.55 0.27-4.5-0.28-1.72-0.56-3.11-1.17-2.83-2.28z" fill="url(#sc_grad2)" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
        <path d="m73.83 153.2c3.67 1.11 7.05-0.56 8.72-6 2.5 2.5 6.17 2.77 7.83 0.27" stroke="#452215" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
        <path d="m61.94 149c-8.61 1.11-20.78 9.23-29.39 18.39" stroke="#9B8676" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
        <path d="m62.5 153.2c-7.89 4.16-14.28 9.61-21.34 17.94" stroke="#9B8676" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
        <defs>
            <linearGradient id="sc_grad0" x1="24.04" x2="24.04" y1="94.46" y2="125.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F0A5A6" offset="0" />
                <stop stopColor="#DB6C6E" offset="1" />
            </linearGradient>
            <linearGradient id="sc_grad1" x1="88.83" x2="88.83" y1="59.02" y2="94.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F0A5A6" offset="0" />
                <stop stopColor="#DB6C6E" offset="1" />
            </linearGradient>
            <linearGradient id="sc_grad2" x1="79.54" x2="79.54" y1="138" y2="145.9" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F0A5A6" offset="0" />
                <stop stopColor="#DB6C6E" offset="1" />
            </linearGradient>
        </defs>
    </svg>
);

export default SleepingCat;