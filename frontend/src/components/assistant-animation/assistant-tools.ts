
export const TOOLS_CONFIG = [{
    functionDeclarations: [
        {
            name: "take_screenshot",
            description: "Takes a screenshot of the user's currently visible screen context. Use this whenever the user asks you to 'see' their screen, 'look at this', or asks questions about what is on their screen.",
        }
    ]
}];

export interface ScreenshotToolResponse {
    result: {
        success: boolean;
        message: string;
    }
}
