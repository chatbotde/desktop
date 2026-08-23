const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { app, nativeImage } = require('electron');

const MAX_ITEMS = 40;

/**
 * In-app inbox for files received from the phone.
 * Nothing is saved to Downloads or pasted until the user chooses Save / Copy / Send.
 */
class PhoneShareInbox {
  constructor() {
    /** @type {Array<{ id: string, filename: string, mime: string, filePath: string, createdAt: number, kind: 'image' | 'file' }>} */
    this.items = [];
    /** @type {((items: ReturnType<PhoneShareInbox['list']>) => void) | null} */
    this.onChange = null;
  }

  inboxDir() {
    return path.join(app.getPath('userData'), 'phone-share-inbox');
  }

  /**
   * @param {{ filename?: string, mime?: string, buffer: Buffer }} input
   */
  async add(input) {
    const buffer = input.buffer;
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty share payload');
    }

    const mime = String(input.mime || 'application/octet-stream').toLowerCase();
    const kind = mime.startsWith('image/') ? 'image' : 'file';
    const id = crypto.randomUUID();
    const safeName =
      path.basename(String(input.filename || '')).replace(/[^\w.\-()+ ]/g, '_') ||
      (kind === 'image' ? `phone-${Date.now()}.jpg` : `phone-${Date.now()}.bin`);

    const dir = this.inboxDir();
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}-${safeName}`);
    await fs.writeFile(filePath, buffer);

    const item = {
      id,
      filename: safeName,
      mime,
      filePath,
      createdAt: Date.now(),
      kind,
    };
    this.items.unshift(item);
    if (this.items.length > MAX_ITEMS) {
      this.items = this.items.slice(0, MAX_ITEMS);
    }
    this.emit();
    return item;
  }

  list() {
    return this.items.map((item) => ({
      id: item.id,
      filename: item.filename,
      mime: item.mime,
      createdAt: item.createdAt,
      kind: item.kind,
      sizeLabel: '',
    }));
  }

  get(id) {
    return this.items.find((item) => item.id === id) || null;
  }

  async previewDataUrl(id) {
    const item = this.get(id);
    if (!item || item.kind !== 'image') {
      return null;
    }
    const buffer = await fs.readFile(item.filePath);
    if (buffer.length > 2 * 1024 * 1024) {
      const img = nativeImage.createFromBuffer(buffer);
      if (img.isEmpty()) return null;
      const resized = img.resize({ width: 280, quality: 'good' });
      return resized.toDataURL();
    }
    return `data:${item.mime};base64,${buffer.toString('base64')}`;
  }

  emit() {
    this.onChange?.(this.list());
  }
}

module.exports = { PhoneShareInbox };
