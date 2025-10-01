// Model-agnostic OpenAI helper with text + image support and optional streaming
// NOTE: For production, do NOT call OpenAI directly from the browser. Proxy via your
// Electron main process or a backend server to keep your API key secure.

import { OpenAI } from "openai";

// ---------- Types ----------

export type InputImageUrl = { url: string };
export type InputImageBase64 = { data: string; mime_type: string };
export type InputImage = { type: "input_image"; image_url: InputImageUrl | InputImageBase64 };
export type InputText = { type: "input_text"; text: string };
export type ContentPart = InputText | InputImage;

export type ContentInput = string | ContentPart[];

export type CreateResponseParams = {
    model: string;
    // User input: either a string or an array of content parts (text + images)
    content: ContentInput;
    // Optional system instruction
    system?: string;
    // Extra OpenAI request fields if needed in the future
    temperature?: number;
    max_output_tokens?: number;
    // Request streaming events
    stream?: boolean;
};

export type OpenAIClientConfig = {
    apiKey?: string; // Prefer backend; use env only for local dev
    baseURL?: string; // Custom baseURL if using a proxy
};

export type StreamEvent = unknown; // Pass-through of SDK events for flexibility

// ---------- Helpers ----------

function toContentArray(input: ContentInput): ContentPart[] {
    if (typeof input === "string") {
        return [{ type: "input_text", text: input }];
    }
    return input;
}

function buildInputMessages(params: CreateResponseParams): Array<{ role: string; content: ContentPart[] }> {
    const messages: Array<{ role: string; content: ContentPart[] }> = [];
    if (params.system && params.system.trim().length > 0) {
        messages.push({ role: "system", content: [{ type: "input_text", text: params.system }] });
    }
    messages.push({ role: "user", content: toContentArray(params.content) });
    return messages;
}

function createClient(config?: OpenAIClientConfig) {
    // Warning: Using apiKey in the browser is insecure. Prefer a backend/Electron main proxy.
    const client = new OpenAI({
        apiKey: config?.apiKey ?? (import.meta as any)?.env?.VITE_OPENAI_API_KEY,
        baseURL: config?.baseURL,
        // v5 SDK supports browser usage but you should only enable it for local/dev with care.
        // @ts-ignore - present in SDK to allow browser usage; ignored if types change.
        dangerouslyAllowBrowser: true,
    } as any);
    return client;
}

// ---------- Public API ----------

/**
 * Create a one-shot response. If stream=true, returns an async iterable over events.
 * If stream=false/undefined, resolves to the final response object.
 */
export async function createResponse<T = unknown>(
    params: CreateResponseParams,
    config?: OpenAIClientConfig
): Promise<T | AsyncIterable<StreamEvent>> {
    const client = createClient(config);
    const input = buildInputMessages(params);
    if (params.stream) {
        const stream = await client.responses.create({
            model: params.model,
            input,
            temperature: params.temperature,
            max_output_tokens: params.max_output_tokens,
            stream: true,
        } as any);
        return stream as AsyncIterable<StreamEvent>;
    }

    const res = await client.responses.create({
        model: params.model,
        input,
        temperature: params.temperature,
        max_output_tokens: params.max_output_tokens,
    } as any);
    return res as T;
}

/**
 * Convenience: stream only text deltas as they arrive. Falls back to full text when not streaming.
 */
export async function* streamText(
    params: CreateResponseParams,
    config?: OpenAIClientConfig
): AsyncGenerator<string, void, unknown> {
    const client = createClient(config);
    const input = buildInputMessages(params);
    const stream = await client.responses.create({
        model: params.model,
        input,
        temperature: params.temperature,
        max_output_tokens: params.max_output_tokens,
        stream: true,
    } as any);

    // The SDK yields a sequence of events; we forward only text chunks when identifiable.
    for await (const event of stream as AsyncIterable<any>) {
        // Heuristic extraction: different event types may carry text deltas.
        // Common cases: { type: 'response.output_text.delta', delta: '...' }
        // or structured blocks with { content: [{ type: 'output_text', text: '...' }] }
        const t = extractTextDelta(event);
        if (t) yield t;
    }
}

/**
 * Non-streaming convenience: returns the aggregated text output (if available).
 */
export async function respondText(
    params: Omit<CreateResponseParams, "stream">,
    config?: OpenAIClientConfig
): Promise<string> {
    const client = createClient(config);
    const input = buildInputMessages(params);
    const res: any = await client.responses.create({
        model: params.model,
        input,
        temperature: params.temperature,
        max_output_tokens: params.max_output_tokens,
    } as any);

    // Best-effort aggregation across known shapes
    const text = aggregateOutputText(res);
    return text ?? "";
}

// ---------- Event parsing utilities (best-effort across models) ----------

function extractTextDelta(event: any): string | null {
    if (!event || typeof event !== "object") return null;

    // Case 1: event with explicit delta field
    if (typeof event.delta === "string") return event.delta;

    // Case 2: OpenAI Responses events often have shape { type, output_text?, content? }
    if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        return event.delta;
    }

    // Case 3: Some events may include an array of content blocks
    const blocks: any[] = event.content ?? event.output ?? [];
    for (const b of blocks) {
        if (b && (b.type === "output_text" || b.type === "text") && typeof b.text === "string") {
            return b.text;
        }
    }

    return null;
}

function aggregateOutputText(res: any): string | null {
    if (!res) return null;

    // Try common locations for text output in Responses API
    if (typeof res.output_text === "string") return res.output_text;

    const outputs: any[] = res.output ?? res.outputs ?? [];
    let out = "";
    for (const block of outputs) {
        if (!block) continue;
        if (typeof block.output_text === "string") out += block.output_text;
        const content = block.content ?? [];
        for (const c of content) {
            if ((c.type === "output_text" || c.type === "text") && typeof c.text === "string") {
                out += c.text;
            }
        }
    }
    return out || null;
}

// ---------- Example usage (remove or adapt in your app) ----------
//
// Text only
// const text = await respondText({ model: "gpt-4o-mini", content: "Say hello" });
//
// Images + text
// const img: InputImage = { type: "input_image", image_url: { url: "https://example.com/cat.jpg" } };
// const answer = await respondText({ model: "gpt-4o", content: [ { type: "input_text", text: "Describe this" }, img ] });
//
// Streaming
// for await (const delta of streamText({ model: "gpt-4o-mini", content: "Stream please" })) {
//   console.log(delta);
// }
