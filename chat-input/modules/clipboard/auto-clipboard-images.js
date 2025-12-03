import { addImageAttachment, showAttachmentLoading, hideAttachmentLoading } from '../media/attachments.js';
import { dom } from '../core/dom.js';
import { clipboardBar } from './clipboard-ui.js';
import { isAutoClipboardEnabled } from './auto-clipboard-state.js';

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
      const mime = (dataUrl.match(/^data:([^;]+);base64,/i) || [])[1] || 'image/png';
      const ext = (mime.split('/')[1] || 'png').toLowerCase();
      const imageData = {
        name: `clipboard-image-${Date.now()}.${ext}`,
        type: mime,
        size: 0,
        data: dataUrl,
        source: 'clipboard'
      };

      if (isAutoClipboardEnabled()) {
        showAttachmentLoading();
        addImageAttachment(imageData);
        hideAttachmentLoading();
      } else {
        clipboardBar.show('Image detected', sig, imageData, false, 'image');
      }
    } catch (e) {
      console.error('AutoClipboardImages: attach failed', e);
      hideAttachmentLoading();
    }
  });
}
