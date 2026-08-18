import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Layout preset for simple overlay animations.
 * - 'centered'       → fixed, centred on screen
 * - 'bottom-center'  → fixed at bottom, centred horizontally
 * - 'bottom-left'    → fixed at bottom-left
 * - 'bottom-right'   → fixed at bottom-right
 */
export type OverlayLayout = 'centered' | 'bottom-center' | 'bottom-left' | 'bottom-right'

/**
 * Motion preset for simple overlay animations.
 * - 'none'           → static, no trajectory motion
 * - 'left-to-right'  → travels from left edge to right edge (looping)
 * - 'right-to-left'  → travels from right edge to left edge (looping)
 * - 'diagonal-down'  → descends diagonally from top-right to bottom-left
 */
export type OverlayMotion = 'none' | 'left-to-right' | 'right-to-left' | 'diagonal-down'

export interface AnimationEntry {
    /** Unique id — used as the AnimationId everywhere. */
    id: string

    /** Human-readable label shown in settings. */
    label: string

    /** Short description shown in settings. */
    description: string

    /**
     * If `true`, this animation uses a CUSTOM overlay component supplied via
     * `customOverlay`. The generic overlay wrapper is NOT generated.
     */
    custom?: boolean

    /**
     * The custom overlay component (only needed when `custom: true`).
     * Lazy-loaded for performance.
     */
    customOverlay?: LazyExoticComponent<ComponentType>

    // ── Generic overlay options (ignored when custom: true) ─────────────────

    /**
     * Lazy-loaded Lottie component to render inside the generic overlay wrapper.
     */
    component?: LazyExoticComponent<ComponentType>

    /** Layout preset. Default: 'centered'. */
    layout?: OverlayLayout

    /** Motion preset. Default: 'none'. */
    motion?: OverlayMotion

    /** Duration of one full motion cycle in seconds. Default: 15. */
    motionDuration?: number

    /** Whether click toggles scale (zoom in/out). Default: false. */
    clickToZoom?: boolean

    /** Extra CSS class on the wrapper div. */
    wrapperClassName?: string

    // ── AI Agent Indexing (like Google SEO for an AI search engine) ──────────

    /**
     * Like a website URL path (e.g. "ambient/vehicle/rollsroyce").
     * The structured path the AI uses to locate and trigger this animation.
     */
    aiUrlPath?: string

    /**
     * Like the <title> tag on a webpage.
     * Descriptive title that tells the AI exactly what subjects are in the animation.
     */
    aiTitle?: string

    /**
     * Like the <meta name="description"> tag.
     * Tells the AI exactly what happens visually AND when it is appropriate to use it.
     */
    aiMetaDescription?: string

    /**
     * Like <meta name="keywords">.
     * Words the AI might "search" for when looking for an animation to play.
     */
    aiKeywords?: string[]
}

// ─── The ONE source of truth ──────────────────────────────────────────────────
//
// To add a NEW simple Lottie animation you only need to:
//   1. Create the Lottie component in /components/lottie/
//   2. Add ONE entry below  (fill in both human-UI AND AI-index fields)
//
// That's it. The overlay, settings toggle, AnimationId type, AND the AI
// search index are all derived from this registry automatically.
//

