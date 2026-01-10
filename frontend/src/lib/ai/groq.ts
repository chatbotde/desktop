import Groq from "groq-sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

// Create Groq client - API key should be set via VITE_GROQ_API_KEY env variable
const createGroqClient = (apiKey?: string) => {
  return new Groq({
    apiKey: apiKey || import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });
};

/**
 * Send a chat completion request to Groq API
 */
export async function groqChat(options: GroqChatOptions, apiKey?: string) {
  const client = createGroqClient(apiKey);

  const completion = await client.chat.completions.create({
    model: options.model || "openai/gpt-oss-120b",
    messages: options.messages,
    temperature: options.temperature ?? 1,
    max_completion_tokens: options.maxTokens ?? 8192,
    top_p: options.topP ?? 1,
    stream: false,
  });

  return completion.choices[0]?.message?.content || "";
}

/**
 * Send a streaming chat completion request to Groq API
 */
export async function* groqChatStream(options: GroqChatOptions, apiKey?: string) {
  const client = createGroqClient(apiKey);

  const stream = await client.chat.completions.create({
    model: options.model || "openai/gpt-oss-120b",
    messages: options.messages,
    temperature: options.temperature ?? 1,
    max_completion_tokens: options.maxTokens ?? 8192,
    top_p: options.topP ?? 1,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Export available models
export const GROQ_MODELS = {
  GPT_OSS_120B: "openai/gpt-oss-120b",
  LLAMA_3_3_70B: "llama-3.3-70b-versatile",
  LLAMA_3_1_8B: "llama-3.1-8b-instant",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA2_9B: "gemma2-9b-it",
} as const;

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];
