const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { CLIENT_MESSAGE_TYPES } = require('./protocol');

const RAW_CHUNK_SIZE = 6000;
const CHUNK_DELAY_MS = 8;

class TransferCancelledError extends Error {
  constructor(message = 'cancelled') {
    super(message);
    this.name = 'TransferCancelledError';
    this.code = 'cancelled';
  }
}

/**
 * @param {number} elapsedMs
 * @param {number} current
 * @param {number} total
 * @returns {number | null}
 */
function estimateEtaMs(elapsedMs, current, total) {
  if (current <= 0 || total <= 0 || elapsedMs <= 0 || current >= total) {
    return null;
  }
  const perUnit = elapsedMs / current;
  return Math.max(0, Math.round((total - current) * perUnit));
}

/**
 * Chunk a file/buffer and deliver PC → phone file payloads.
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} mime
 * @param {(payload: Record<string, unknown>) => Promise<boolean> | boolean} deliver
 * @param {{
 *   transferId?: string;
 *   shouldCancel?: () => boolean;
 *   onProgress?: (progress: Record<string, unknown>) => void;
 * }} [options]
 */
async function sendBufferToPhone(buffer, filename, mime, deliver, options = {}) {
  if (!buffer?.length) {
    throw new Error('Empty file');
  }

  const transferId = options.transferId || crypto.randomUUID();
  const total = Math.max(1, Math.ceil(buffer.length / RAW_CHUNK_SIZE));
  const safeName = path.basename(filename || 'pc-share.bin') || 'pc-share.bin';
  const safeMime = mime || 'application/octet-stream';
  const startedAt = Date.now();

  for (let index = 0; index < total; index += 1) {
    if (options.shouldCancel?.()) {
      throw new TransferCancelledError();
    }

    const start = index * RAW_CHUNK_SIZE;
    const end = Math.min(start + RAW_CHUNK_SIZE, buffer.length);
    const chunk = buffer.subarray(start, end);
    const payload = {
      type: CLIENT_MESSAGE_TYPES.FILE_TO_PHONE_CHUNK,
      transferId,
      index,
      total,
      filename: safeName,
      mime: safeMime,
      data: chunk.toString('base64'),
    };

    const sent = await deliver(payload);
    if (!sent) {
      throw new Error('Phone disconnected during transfer');
    }

    const current = index + 1;
    const elapsedMs = Date.now() - startedAt;
    const percent = Math.min(100, Math.round((current * 100) / total));
    options.onProgress?.({
      transferId,
      filename: safeName,
      direction: 'sending',
      percent,
      current,
      total,
      elapsedMs,
      etaMs: estimateEtaMs(elapsedMs, current, total),
      cancellable: true,
    });

    if (index < total - 1 && CHUNK_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
    }
  }

  return { ok: true, filename: safeName, transferId, total };
}

/**
 * @param {string} filePath
 * @param {(payload: Record<string, unknown>) => Promise<boolean> | boolean} deliver
 * @param {{
 *   transferId?: string;
 *   shouldCancel?: () => boolean;
 *   onProgress?: (progress: Record<string, unknown>) => void;
 * }} [options]
 */
async function sendFilePathToPhone(filePath, deliver, options = {}) {
  const resolved = path.resolve(filePath);
  const buffer = await fs.promises.readFile(resolved);
  const mime = guessMime(resolved);
  return sendBufferToPhone(buffer, path.basename(resolved), mime, deliver, options);
}

/**
 * @param {Buffer | Uint8Array | ArrayBuffer} data
 * @param {string} filename
 * @param {string} [mime]
 * @param {(payload: Record<string, unknown>) => Promise<boolean> | boolean} deliver
 * @param {{
 *   transferId?: string;
 *   shouldCancel?: () => boolean;
 *   onProgress?: (progress: Record<string, unknown>) => void;
 * }} [options]
 */
async function sendBytesToPhone(data, filename, mime, deliver, options = {}) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return sendBufferToPhone(buffer, filename, mime, deliver, options);
}

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = {
  sendBufferToPhone,
  sendFilePathToPhone,
  sendBytesToPhone,
  TransferCancelledError,
};
