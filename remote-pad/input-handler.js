const { screen, clipboard, nativeImage, app } = require('electron');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { MouseService } = require('../interface-window/dist/mouse-service');
const { CLIENT_MESSAGE_TYPES, SERVER_MESSAGE_TYPES, PROTOCOL_VERSION } = require('./protocol');

// Buddy's desktop "insert at cursor" feature (focuses the target app and inserts
// rich content). Loaded lazily so the remote pad still works if TSF is missing.
let tsfManager = null;
try {
  ({ tsfManager } = require('../interface-window/dist/tsf/tsf-manager'));
} catch (err) {
  console.warn('[RemotePad] TSF insert feature unavailable, will fall back to clipboard paste:', err.message);
}

let pinManager = null;
try {
  ({ pinManager } = require('../interface-window/dist/tsf/pin-manager'));
} catch (err) {
  console.warn('[RemotePad] Insert pins unavailable:', err.message);
}

/** @param {import('../interface-window/dist/tsf/pin-manager').InsertPin} pin */
function serializePinForRemote(pin) {
  return {
    number: pin.number,
    name: pin.name,
    processName: pin.processName,
    windowTitleHint: pin.windowTitleHint || '',
    status: pin.status,
  };
}

const execAsync = promisify(exec);

/**
 * Shared Remote Pad input handling for LAN WebSocket and LiveKit data channel.
 */
