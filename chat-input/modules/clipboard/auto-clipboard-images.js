import { addImageAttachment, showAttachmentLoading, hideAttachmentLoading } from '../media/attachments.js';
import { dom } from '../core/dom.js';

function extractDataUrl(content) {
  if (!content) return null;
  if (typeof content === 'string' && content.startsWith('data:image/')) return content;
  try {
    if (typeof content.toDataURL === 'function') return content.toDataURL();
  } catch {}
  try {
    if (typeof content.dataURL === 'string') return content.dataURL;
  } catch {}
  return null;
}

// Check if chat-input container is visible
function isChatInputVisible() {
  const container = dom.chatInputContainer;
  if (!container) return false;
  const style = window.getComputedStyle(container);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export function initAutoClipboardImages() {
  if (!window.chatInputAPI || !window.chatInputAPI.onClipboardChanged) return;

  let lastSig = '';
  window.chatInputAPI.onClipboardChanged((payload) => {
    if (!payload || payload.type !== 'image') return;

    // Don't auto-attach if chat-input is not visible
    if (!isChatInputVisible()) return;

    const dataUrl = extractDataUrl(payload.content);
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return;

    const sig = dataUrl.slice(0, 256); // lightweight duplicate guard
    if (sig === lastSig) return;
    lastSig = sig;

    try {
      showAttachmentLoading();
      const mime = (dataUrl.match(/^data:([^;]+);base64,/i) || [])[1] || 'image/png';
      const ext = (mime.split('/')[1] || 'png').toLowerCase();
      addImageAttachment({
        name: `clipboard-image-${Date.now()}.${ext}`,
        type: mime,
        size: 0,
        data: dataUrl,
        source: 'clipboard'
      });
    } catch (e) {
      console.error('AutoClipboardImages: attach failed', e);
    } finally {
      hideAttachmentLoading();
    }
  });
}
