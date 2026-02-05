
export const TOOLS_CONFIG = [{
    functionDeclarations: [
        {
            name: "take_screenshot",
            description: "Takes a screenshot of the user's currently visible screen context. Use this whenever the user asks you to 'see' their screen, 'look at this', or asks questions about what is on their screen.",
        },
        {
            name: "start_system_audio",
            description: "Starts listening to the system/computer audio (what the speakers are playing). Use this when the user asks you to 'listen' to something playing on their computer, or says 'listen' to capture audio context.",
        },
        {
            name: "stop_system_audio",
            description: "Stops listening to the system/computer audio.",
        }
    ]
}];

export interface ScreenshotToolResponse {
    result: {
        success: boolean;
        message: string;
    }
}