export const ANIMATION_REGISTRY: AnimationEntry[] = [
    // ── Simple / generic overlays ─────────────────────────────────────────────
    {
        id: 'fighterplane',
        label: 'Fighter Plane',
        description: 'A sleek fighter jet zooming across your screen.',
        component: lazy(() => import('@/components/lottie/fighterplane').then(m => ({ default: m.FighterPlane }))),
        layout: 'centered',

        aiUrlPath: 'ambient/aviation/fighter-plane',
        aiTitle: 'Military fighter jet flyover animation',
        aiMetaDescription: 'A fast military fighter jet zooming across the screen. Trigger when the user mentions jets, aviation, speed, military, Top Gun, or anything related to fast powerful aircraft.',
        aiKeywords: ['jet', 'fighter', 'plane', 'military', 'speed', 'fast', 'aviation', 'fly', 'aircraft', 'top-gun'],
    },
    {
        id: 'basketball',
        label: 'Basketball',
        description: 'A bouncing basketball animation.',
        component: lazy(() => import('@/components/lottie/basketball').then(m => ({ default: m.Basketball }))),
        layout: 'centered',

        aiUrlPath: 'ambient/sports/basketball',
        aiTitle: 'Bouncing basketball sports animation',
        aiMetaDescription: 'A lively bouncing basketball. Trigger when the user mentions basketball, NBA, sports, dunking, shooting hoops, or any basketball-related topic.',
        aiKeywords: ['basketball', 'sports', 'bounce', 'nba', 'hoop', 'dunk', 'ball', 'game', 'court'],
    },
    {
        id: 'paperplane',
        label: 'Paper Plane',
        description: 'A playful paper plane gliding globally.',
        component: lazy(() => import('@/components/lottie/paperplane').then(m => ({ default: m.PaperPlane }))),
        layout: 'centered',

        aiUrlPath: 'ambient/aviation/paper-plane',
        aiTitle: 'Playful paper airplane gliding animation',
        aiMetaDescription: 'A lightweight paper airplane gliding gently. Trigger for casual, playful moments — when the user sends a message, shares an idea, or when the mood is light and creative.',
        aiKeywords: ['paper', 'plane', 'glide', 'fly', 'playful', 'light', 'creative', 'idea', 'send', 'message'],
    },
    {
        id: 'sun',
        label: 'Sun',
        description: 'A cheerful sun radiating light.',
        component: lazy(() => import('@/components/lottie/sun').then(m => ({ default: m.Sun }))),
        layout: 'centered',

        aiUrlPath: 'ambient/weather/sun',
        aiTitle: 'Cheerful radiating sun weather animation',
        aiMetaDescription: 'A warm, cheerful sun radiating light. Trigger when the mood is positive, when greeting the user in the morning, when discussing weather, sunshine, warmth, or positivity.',
        aiKeywords: ['sun', 'sunny', 'weather', 'warm', 'bright', 'morning', 'cheerful', 'happy', 'positive', 'light', 'day'],
    },
    {
        id: 'start',
        label: 'Start Indicator',
        description: 'An initial start animation overlay.',
        component: lazy(() => import('@/components/lottie/start').then(m => ({ default: m.Start }))),
        layout: 'centered',

        aiUrlPath: 'action/system/start',
        aiTitle: 'System start indicator animation',
        aiMetaDescription: 'A start indicator animation. Trigger when the application boots up, when a new session begins, or when prompted to initialize or restart something.',
        aiKeywords: ['start', 'begin', 'boot', 'launch', 'initialize', 'new', 'session', 'welcome', 'intro'],
    },
    {
        id: 'skateboard',
        label: 'Skateboarder',
        description: 'A cool skateboarder doing tricks across the bottom.',
        component: lazy(() => import('@/components/lottie/skateboard').then(m => ({ default: m.Skateboard }))),
        layout: 'bottom-center',
        motion: 'left-to-right',
        motionDuration: 20,

        aiUrlPath: 'ambient/sports/skateboard',
        aiTitle: 'Cool skateboarder doing tricks moving across screen',
        aiMetaDescription: 'A skateboarder cruising left-to-right doing tricks. Trigger when the user mentions skating, extreme sports, tricks, being cool, or street culture.',
        aiKeywords: ['skateboard', 'skater', 'tricks', 'cool', 'extreme', 'sports', 'street', 'cruise', 'rad'],
    },
    {
        id: 'rollsroyce',
        label: 'Rolls Royce',
        description: 'A cute luxury Rolls Royce driving across your screen.',
        component: lazy(() => import('@/components/lottie/RR').then(m => ({ default: m.RollsRoyce }))),
        layout: 'bottom-center',
        motion: 'left-to-right',
        motionDuration: 15,
        clickToZoom: true,

        aiUrlPath: 'ambient/vehicle/rolls-royce',
        aiTitle: 'Luxury Rolls Royce car driving across screen',
        aiMetaDescription: 'A cute luxury Rolls Royce driving left-to-right. Trigger when the user mentions cars, luxury, driving, wealth, Rolls Royce, elegance, or automotive topics.',
        aiKeywords: ['car', 'rolls-royce', 'luxury', 'drive', 'vehicle', 'elegant', 'rich', 'automotive', 'cruise'],
    },

    // ── Custom overlays (have their own component file) ───────────────────────
    {
        id: 'cat',
        label: 'Cat',
        description: 'An animated cat that sits in the corner cycling through poses.',
        custom: true,
        customOverlay: lazy(() => import('@/app/overlays/CatOverlay').then(m => ({ default: m.CatOverlay }))),

        aiUrlPath: 'character/pet/cat',
        aiTitle: 'Animated cat buddy companion cycling through poses',
        aiMetaDescription: 'A cute animated cat that sits in the corner and cycles through sleeping, sitting, and talking poses. Trigger when the user mentions cats, pets, companions, or wants a cozy buddy on screen.',
        aiKeywords: ['cat', 'pet', 'companion', 'buddy', 'cute', 'cozy', 'animal', 'kitten', 'meow'],
    },
    {
        id: 'trimplane',
        label: 'Trim Plane',
        description: 'A plane that cruises left-to-right across the screen. Click it to zoom in.',
        custom: true,
        customOverlay: lazy(() => import('@/app/overlays/TrimPlaneOverlay').then(m => ({ default: m.TrimPlaneOverlay }))),

        aiUrlPath: 'ambient/aviation/trim-plane',
        aiTitle: 'Civilian airplane cruising steadily left to right',
        aiMetaDescription: 'A commercial-style airplane cruising smoothly from left to right. Trigger when the user mentions travel, flights, vacations, cruising, or a calm journey across the sky.',
        aiKeywords: ['plane', 'cruise', 'travel', 'flight', 'vacation', 'fly', 'journey', 'trip', 'aircraft', 'calm'],
    },
    {
        id: 'pitchdownplane',
        label: 'Pitch Down Plane',
        description: 'A plane on a landing approach descending from top-right. Click it to zoom in.',
        custom: true,
        customOverlay: lazy(() => import('@/app/overlays/PitchDownPlaneOverlay').then(m => ({ default: m.PitchDownPlaneOverlay }))),

        aiUrlPath: 'action/aviation/landing-plane',
        aiTitle: 'Airplane descending on a landing approach from top right',
        aiMetaDescription: 'A plane descending diagonally on a landing approach. Trigger when a task is completed, when concluding a thought, when signaling arrival or success, or when the user mentions landing.',
        aiKeywords: ['landing', 'arrival', 'finish', 'complete', 'done', 'success', 'descend', 'plane', 'approach'],
    },
    {
        id: 'lefthand',
        label: 'Left Hand',
        description: 'A golden left hand displayed at the bottom-left corner of the screen.',
        custom: true,
        customOverlay: lazy(() => import('@/app/overlays/LeftHandOverlay').then(m => ({ default: m.LeftHandOverlay }))),

        aiUrlPath: 'ambient/gesture/left-hand',
        aiTitle: 'Golden left hand gesture overlay at bottom-left',
        aiMetaDescription: 'A golden left hand shown at the bottom-left corner. Trigger when the user mentions hands, gestures, waving, pointing left, or wants a decorative hand element.',
        aiKeywords: ['hand', 'left', 'gesture', 'wave', 'point', 'golden', 'palm', 'finger'],
    },
    {
        id: 'righthand',
        label: 'Right Hand',
        description: 'A golden right hand displayed at the bottom-right corner of the screen.',
        custom: true,
        customOverlay: lazy(() => import('@/app/overlays/RightHandOverlay').then(m => ({ default: m.RightHandOverlay }))),

        aiUrlPath: 'ambient/gesture/right-hand',
        aiTitle: 'Golden right hand gesture overlay at bottom-right',
        aiMetaDescription: 'A golden right hand shown at the bottom-right corner. Trigger when the user mentions hands, gestures, waving, pointing right, or wants a decorative hand element on the right side.',
        aiKeywords: ['hand', 'right', 'gesture', 'wave', 'point', 'golden', 'palm', 'finger'],
    },
/*
    {
        id: 'test',
        label: 'Test Sandbox',
        description: 'Experimental sandbox for testing components.',
        custom: true,
        customOverlay: lazy(() => import('@/app/test/TestComponent').then(m => ({ default: m.TestComponent }))),

        aiUrlPath: 'system/dev/test-sandbox',
        aiTitle: 'Developer test sandbox for experimental components',
        aiMetaDescription: 'An experimental sandbox used only for development and testing. Do NOT trigger this in production or for end users. Only use when explicitly asked to run a test component.',
        aiKeywords: ['test', 'sandbox', 'dev', 'debug', 'experiment', 'development'],
    },
*/
]

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** All registered animation IDs (use this instead of a hardcoded union type). */
export const ALL_ANIMATION_IDS = ANIMATION_REGISTRY.map(e => e.id)

/** Quick lookup by id. */
export const ANIMATION_MAP = new Map(ANIMATION_REGISTRY.map(e => [e.id, e]))

// ─── AI Search Index ──────────────────────────────────────────────────────────
//
// A clean, JSON-serializable index stripped of React components.
// Feed this into the AI's system prompt or a vector database for semantic search.
//

export interface AISearchEntry {
    /** The animation id to trigger. */
    triggerId: string
    /** Structured URL-like path (e.g. "ambient/vehicle/rolls-royce"). */
    urlPath: string
    /** Descriptive title (like a webpage <title>). */
    title: string
    /** When and why to trigger (like a <meta description>). */
    description: string
    /** Searchable keywords. */
    keywords: string[]
}

/** Ready-to-use AI search index — pass this to your agent or embed in a vector DB. */
export const AI_SEARCH_INDEX: AISearchEntry[] = ANIMATION_REGISTRY
    .filter(e => e.aiUrlPath) // only entries that have AI metadata
    .map(e => ({
        triggerId: e.id,
        urlPath: e.aiUrlPath!,
        title: e.aiTitle ?? e.label,
        description: e.aiMetaDescription ?? e.description,
        keywords: e.aiKeywords ?? [],
    }))
