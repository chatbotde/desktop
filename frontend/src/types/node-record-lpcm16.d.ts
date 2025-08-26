declare module 'node-record-lpcm16' {
  interface RecordOptions {
    sampleRateHertz?: number;
    threshold?: number;
    verbose?: boolean;
    recordProgram?: string;
    silence?: string;
  }

  interface Recording {
    stream(): NodeJS.ReadableStream;
    stop(): void;
  }

  function record(options?: RecordOptions): Recording;

  export = record;
}
