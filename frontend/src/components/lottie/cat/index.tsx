import React, { useEffect, useState } from "react";
import SleepingCat from "./sleeping";
import SitCat from "./sit";
import RightJumpCat from "./right-jump";
import StartJumpCat from "./start-jumpt";
import Walk1Cat from "./walk-1";
import Walk2Cat from "./walk-2";
import Walk3Cat from "./walk-3";
import Walk4Cat from "./walk-4";
import SittingCloseMouthCat from "./sitting-close-mouth";
import SittingOpenMouthCat from "./sitting-open-mouth";

// ─── Posture Registry ────────────────────────────────────────────────────────
// Each entry has: the posture key + how many ms to stay in that posture.
// Add new postures here — no other code needs to change.

export type CatPosture =
    | "sleeping"
    | "sit"
    | "right-jump"
    | "start-jump"
    | "walk-1"
    | "walk-2"
    | "walk-3"
    | "walk-4"
    | "sitting-close-mouth"
    | "sitting-open-mouth";

interface PostureStep {
    posture: CatPosture;
    /** How long this posture is shown before advancing, in milliseconds. */
    duration: number;
}

export const CAT_POSTURE_SEQUENCE: PostureStep[] = [
    { posture: "sit", duration: 2500 },
    { posture: "walk-1", duration: 300 },
    { posture: "walk-2", duration: 300 },
    { posture: "walk-3", duration: 300 },
    { posture: "walk-4", duration: 300 },
    { posture: "walk-1", duration: 300 },
    { posture: "walk-2", duration: 300 },
    { posture: "walk-3", duration: 300 },
    { posture: "walk-4", duration: 300 },
    { posture: "walk-1", duration: 300 },
    { posture: "walk-2", duration: 300 },
    { posture: "walk-3", duration: 300 },
    { posture: "walk-4", duration: 300 },
    { posture: "start-jump", duration: 1200 },
    { posture: "right-jump", duration: 1000 },
    { posture: "sit", duration: 3000 },
    { posture: "sleeping", duration: 5000 },
    { posture: "sit", duration: 1500 },
    { posture: "sit", duration: 2000 },
];

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CatBuddyProps {
    /**
     * Pin a specific posture — disables the auto-cycle.
     * When omitted the cat will cycle through CAT_POSTURE_SEQUENCE automatically.
     */
    posture?: CatPosture;
    /** Width in px. */
    width?: number;
    /** Height in px. */
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPostureSvg(
    posture: CatPosture,
    width?: number,
    height?: number,
    className?: string,
    style?: React.CSSProperties,
) {
    const w = width;
    const h = height;
    const props = { width: w, height: h, className, style };

    switch (posture) {
        case "sleeping":
            return <SleepingCat width={w ?? 250} height={h ?? 250} className={className} style={style} />;
        case "sit":
            return <SitCat {...props} />;
        case "right-jump":
            return <RightJumpCat {...props} />;
        case "start-jump":
            return <StartJumpCat {...props} />;
        case "walk-1":
            return <Walk1Cat {...props} />;
        case "walk-2":
            return <Walk2Cat {...props} />;
        case "walk-3":
            return <Walk3Cat {...props} />;
        case "walk-4":
            return <Walk4Cat {...props} />;
        case "sitting-close-mouth":
            return <SittingCloseMouthCat {...props} />;
        case "sitting-open-mouth":
            return <SittingOpenMouthCat {...props} />;
        default:
            return <SitCat {...props} />;
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

const CatBuddy: React.FC<CatBuddyProps> = ({
    posture: pinnedPosture,
    width,
    height,
    className,
    style,
    onClick,
}) => {
    const [stepIndex, setStepIndex] = useState(0);

    // Only run the auto-cycle when no posture is pinned from outside.
    useEffect(() => {
        if (pinnedPosture !== undefined) return;

        const currentDuration = CAT_POSTURE_SEQUENCE[stepIndex].duration;

        const timer = setTimeout(() => {
            setStepIndex((prev) => (prev + 1) % CAT_POSTURE_SEQUENCE.length);
        }, currentDuration);

        return () => clearTimeout(timer);
    }, [stepIndex, pinnedPosture]);

    const activePosture =
        pinnedPosture !== undefined
            ? pinnedPosture
            : CAT_POSTURE_SEQUENCE[stepIndex].posture;

    return (
        <div
            onClick={onClick}
            style={{
                display: "inline-flex",
                cursor: onClick ? "pointer" : "default",
                // Smooth posture swap — avoids jarring jumps.
                transition: "opacity 0.2s ease",
            }}
        >
            {renderPostureSvg(activePosture, width, height, className, style)}
        </div>
    );
};

export default CatBuddy;
