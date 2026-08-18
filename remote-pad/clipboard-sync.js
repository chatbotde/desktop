const crypto = require('crypto');
const { clipboard, nativeImage } = require('electron');
const { SERVER_MESSAGE_TYPES } = require('./protocol');

const POLL_MS = 700;
const MAX_TEXT_LENGTH = 256 * 1024;

/**
 * Watches the PC clipboard and pushes changes to the connected phone when enabled.
 */
class ClipboardSyncService {
  constructor() {
    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
    this.enabled = false;
    /** @type {(() => Promise<boolean>) | null} */
    this.deliver = null;
    this.lastFingerprint = '';
    this.suppressUntil = 0;
    this.lastSentSyncId = '';
  }

  /**
   * @param {boolean} enabled
   * @param {() => Promise<boolean>} deliver
   */
  configure(enabled, deliver) {
    this.enabled = enabled;
    this.deliver = deliver;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    if (this.timer) {
      return;
    }
    this.lastFingerprint = this.readFingerprint();
    this.timer = setInterval(() => {
      void this.poll();
    }, POLL_MS);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Phone pushed clipboard to PC — avoid echoing it back.
   * @param {string} [syncId]
   */
  noteRemoteUpdate(syncId) {
    this.suppressUntil = Date.now() + 1_200;
    this.lastFingerprint = this.readFingerprint();
    if (syncId) {
      this.lastSentSyncId = syncId;
    }
  }

  readFingerprint() {
    try {
      const text = clipboard.readText()?.trim() ?? '';
      if (text) {
        return `t:${text.slice(0, 4096)}:${text.length}`;
      }
      const image = clipboard.readImage();
      if (image && !image.isEmpty()) {
        const size = image.getSize();
        return `i:${size.width}x${size.height}:${image.toPNG().length}`;
      }
    } catch {
      // ignore read errors
    }
    return '';
  }

  async poll() {
    if (!this.enabled || !this.deliver) {
      return;
    }
    if (Date.now() < this.suppressUntil) {
      return;
    }

    const fingerprint = this.readFingerprint();
    if (!fingerprint || fingerprint === this.lastFingerprint) {
      return;
    }
    this.lastFingerprint = fingerprint;

    try {
      const text = clipboard.readText()?.trim() ?? '';
      if (text && text.length <= MAX_TEXT_LENGTH) {
        const syncId = crypto.randomUUID();
        this.lastSentSyncId = syncId;
        const sent = await this.deliver({
          type: SERVER_MESSAGE_TYPES.CLIPBOARD_SYNC,
          text,
          syncId,
        });
        if (sent) {
          console.log('[RemotePad] Clipboard synced to phone');
        }
        return;
      }

      const image = clipboard.readImage();
      if (image && !image.isEmpty()) {
        const png = image.toPNG();
        if (png.length <= 512 * 1024) {
          const syncId = crypto.randomUUID();
          this.lastSentSyncId = syncId;
          const sent = await this.deliver({
            type: SERVER_MESSAGE_TYPES.CLIPBOARD_SYNC,
            image: `data:image/png;base64,${png.toString('base64')}`,
            syncId,
          });
          if (sent) {
            console.log('[RemotePad] Clipboard image synced to phone');
          }
        }
      }
    } catch (error) {
      console.warn('[RemotePad] Clipboard sync poll failed:', error);
    }
  }
}

module.exports = { ClipboardSyncService };
