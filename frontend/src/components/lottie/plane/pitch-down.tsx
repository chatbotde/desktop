import React from "react";

interface PitchDownPlaneProps {
    width?: number | string;
    height?: number | string;
    className?: string;
    style?: React.CSSProperties;
}

const PitchDownPlane: React.FC<PitchDownPlaneProps> = ({
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
    <path d="m184.6 50.77-2.47 1.04-20.05 33.41-11.88-8.73-1.95 0.22-4.07 2.61-0.37 1.45 7.29 16.81c-16.64 5.51-37.49 14.85-58.19 25.37l-15.14-8.77-33.05-37.47 1.99-16.3-3.35 1.4-9.55 18.96 14.94 44.96-18.65 9.68c-7.09 3.56-7 12.61-0.39 19.32-8.86 8.05-16.44 20.39-22.71 34.03-2.73 5.92-0.23 9.4 6.75 9.76 14.32 0.75 27.22-4.24 37.09-9.57l23.83-12.88c8.43 0 12.83-1.96 24.48-6.85l23.77-0.78-17 10.25c-8.44 4.32-7.18 15.69 0 21.32 3.96 3.2 7.98 2 12.29-0.32 6.66-3.41 15.67-11.51 16.43-15.37l5.62-8.69-2.99-1.12 6.54-6.29 80.16-1.27 4-1.17 9.73-5.99 9.96-17.12-5.06 3.17-10.6 12.94-59.8-6.71-21.8-3.16-13.22-3.75 4.85-6.19c12.14-7.74 22.71-17.36 34.65-29.88l39.49-1.03 8.44-4.22-0.34-0.53-36.32-5.51-1.18-0.49 1.64-2.19c1.24-2.71 0.49-5.26-1.3-5.21l-5.06 0.4 9.43-43.31-6.88 3.77z" fill="#0B4851" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m144.8 79.9 3.93-2.64 12.58 9.45-3.1 5.53-6.13 3.82-7.28-16.16z" fill="url(#paint0_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m183 51.81 7.79-3.21-11.77 42.31-5.8 5.21-22.2 2.96-4.57 4.58 9.54-8.63 27.01-43.22z" fill="#2BB2A7" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m186 50.8 1.64-0.31-16.39 45.45-8.2 3.02 22.95-48.16z" fill="#00666A" />
    <path d="m34.82 80.63 8.9-18.32 1.96-0.68-1.96 15.19 32.97 37.92 12.22 10.47-1.99 2.51-27.06 12.04-25.04-59.13z" fill="url(#paint1_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m37.78 81.22 6.39-1.78 25.67 36.7 16.32 10.92-25.34 11.65-23.04-57.49z" fill="url(#paint2_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m49.86 126.7-15.75 8.95 5.08 13.42 14.23-7.79-3.56-14.58z" fill="url(#paint3_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m35.62 134.9c-6.81-0.93-11.71 4.89-9.55 12.15 1.55 5.58 6.26 8.8 8.99 8.25l5.7-4.5c2.05-2.89 0.15-12.76-5.14-15.9z" fill="url(#paint4_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m32.17 138.1c-3.43 0.47-4.56 4.75-3.26 8.67 1.2 3.7 4.27 6.5 7 5.4 2.87-1.13 3.34-5.4 1.87-8.95-1.21-3.15-3.29-5.45-5.61-5.12z" fill="url(#paint5_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m38.22 134.8 11.56-5.4 1.45 3.99-10.12 3.07c-1.46 0.54-3.33-0.2-2.89-1.66z" fill="#0B4851" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m186.9 98.11 35.92 5.93-7.1 3.47-41.5 0.65 5.62-6.9 7.06-3.15z" fill="url(#paint6_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m179.5 101.7 7.23-1.32 4.4 3.41-14.94 1.67 3.31-3.76z" fill="#999" />
    <path d="m187.5 90.21c1.64-0.15 1.78 4.5 0.2 5.85-5.3 4.55-14.53 7.1-23.7 19.05-5.1 6.5-16.8 17.75-27.82 22.01-15.13 6.25-34.67 12.9-47.57 23.97-4.51 3.87-6.65 5.86-13.94 13.96 1.58-0.36 9.73-0.16 15.43-3.18 7.08-3.71 10-4.01 15.1-4.16l117.9-2.55 4.5-1.45 4.42-4.93-60.79-6.71-35.31-6.76 5.7-7c10.45-6.6 23.51-18.15 35.3-30.15 1.55-1.69 6.35-5.07 11.05-8.15 1.45-0.98 1.79-9.7-0.45-9.8z" fill="url(#paint7_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m111.9 118.9c3.2 0.49 0.38 8.01-2.15 10.01-10.15 7.81-33.68 23-46.73 34.06-10.06 8.74-16.85 16.97-44.7 31.75-5.11 2.7-12.17 2.4-12.17-2.1 0-4.81 9.6-20.36 16.03-28.21 9.73-12.1 16.97-16.48 33.73-24.95l47.87-20.96c2.42-0.84 4.27-0.25 8.12 0.4z" fill="#FEFFFE" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m10.31 182.1c5.68-0.4 9.77 5 8.4 14.81l-1.58 0.2c-6.38 0-11.12-1.5-11.12-5.11 0-2.6 2.11-6.95 4.3-9.9z" fill="url(#paint8_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m16.79 172.6 2.14 2.25 7.79-0.15-1.46 4.5-7.43 0.5-2.32-5.1 1.28-2z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m27.81 174.7 5.41-0.4-1.15 4.4-5.49 0.3 1.23-4.3z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m33.61 174.4 1.71-0.6c1.5-0.4 2.09 0.8 2.74 2.2 0.9 1.95 0.4 2.65-0.94 2.8l-4.11 0.4 0.6-4.8z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m128 168.7-14.28 7.95 1.69 0.3 10.71-3.5 5.49 0.2 5.68 2.1-4.9-5.3-4.39-1.75z" fill="#666" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m108 180c-7.23 1.35-7.87 11.61-1.87 17.41 4.95 4.89 8.95 3.59 11.57 2.09 6.38-3.44 15.98-11.7 16.93-14.7 1.1-3.55-1.54-10.6-4.46-11.1-2.53-0.5-12.74 4.5-22.17 6.3z" fill="url(#paint9_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m106.9 181.2c-5.25 1-5.54 9.41-0.54 14.51 4.12 4.19 8.32 3.49 9.88 1.3 2.82-3.9 0.92-11.01-3.19-14.31-2.37-1.95-4.27-1.85-6.15-1.5z" fill="url(#paint10_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m106.2 184.9c-2.32 1.15-1.57 6.51 1.62 9.71 2.58 2.6 5.25 2.6 6.16 1.2 1.82-2.8 0.12-8.71-3.13-10.81-1.8-1.15-3.25-0.85-4.65-0.1z" fill="url(#paint11_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m113.4 177.1c3.66 0.7 10.39-2.4 13.8-1.8 3.2 0.6 5.93 7.4 4.53 12.7" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m239.2 147.9 7.15-4.61-9.6 15.76-9.5 5.83 11.95-16.98z" fill="#0B4851" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m91.63 164.7 35.96-19.74 27.56 6.2 73.76 7.71-5.19 5.88-136 4.5c-1.34-2.2 0.95-3.7 3.87-4.55z" fill="url(#paint12_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m94.16 163.2 28.32-14.59 32.97 4 66.66 8.41v1.75l-120.9 1.83-7.01-1.4z" fill="url(#paint13_linear_155_142)" />
    <path d="m123.1 148.1 14.84 0.5 7.01 3.45" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m154.4 151.8-4.04 2.5" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m193.6 156.5 1.99-0.9" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m53.01 93.78 4.7 0.5" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m70.89 116.1 5.8-1.45" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m80.43 119.8 6.39-1.6" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m139.2 107.1-30.41 11.44" stroke="#FEFFFE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    <path d="m159.1 109.2 2.53 0.4 1.38 10.44-4.26 2-1.34-10.7 1.69-2.14z" fill="#2BB2A7" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m51.05 164.2-4.33 1.9c-0.5 0.25-0.5 0.95-0.3 1.7 1.55 5.2 2.3 8.3 2.3 12.5 0 0.6 0.44 0.9 1.09 0.6l4.6-2.5c0.7-0.35 1-1 0.9-2.1-0.4-4.25-1.4-8.4-2.79-11.3-0.3-0.75-0.8-1.1-1.47-0.8z" fill="url(#paint14_linear_155_142)" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".7" />
    <path d="m60.41 167.5 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.7-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m63.92 166.2 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.7-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m67.72 164.6 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m71.52 162.6 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m75.33 160.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m79.13 158.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m82.93 156.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m86.74 154.9 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m90.54 152.9 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m94.35 150.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m98.15 148.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m102.3 146.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m106.4 144.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m110.2 142.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m114.6 140.5 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m118.7 138.6 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m122.5 136.6 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m126.3 134.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.6-0.1-0.9-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m130.4 132.7 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m134.5 130.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m138.3 128.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m142.1 126.9 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m145.9 125.2 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <path d="m150.6 120.8 0.2-1.2c0.1-0.5 0.45-0.9 0.9-1 0.65-0.15 1.1 0.3 1 1.05l-0.15 1.45c-0.1 0.65-0.6 1.15-1.2 1.1-0.65-0.1-0.95-0.75-0.75-1.4z" fill="#063F49" stroke="#063F49" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".5" />
    <defs>
        <linearGradient id="paint0_linear_155_142" x1="152.9" x2="152.9" y1="76.71" y2="96.45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ccc" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint1_linear_155_142" x1="60.82" x2="60.82" y1="61.63" y2="139.8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00666A" offset="0" />
            <stop stopColor="#2BB2A7" offset=".5208" />
            <stop stopColor="#0B4851" offset="1" />
        </linearGradient>
        <linearGradient id="paint2_linear_155_142" x1="62.01" x2="62.01" y1="79.44" y2="138.7" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint3_linear_155_142" x1="43.77" x2="43.77" y1="126.7" y2="149.1" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint4_linear_155_142" x1="33.41" x2="33.41" y1="134.8" y2="155.4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ccc" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint5_linear_155_142" x1="33.41" x2="33.41" y1="138" y2="152.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00666A" offset="0" />
            <stop stopColor="#0B4851" offset=".5208" />
            <stop stopColor="#002430" offset="1" />
        </linearGradient>
        <linearGradient id="paint6_linear_155_142" x1="198.5" x2="198.5" y1="98.11" y2="108.2" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint7_linear_155_142" x1="153.6" x2="153.6" y1="90.21" y2="167.9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2BB2A7" offset="0" />
            <stop stopColor="#0B4851" offset=".4948" />
            <stop stopColor="#2BB2A7" offset="1" />
        </linearGradient>
        <linearGradient id="paint8_linear_155_142" x1="12.45" x2="12.45" y1="181.8" y2="197.1" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ccc" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint9_linear_155_142" x1="120" x2="120" y1="173.6" y2="199.9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint10_linear_155_142" x1="109.8" x2="109.8" y1="181" y2="198.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00666A" offset="0" />
            <stop stopColor="#0B4851" offset=".5208" />
            <stop stopColor="#002430" offset="1" />
        </linearGradient>
        <linearGradient id="paint11_linear_155_142" x1="109.7" x2="109.7" y1="184.3" y2="196.7" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00666A" offset="0" />
            <stop stopColor="#0B4851" offset=".5208" />
            <stop stopColor="#002430" offset="1" />
        </linearGradient>
        <linearGradient id="paint12_linear_155_142" x1="159.8" x2="159.8" y1="144.9" y2="164.9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint13_linear_155_142" x1="158.1" x2="158.1" y1="148.6" y2="163.2" gradientUnits="userSpaceOnUse">
            <stop stopColor="#999" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
        <linearGradient id="paint14_linear_155_142" x1="50.99" x2="50.99" y1="164.1" y2="181" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ccc" offset="0" />
            <stop stopColor="#FEFFFE" offset=".5208" />
            <stop stopColor="#999" offset="1" />
        </linearGradient>
    </defs>
    </svg>
);

export default PitchDownPlane;
