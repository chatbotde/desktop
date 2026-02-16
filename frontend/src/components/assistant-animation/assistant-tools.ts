
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
        },
        {
            name: "generate_image",
            description: "Generates an image based on a text prompt. Use this when the user asks you to 'create an image', 'draw something', or 'generate a picture'.",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "The text description of the image to generate."
                    }
                },
                required: ["prompt"]
            }
        },
        {
            name: "generate_video",
            description: "Generates a video based on a text prompt. Use this when the user asks you to 'create a video', 'make a clip', or 'generate an animation'.",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "The text description of the video to generate."
                    }
                },
                required: ["prompt"]
            }
        },
        {
            name: "remember",
            description: "Stores a piece of information in your long-term memory. Use this when the user asks you to remember something, or when you learn important personal details (e.g., name, preferences, favorite things).",
            parameters: {
                type: "object",
                properties: {
                    info: {
                        type: "string",
                        description: "The information to remember."
                    }
                },
                required: ["info"]
            }
        },
        {
            name: "forget",
            description: "Removes a specific piece of information from your memory. Use this when the user explicitly asks you to forget something.",
            parameters: {
                type: "object",
                properties: {
                    info: {
                        type: "string",
                        description: "The specific information or topic to forget."
                    }
                },
                required: ["info"]
            }
        }
    ]
}];


export interface ScreenshotToolResponse {
    result: {
        success: boolean;
        message: string;
    }
}
