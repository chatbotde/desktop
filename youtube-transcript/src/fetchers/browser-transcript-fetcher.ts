/**
 * Browser Transcript Fetcher
 *
 * Fetches YouTube transcripts using a hidden Electron BrowserWindow when
 * direct HTTP requests cannot satisfy YouTube's PO token requirement.
 */

import type { VideoId } from '../types';

export interface BrowserTranscriptResult {
  content: string;
  languageCode: string;
  languageName: string;
}

export interface BrowserTranscriptFetcherOptions {
  timeoutMs?: number;
}

type ElectronModule = {
  BrowserWindow: new (options: Record<string, unknown>) => {
    webContents: {
      setAudioMuted: (muted: boolean) => void;
      session: Electron.Session;
      loadURL: (url: string, options?: Record<string, unknown>) => Promise<void>;
      executeJavaScript: (code: string, userGesture?: boolean) => Promise<unknown>;
    };
    isDestroyed: () => boolean;
    destroy: () => void;
  };
};

declare namespace Electron {
  interface Session {
    cookies: { set: (details: Record<string, string>) => Promise<void> };
    webRequest: {
      onBeforeRequest: (
        filter: { urls: string[] },
        listener: (
          details: { url?: string },
          callback: (response: Record<string, unknown>) => void
        ) => void
      ) => void;
    };
  }
}

export class BrowserTranscriptFetcher {
  private readonly timeoutMs: number;

  constructor(options: BrowserTranscriptFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  isAvailable(): boolean {
    return this.loadElectron() !== null;
  }

  async fetch(
    videoId: VideoId,
    preferredLanguage?: string
  ): Promise<BrowserTranscriptResult | null> {
    const electron = this.loadElectron();
    if (!electron) {
      throw new Error('BrowserWindow is not available in this runtime');
    }

    const win = new electron.BrowserWindow({
      show: false,
      width: 1280,
      height: 720,
      webPreferences: {
        partition: 'persist:youtube-transcript',
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
        autoplayPolicy: 'no-user-gesture-required',
      },
    });

    try {
      win.webContents.setAudioMuted(true);
      const session = win.webContents.session;

      try {
        await session.cookies.set({
          url: 'https://www.youtube.com',
          name: 'CONSENT',
          value: 'YES+1',
          domain: '.youtube.com',
        });
      } catch {
        // best-effort
      }

      const capturedUrl = this.createTimedTextCapture(session);
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;

      try {
        await win.webContents.loadURL(watchUrl, {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (!message.includes('ERR_ABORTED')) {
          throw error;
        }
      }

      await win.webContents.executeJavaScript(
        this.buildTriggerScript(preferredLanguage),
        true
      );

      let url: string | null = null;
      try {
        url = await this.withTimeout(capturedUrl, this.timeoutMs);
      } catch {
        return null;
      }

      if (!url) {
        return null;
      }

      const jsonUrl = this.withFormat(url, 'json3');
      const content = await this.withTimeout(
        win.webContents.executeJavaScript(this.buildRefetchScript(jsonUrl), true),
        15000
      );

      if (typeof content !== 'string' || content.trim().length === 0) {
        return null;
      }

      const languageCode = this.parseQueryParam(url, 'lang') || 'unknown';
      return { content, languageCode, languageName: languageCode };
    } finally {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    }
  }

  private createTimedTextCapture(session: Electron.Session): Promise<string | null> {
    return new Promise((resolve) => {
      let settled = false;
      let fallbackUrl: string | null = null;

      const settle = (url: string | null) => {
        if (settled) return;
        settled = true;
        resolve(url);
      };

      try {
        session.webRequest.onBeforeRequest(
          { urls: ['*://*.youtube.com/api/timedtext*'] },
          (details, callback) => {
            const url = details.url || '';
            if (url.includes('/api/timedtext')) {
              fallbackUrl = url;
              if (/[?&]pot=/.test(url)) {
                settle(url);
              }
            }
            callback({});
          }
        );
      } catch {
        settle(null);
        return;
      }

      setTimeout(() => settle(fallbackUrl), this.timeoutMs - 1000);
    });
  }

  private loadElectron(): ElectronModule | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const electron = require('electron') as ElectronModule;
      if (electron && typeof electron.BrowserWindow === 'function') {
        return electron;
      }
      return null;
    } catch {
      return null;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Browser transcript extraction timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  private withFormat(url: string, format: string): string {
    const stripped = url.replace(/([?&])fmt=[^&]*/i, '$1').replace(/[?&]$/, '');
    return stripped + (stripped.includes('?') ? '&' : '?') + `fmt=${format}`;
  }

  private parseQueryParam(url: string, name: string): string | null {
    const match = url.match(new RegExp(`[?&]${name}=([^&]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private buildRefetchScript(url: string): string {
    const pageRefetch = (fetchUrl: string) => {
      return fetch(fetchUrl, { credentials: 'include' })
        .then((r) => (r && r.ok ? r.text() : ''))
        .catch(() => '');
    };
    return `(${pageRefetch.toString()})(${JSON.stringify(url)});`;
  }

  private buildTriggerScript(preferredLanguage?: string): string {
    const pageTrigger = (language: string) => {
      return (async () => {
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let player: any = null;

        for (let i = 0; i < 60; i++) {
          player = document.getElementById('movie_player');
          if (player && typeof player.getPlayerState === 'function') break;
          await wait(250);
        }
        if (!player) return { ok: false, error: 'player not found' };

        try { player.mute?.(); } catch { /* ignore */ }
        try { player.setVolume?.(0); } catch { /* ignore */ }
        try { player.playVideo?.(); } catch { /* ignore */ }
        try { player.loadModule?.('captions'); } catch { /* ignore */ }

        let state = -1;
        for (let i = 0; i < 24; i++) {
          try { state = player.getPlayerState?.() ?? -1; } catch { /* ignore */ }
          if (state === 1) break;
          try { player.playVideo?.(); } catch { /* ignore */ }
          await wait(250);
        }

        let list: Array<{ languageCode?: string }> = [];
        for (let i = 0; i < 20; i++) {
          try {
            list =
              player.getOption?.('captions', 'tracklist', { includeAsr: true }) ||
              player.getOption?.('captions', 'tracklist') ||
              [];
          } catch {
            list = [];
          }
          if (list.length) break;
          await wait(250);
        }

        try {
          if (list.length) {
            let chosen = list[0];
            if (language) {
              for (const track of list) {
                if (
                  typeof track.languageCode === 'string' &&
                  track.languageCode.toLowerCase().startsWith(language.toLowerCase())
                ) {
                  chosen = track;
                  break;
                }
              }
            }
            player.setOption?.('captions', 'track', chosen);
          } else {
            document.querySelector<HTMLElement>('.ytp-subtitles-button')?.click();
          }
        } catch { /* ignore */ }

        return { ok: true, count: list.length, state };
      })();
    };

    return `(${pageTrigger.toString()})(${JSON.stringify(preferredLanguage || '')});`;
  }
}

export const browserTranscriptFetcher = new BrowserTranscriptFetcher();