class RemotePadInputHandler {
  constructor() {
    this.mouseService = new MouseService();
    /** @type {((syncId: string) => void) | null} */
    this.onClipboardFromPhone = null;
    /** @type {((transferId: string) => void) | null} */
    this.onFileTransferCancel = null;
    /** @type {((progress: Record<string, unknown> | null) => void) | null} */
    this.onFileTransferProgress = null;
    /** @type {((item: { filename: string, mime: string, buffer: Buffer }) => Promise<void>) | null} */
    this.onPhoneShare = null;
    /** @type {Map<string, { chunks: string[]; received: number; total: number; mime: string; timer: NodeJS.Timeout }>} */
    this.imageTransfers = new Map();
    /** @type {Map<string, { chunks: string[]; received: number; total: number; filename: string; mime: string; timer: NodeJS.Timeout; startedAt: number }>} */
    this.fileTransfers = new Map();
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async handleMessage(message) {
    switch (message.type) {
      case CLIENT_MESSAGE_TYPES.MOVE:
        await this.mouseService.moveRelative(
          Number(message.dx ?? 0),
          Number(message.dy ?? 0)
        );
        return null;

      case CLIENT_MESSAGE_TYPES.MOVE_TO: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.moveTo(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.CLICK:
        await this.mouseService.clickAtCurrent();
        return null;

      case CLIENT_MESSAGE_TYPES.CLICK_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.clickAt(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.DOUBLE_CLICK:
        await this.mouseService.doubleClickAtCurrent();
        return null;

      case CLIENT_MESSAGE_TYPES.DOUBLE_CLICK_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.doubleClickAt(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.TRIPLE_CLICK:
        await this.mouseService.tripleClickAtCurrent();
        return null;

      case CLIENT_MESSAGE_TYPES.TRIPLE_CLICK_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.tripleClickAt(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.RIGHT_CLICK:
        await this.mouseService.rightClickAtCurrent();
        return null;

      case CLIENT_MESSAGE_TYPES.RIGHT_CLICK_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.rightClickAt(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.MIDDLE_CLICK:
        await this.mouseService.middleClickAtCurrent();
        return null;

      case CLIENT_MESSAGE_TYPES.MIDDLE_CLICK_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.middleClickAt(x, y);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.SCROLL:
        await this.mouseService.scrollAtCurrent(Number(message.amount ?? 0));
        return null;

      case CLIENT_MESSAGE_TYPES.SCROLL_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.scrollAt(x, y, Number(message.amount ?? 0));
        return null;
      }

      case CLIENT_MESSAGE_TYPES.SCROLL_H:
        await this.mouseService.scrollHorizontalAtCurrent(Number(message.amount ?? 0));
        return null;

      case CLIENT_MESSAGE_TYPES.SCROLL_H_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.scrollHorizontalAt(x, y, Number(message.amount ?? 0));
        return null;
      }

      case CLIENT_MESSAGE_TYPES.TYPE:
        await this.mouseService.typeString(String(message.text ?? ''));
        return null;

      case CLIENT_MESSAGE_TYPES.KEY: {
        const modifiers = Array.isArray(message.modifiers)
          ? message.modifiers.map(String)
          : [];
        const key = this.normalizeKey(String(message.key ?? ''));
        await this.mouseService.keyTap(key, modifiers);
        return null;
      }

      case CLIENT_MESSAGE_TYPES.MOUSE_DOWN:
        await this.mouseService.pressLeftButton();
        return null;

      case CLIENT_MESSAGE_TYPES.MOUSE_DOWN_AT: {
        const { x, y } = this.resolveNormalizedPoint(message);
        await this.mouseService.moveTo(x, y);
        await this.mouseService.pressLeftButton();
        return null;
      }

      case CLIENT_MESSAGE_TYPES.MOUSE_UP:
        await this.mouseService.releaseLeftButton();
        return null;

      case CLIENT_MESSAGE_TYPES.CLIPBOARD_SET: {
        try {
          if (message.text) {
            clipboard.writeText(String(message.text));
            console.log('[RemotePad] Written text to PC clipboard');
          } else if (message.image) {
            const dataUrl = String(message.image);
            const base64Data = dataUrl.split(',')[1] || dataUrl;
            const buffer = Buffer.from(base64Data, 'base64');
            const img = nativeImage.createFromBuffer(buffer);
            clipboard.writeImage(img);
            console.log('[RemotePad] Written image to PC clipboard');
          }
          if (message.syncId && this.onClipboardFromPhone) {
            this.onClipboardFromPhone(String(message.syncId));
          }
        } catch (err) {
          console.error('[RemotePad] Failed to set clipboard:', err);
        }
        return null;
      }

      case CLIENT_MESSAGE_TYPES.CLIPBOARD_IMAGE_CHUNK:
        return this.handleImageChunk(message);

      case CLIENT_MESSAGE_TYPES.FILE_CHUNK:
        return this.handleFileChunk(message);

      case CLIENT_MESSAGE_TYPES.FILE_TRANSFER_CANCEL:
        return this.handleFileTransferCancel(message);

      case CLIENT_MESSAGE_TYPES.PING:
        return { type: SERVER_MESSAGE_TYPES.PONG };

      case CLIENT_MESSAGE_TYPES.SHELL_EXEC:
        return this.handleShellExec(message);

      case CLIENT_MESSAGE_TYPES.LIST_DIR:
        return this.handleListDir(message);

      case CLIENT_MESSAGE_TYPES.PINS_LIST: {
        if (!pinManager) {
          return {
            type: SERVER_MESSAGE_TYPES.PINS_LIST,
            pins: [],
            unavailable: true,
          };
        }
        const pins = await pinManager.refreshStatuses();
        return {
          type: SERVER_MESSAGE_TYPES.PINS_LIST,
          pins: pins.map(serializePinForRemote),
        };
      }

      case CLIENT_MESSAGE_TYPES.INSERT_PIN: {
        if (!pinManager) {
          return {
            type: SERVER_MESSAGE_TYPES.INSERT_PIN_RESULT,
            success: false,
            reason: 'unavailable',
            message: 'Insert pins not available on this PC',
          };
        }
        const number = Number(message.number);
        const text = String(message.text ?? '');
        const result = await pinManager.insertToPin(number, text);
        return {
          type: SERVER_MESSAGE_TYPES.INSERT_PIN_RESULT,
          success: result.success,
          reason: result.reason,
          message: result.message,
          pin: result.pin ? serializePinForRemote(result.pin) : undefined,
        };
      }

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {Promise<Record<string, unknown>>}
   */
  async handleShellExec(message) {
    const command = String(message.command ?? '').trim();
    if (!command) {
      throw new Error('Empty command');
    }

    const cwd = String(message.cwd ?? os.homedir()).trim() || os.homedir();
    const requestId = String(message.requestId ?? '');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 20_000,
        maxBuffer: 512 * 1024,
        windowsHide: true,
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
      });

      return {
        type: SERVER_MESSAGE_TYPES.SHELL_OUTPUT,
        requestId,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        exitCode: 0,
      };
    } catch (error) {
      const execError = /** @type {NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number }} */ (
        error
      );
      return {
        type: SERVER_MESSAGE_TYPES.SHELL_OUTPUT,
        requestId,
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? (execError.message || 'Command failed'),
        exitCode: typeof execError.code === 'number' ? execError.code : 1,
      };
    }
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {Promise<Record<string, unknown>>}
   */
  async handleListDir(message) {
    const requestId = String(message.requestId ?? '');
    const requestedPath = String(message.path ?? os.homedir()).trim() || os.homedir();
    const resolved = path.resolve(requestedPath);

    try {
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      const mapped = await Promise.all(
        entries.map(async (entry) => {
          let size = 0;
          if (entry.isFile()) {
            try {
              const stat = await fs.stat(path.join(resolved, entry.name));
              size = stat.size;
            } catch {
              size = 0;
            }
          }
          return {
            name: entry.name,
            isDir: entry.isDirectory(),
            size,
          };
        })
      );

      mapped.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });

      return {
        type: SERVER_MESSAGE_TYPES.DIR_LIST,
        requestId,
        path: resolved,
        entries: mapped,
      };
    } catch (error) {
      return {
        type: SERVER_MESSAGE_TYPES.DIR_LIST,
        requestId,
        path: resolved,
        entries: [],
        error: error instanceof Error ? error.message : 'Failed to list directory',
      };
    }
  }

  /**
   * Reassemble a chunked image transfer and write it to the OS clipboard.
   * @param {Record<string, unknown>} message
   * @returns {null}
   */
  async handleImageChunk(message) {
    const transferId = String(message.transferId ?? '');
    const index = Number(message.index ?? 0);
    const total = Number(message.total ?? 0);
    const data = String(message.data ?? '');

    if (!transferId || total <= 0) {
      return null;
    }

    let entry = this.imageTransfers.get(transferId);
    if (!entry) {
      entry = {
        chunks: new Array(total),
        received: 0,
        total,
        mime: String(message.mime ?? 'image/jpeg'),
        // Drop a stalled transfer after 60s so memory does not leak.
        timer: setTimeout(() => this.imageTransfers.delete(transferId), 60_000),
      };
      this.imageTransfers.set(transferId, entry);
    }

    if (index >= 0 && index < entry.total && entry.chunks[index] === undefined) {
      entry.chunks[index] = data;
      entry.received += 1;
    }

    if (entry.received >= entry.total) {
      clearTimeout(entry.timer);
      this.imageTransfers.delete(transferId);
      const base64 = entry.chunks.join('');
      await this.deliverShare(base64, `phone-${Date.now()}.jpg`, entry.mime);
    }

    return null;
  }

  /**
   * Reassemble chunked file transfer and put on clipboard for Ctrl+V (like images).
   * @param {Record<string, unknown>} message
   * @returns {Promise<null>}
   */
  async handleFileChunk(message) {
    const transferId = String(message.transferId ?? '');
    const index = Number(message.index ?? 0);
    const total = Number(message.total ?? 0);
    const data = String(message.data ?? '');
    const filename = String(message.filename ?? '');
    const mime = String(message.mime ?? 'application/octet-stream');

    if (!transferId || total <= 0) {
      return null;
    }

    let entry = this.fileTransfers.get(transferId);
    if (!entry) {
      entry = {
        chunks: new Array(total),
        received: 0,
        total,
        filename: filename || `phone-upload-${Date.now()}.bin`,
        mime,
        startedAt: Date.now(),
        timer: setTimeout(() => {
          this.fileTransfers.delete(transferId);
          this.onFileTransferProgress?.(null);
        }, 600_000),
      };
      this.fileTransfers.set(transferId, entry);
    } else if (filename) {
      entry.filename = filename;
    }

    if (index >= 0 && index < entry.total && entry.chunks[index] === undefined) {
      entry.chunks[index] = data;
      entry.received += 1;
      this.publishIncomingProgress(transferId, entry);
    }

    if (entry.received >= entry.total) {
      clearTimeout(entry.timer);
      this.fileTransfers.delete(transferId);
      this.onFileTransferProgress?.(null);
      const base64 = entry.chunks.join('');
      await this.deliverShare(base64, entry.filename, entry.mime);
    }

    return null;
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {{ type: string; transferId: string }}
   */
  handleFileTransferCancel(message) {
    const transferId = String(message.transferId ?? '');
    this.onFileTransferCancel?.(transferId);
    const cancelledId = this.cancelFileTransfer(transferId);
    return {
      type: SERVER_MESSAGE_TYPES.FILE_TRANSFER_CANCELLED,
      transferId: cancelledId || transferId,
    };
  }

  /**
   * Drop an in-flight phone → PC transfer.
   * @param {string} [transferId]
   * @returns {string | null}
   */
  cancelFileTransfer(transferId) {
    const id = transferId || this.fileTransfers.keys().next().value || '';
    if (!id) {
      return null;
    }
    const entry = this.fileTransfers.get(id);
    if (!entry) {
      return null;
    }
    clearTimeout(entry.timer);
    this.fileTransfers.delete(id);
    this.onFileTransferProgress?.(null);
    return id;
  }

  /**
   * @param {string} transferId
   * @param {{ received: number; total: number; filename: string; startedAt: number }} entry
   */
  publishIncomingProgress(transferId, entry) {
    const elapsedMs = Date.now() - entry.startedAt;
    const percent = Math.min(100, Math.round((entry.received * 100) / entry.total));
    let etaMs = null;
    if (entry.received > 0 && entry.received < entry.total && elapsedMs > 0) {
      const perUnit = elapsedMs / entry.received;
      etaMs = Math.max(0, Math.round((entry.total - entry.received) * perUnit));
    }
    this.onFileTransferProgress?.({
      transferId,
      filename: entry.filename,
      direction: 'receiving',
      percent,
      current: entry.received,
      total: entry.total,
      elapsedMs,
      etaMs,
      cancellable: true,
    });
  }

  /**
   * Keep the received file in the desktop inbox. Do not autosave or paste.
   * @param {string} base64
   * @param {string} filename
   * @param {string} mime
   */
  async deliverShare(base64, filename, mime) {
    if (!base64) {
      console.error('[RemotePad] Empty share payload');
      return;
    }
    const buffer = Buffer.from(base64, 'base64');
    if (this.onPhoneShare) {
      await this.onPhoneShare({
        filename: filename || `phone-${Date.now()}.bin`,
        mime: mime || 'application/octet-stream',
        buffer,
      });
      return;
    }
    console.warn('[RemotePad] Share inbox unavailable; dropping received file');
  }

  /**
   * Put a file on the clipboard and paste at the focused cursor (user-triggered Send).
   * @param {string} base64 raw base64 (no data URL prefix)
   * @param {string} filename
   * @param {string} mime
   * @returns {Promise<void>}
   */
  async insertFile(base64, filename, mime) {
    if (!base64) {
      console.error('[RemotePad] Empty file payload');
      return;
    }

    const normalizedMime = String(mime || 'application/octet-stream').toLowerCase();

    if (normalizedMime.startsWith('image/')) {
      await this.insertImage(base64, normalizedMime);
      return;
    }

    const buffer = Buffer.from(base64, 'base64');

    if (
      normalizedMime.startsWith('text/') ||
      normalizedMime === 'application/json' ||
      normalizedMime === 'application/xml'
    ) {
      try {
        if (tsfManager && typeof tsfManager.focusAndInsertRichContent === 'function') {
          const inserted = await tsfManager.focusAndInsertRichContent({
            text: buffer.toString('utf8'),
          });
          if (inserted) {
            console.log('[RemotePad] Text file inserted at cursor');
            return;
          }
        }

        clipboard.writeText(buffer.toString('utf8'));
        await this.focusTargetAndPaste();
      } catch (err) {
        console.error('[RemotePad] Failed to paste text file:', err);
      }
      return;
    }

    try {
      const safeName =
        path.basename(filename).replace(/[^\w.\-()+ ]/g, '_') || 'upload.bin';
      const tempDir = path.join(app.getPath('temp'), 'BuddyPhone');
      const dest = path.join(tempDir, `${Date.now()}-${safeName}`);
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(dest, buffer);

      await this.writeFilePathsToClipboard([dest]);
      console.log(`[RemotePad] File on clipboard (temp): ${dest}`);
      await this.focusTargetAndPaste();
    } catch (err) {
      console.error('[RemotePad] Failed to put file on clipboard:', err);
    }
  }

  /**
   * Focus the last external app (when TSF is available) and simulate Ctrl+V.
   * @returns {Promise<void>}
   */
  async focusTargetAndPaste() {
    if (tsfManager && typeof tsfManager.focusLastWindow === 'function') {
      try {
        await tsfManager.focusLastWindow();
      } catch (err) {
        console.warn('[RemotePad] Could not focus target window before paste:', err);
      }
    }

    await new Promise((resolve) => {
      setTimeout(() => {
        this.mouseService
          .keyTap('v', ['control'])
          .catch((err) => console.error('[RemotePad] Auto-paste failed:', err))
          .finally(resolve);
      }, 180);
    });
  }

  /**
   * Place one or more file paths on the OS clipboard for Explorer-style paste.
   * @param {string[]} filePaths
   * @returns {Promise<void>}
   */
  async writeFilePathsToClipboard(filePaths) {
    const paths = filePaths.map((entry) => path.resolve(String(entry))).filter(Boolean);
    if (paths.length === 0) {
      throw new Error('No file paths to copy');
    }

    if (process.platform === 'win32') {
      const quoted = paths.map((entry) => `'${entry.replace(/'/g, "''")}'`).join(',');
      await execAsync(
        `powershell -NoProfile -NonInteractive -Command "Set-Clipboard -Path ${quoted}"`,
        { windowsHide: true, timeout: 15_000 }
      );
      return;
    }

    if (process.platform === 'darwin') {
      const script = paths
        .map((entry) => `(POSIX file "${entry.replace(/"/g, '\\"')}")`)
        .join(', ');
      await execAsync(`osascript -e 'set the clipboard to {${script}}'`, {
        timeout: 15_000,
      });
      return;
    }

    const hdrop = this.buildCFHdropBuffer(paths);
    clipboard.writeBuffer('CF_HDROP', hdrop);
  }

  /**
   * Build a Windows CF_HDROP buffer for file clipboard paste.
   * @param {string[]} filePaths
   * @returns {Buffer}
   */
  buildCFHdropBuffer(filePaths) {
    const DROPFILES_SIZE = 20;
    let fileList = '';
    for (const entry of filePaths) {
      fileList += `${entry}\0`;
    }
    fileList += '\0';

    const fileListBuffer = Buffer.from(fileList, 'utf16le');
    const buffer = Buffer.alloc(DROPFILES_SIZE + fileListBuffer.length);
    buffer.writeUInt32LE(DROPFILES_SIZE, 0);
    buffer.writeInt32LE(0, 4);
    buffer.writeInt32LE(0, 8);
    buffer.writeInt32LE(0, 12);
    buffer.writeInt32LE(1, 16);
    fileListBuffer.copy(buffer, DROPFILES_SIZE);
    return buffer;
  }

  /**
   * Insert an image at the focused cursor position on the desktop.
   * Prefers Buddy's TSF "insert at cursor" feature (focuses the target app and
   * pastes there, then restores the clipboard). Falls back to a plain
   * clipboard write + Ctrl+V if TSF is unavailable.
   * @param {string} base64 raw base64 (no data URL prefix)
   * @param {string} mime
   * @returns {Promise<void>}
   */
  async insertImage(base64, mime) {
    if (!base64) {
      console.error('[RemotePad] Empty image payload');
      return;
    }

    // Try the desktop insert feature first.
    if (tsfManager && typeof tsfManager.focusAndInsertRichContent === 'function') {
      try {
        const dataUrl = `data:${mime || 'image/jpeg'};base64,${base64}`;
        const inserted = await tsfManager.focusAndInsertRichContent({ image: dataUrl });
        if (inserted) {
          console.log('[RemotePad] Image inserted at cursor via desktop insert feature');
          return;
        }
        console.warn('[RemotePad] Desktop insert returned false, falling back to clipboard paste');
      } catch (err) {
        console.error('[RemotePad] Desktop insert failed, falling back to clipboard paste:', err);
      }
    }

    // Fallback: write to clipboard and simulate paste.
    try {
      const buffer = Buffer.from(base64, 'base64');
      const img = nativeImage.createFromBuffer(buffer);
      if (img.isEmpty()) {
        console.error('[RemotePad] Assembled image was empty');
        return;
      }
      clipboard.writeImage(img);
      console.log('[RemotePad] Image written to clipboard (fallback)');
      await this.focusTargetAndPaste();
    } catch (err) {
      console.error('[RemotePad] Failed to assemble image:', err);
    }
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  normalizeKey(key) {
    const aliases = {
      return: 'enter',
      esc: 'escape',
      del: 'delete',
      ctrl: 'control',
    };
    const lower = key.trim().toLowerCase();
    return aliases[lower] ?? lower;
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {{ x: number; y: number }}
   */
  resolveNormalizedPoint(message) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const normX = Math.min(1, Math.max(0, Number(message.x ?? 0)));
    const normY = Math.min(1, Math.max(0, Number(message.y ?? 0)));
    return {
      x: Math.round(normX * width),
      y: Math.round(normY * height),
    };
  }

  /**
   * @param {string} pin
   * @param {string} expectedPin
   * @param {{ allowScreenView?: boolean }} options
   * @returns {Record<string, unknown> | { error: Record<string, unknown> }}
   */
  buildAuthResponse(pin, expectedPin, options = {}) {
    if (pin !== expectedPin) {
      return {
        error: {
          type: SERVER_MESSAGE_TYPES.AUTH_FAIL,
          reason: 'invalid_pin',
        },
      };
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    return {
      type: SERVER_MESSAGE_TYPES.AUTH_OK,
      protocolVersion: PROTOCOL_VERSION,
      screenWidth: width,
      screenHeight: height,
      allowScreenView: options.allowScreenView ?? false,
      transport: 'livekit',
    };
  }
}

module.exports = { RemotePadInputHandler };
