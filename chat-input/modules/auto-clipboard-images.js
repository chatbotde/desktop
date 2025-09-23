import { addImageAttachment, showAttachmentLoading, hideAttachmentLoading } from './attachments.js';

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

export function initAutoClipboardImages() {
  if (!window.chatInputAPI || !window.chatInputAPI.onClipboardChanged) return;

  let lastSig = '';
  window.chatInputAPI.onClipboardChanged((payload) => {
    if (!payload || payload.type !== 'image') return;

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
