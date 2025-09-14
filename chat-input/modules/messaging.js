import { dom } from './dom.js';
import { state } from './state.js';

export function updateSendButtonVisual() {
    if (state.isSending) {
        dom.sendIcon.style.display = 'none';
        dom.loadingSpinner.style.display = 'block';
    } else {
        dom.sendIcon.style.display = 'block';
        dom.loadingSpinner.style.display = 'none';
    }
}

export function sendMessage() {
    const message = dom.messageInput.value.trim();
    const hasImages = window.__getImageAttachments?.().length > 0;
    const hasMedia = window.__getMediaAttachments?.().length > 0;
    const hasAny = hasImages || hasMedia;
    if ((!message && !hasAny) || state.isSending) return;
    if (!window.chatInputAPI) { console.error('chatInputAPI not available'); return; }
    state.isSending = true;
    state.lastMessageSent = message;
    updateSendButtonVisual();
    dom.typingIndicator.classList.add('active');
    dom.messageInput.disabled = true;
    try {
        const all = [];
        if (hasImages) all.push(...window.__getImageAttachments().map(att => ({ id: att.id, name: att.name, type: att.type, size: att.size, data: att.data, source: att.source, mediaType: 'image', dimensions: att.dimensions })));
        if (hasMedia) all.push(...window.__getMediaAttachments().map(att => ({ id: att.id, name: att.name, type: att.type, size: att.size, data: att.data, source: att.source, mediaType: att.mediaType, dimensions: att.dimensions, duration: att.duration })));
        const messageData = { content: message, timestamp: new Date().toISOString(), id: Date.now().toString(), type: hasAny ? 'mixed' : 'text', attachments: all };
        window.chatInputAPI.sendMessage(messageData);
        // Also forward to Display 1 iframe (floatingCard1) so it mirrors the main window
        tryForwardToDisplayOne(messageData);
        dom.messageInput.value = '';
        window.__clearAllAttachments?.();
    } catch (err) {
        console.error('Error sending message', err);
        resetSendingState();
    }
    setTimeout(() => { resetSendingState(); dom.messageInput.focus(); }, 1200);
}

export function resetSendingState() {
    state.isSending = false;
    state.lastMessageSent = '';
    dom.typingIndicator.classList.remove('active');
    dom.messageInput.disabled = false;
    updateSendButtonVisual();
}

function tryForwardToDisplayOne(messageData) {
    const card = document.getElementById('floatingCard1');
    if (!card) return;
    const iframe = card.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;
    // Target origin: in dev it's http://localhost:5173; fallback to '*'
    const targetOrigin = iframe.src && iframe.src.startsWith('http') ? new URL(iframe.src).origin : '*';
    try {
        iframe.contentWindow.postMessage({ type: 'chat-input-message', payload: messageData }, targetOrigin);
    } catch (e) {
        console.warn('Forward to display one failed, retrying with *', e);
        try { iframe.contentWindow.postMessage({ type: 'chat-input-message', payload: messageData }, '*'); } catch (_) {}
    }
}


