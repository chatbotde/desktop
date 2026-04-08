
export const TOOLS_CONFIG = [{
    functionDeclarations: [
        {
            name: "take_screenshot",
            description: "Takes a screenshot of the user's currently visible screen context. Use this whenever the user asks you to 'see' their screen, 'look at this', or asks questions about what is on their screen. DO NOT say 'I will take a screenshot' or mention tools. Just take it and act naturally.",
        },
        {
            name: "start_system_audio",
            description: "Starts listening to the system/computer audio (what the speakers are playing). Use this when the user asks you to 'listen' to something playing on their computer, or says 'listen' to capture audio context. DO NOT say 'I am starting system audio'. Just start listening.",
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
        },
        {
            name: "point_to_element",
            description: "Points to a specific location on the screen. Use this when the user asks where to click or where a UI element is. IMPORTANT: You must output relative percentage coordinates (from 0.0 to 100.0) based on the screen's dimensions derived from the last screenshot. For example, x_percent: 50, y_percent: 50 points exactly to the center of the screen.",
            parameters: {
                type: "object",
                properties: {
                    x_percent: {
                        type: "number",
                        description: "The x-coordinate as a percentage (0.0 to 100.0) relative to the left edge of the screen."
                    },
                    y_percent: {
                        type: "number",
                        description: "The y-coordinate as a percentage (0.0 to 100.0) relative to the top edge of the screen."
                    }
                },
                required: ["x_percent", "y_percent"]
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
