/**
 * HTTP-based Transports for MCP (SSE and Streamable HTTP)
 */

import { EventEmitter } from 'events';

export interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
}

/**
 * SSE (Server-Sent Events) Transport for MCP
 * Used for connecting to HTTP+SSE based MCP servers
 */
export class SSETransport extends EventEmitter {
  private url: string;
  private headers: Record<string, string>;
  private eventSource?: EventSource;
  private sessionId?: string;
  private connected: boolean = false;

  constructor(options: HttpTransportOptions) {
    super();
    this.url = options.url;
    this.headers = options.headers || {};
  }

  async start(): Promise<void> {
    try {
      // Initialize SSE connection
      const sseUrl = new URL('/sse', this.url);
      this.eventSource = new EventSource(sseUrl.toString());

      return new Promise((resolve, reject) => {
        if (!this.eventSource) {
          reject(new Error('Failed to create EventSource'));
          return;
        }

        this.eventSource.onopen = () => {
          this.connected = true;
          this.emit('connected');
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Capture session ID from first message if available
            if (message.sessionId && !this.sessionId) {
              this.sessionId = message.sessionId;
            }
            
            this.emit('message', message);
          } catch (error) {
            this.emit('error', new Error('Failed to parse SSE message'));
          }
        };

        this.eventSource.onerror = (error) => {
          this.connected = false;
          this.emit('error', error);
          reject(error);
        };

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('SSE connection timeout'));
          }
        }, 30000);
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async send(message: any): Promise<void> {
    if (!this.connected || !this.sessionId) {
      throw new Error('Transport not connected');
    }

    try {
      const response = await fetch(new URL('/messages', this.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.connected = false;
    this.sessionId = undefined;
    this.emit('disconnected');
    this.removeAllListeners();
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Streamable HTTP Transport for MCP
 * Modern transport using fetch with streaming
 */
export class StreamableHTTPTransport extends EventEmitter {
  private url: string;
  private headers: Record<string, string>;
  private sessionId?: string;
  private connected: boolean = false;
  private abortController?: AbortController;

  constructor(options: HttpTransportOptions) {
    super();
    this.url = options.url;
    this.headers = options.headers || {};
  }

  async start(): Promise<void> {
    try {
      this.abortController = new AbortController();
      
      const response = await fetch(new URL('/mcp', this.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              sampling: {},
              elicitation: {}
            },
            clientInfo: {
              name: 'sonicplane-mcp-client',
              version: '1.0.0'
            }
          },
          id: 1
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Extract session ID from response headers if present
      const sessionHeader = response.headers.get('X-Session-ID');
      if (sessionHeader) {
        this.sessionId = sessionHeader;
      }

      this.connected = true;
      this.emit('connected');

      // Start listening for streaming responses
      if (response.body) {
        this.handleStreamingResponse(response.body);
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async handleStreamingResponse(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (this.connected) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON messages (separated by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              this.emit('message', message);
            } catch (error) {
              console.error('Failed to parse streaming message:', error);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.emit('error', error);
      }
    } finally {
      reader.releaseLock();
    }
  }

  async send(message: any): Promise<any> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    try {
      const response = await fetch(new URL('/mcp', this.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionId && { 'X-Session-ID': this.sessionId }),
          ...this.headers
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.connected = false;
    this.sessionId = undefined;
    this.emit('disconnected');
    this.removeAllListeners();
  }

  isConnected(): boolean {
    return this.connected;
  }
}


