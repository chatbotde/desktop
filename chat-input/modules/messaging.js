import { dom } from './dom.js';
import { state } from './state.js';
import { createNewFloatingCard, routeMessageToCard, getCardByNumber } from './floating-cards.js';

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
    const raw = dom.messageInput.value;
    const message = raw.trim();
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
        // Parse @mention routing: @<num> or @new/@+
        const route = parseCardRoute(raw);
        const messageData = { content: route.cleaned, timestamp: new Date().toISOString(), id: Date.now().toString(), type: hasAny ? 'mixed' : 'text', attachments: all, meta: {} };

        // Attach targetCard metadata and forward if present
        if (route.target === 'new') {
            const newCard = createNewFloatingCard({ title: message.slice(0, 48) });
            const assigned = Number(newCard?.dataset?.cardNumber);
            if (assigned) {
                messageData.meta.targetCard = assigned;
                routeMessageToCard(messageData, assigned);
            }
        } else if (typeof route.target === 'number') {
            messageData.meta.targetCard = route.target;
            const forwarded = routeMessageToCard(messageData, route.target);
            if (!forwarded) {
                // If target card not present, create new, assign that number if free else use auto
                const targetCard = getCardByNumber(route.target);
                if (!targetCard) {
                    const newC = createNewFloatingCard({ title: message.slice(0, 48) });
                    const assigned2 = Number(newC?.dataset?.cardNumber);
                    if (assigned2) {
                        messageData.meta.targetCard = assigned2;
                        routeMessageToCard(messageData, assigned2);
                    }
                }
            }
        } else {
            // default behavior mirrors to Display 1 as before
            tryForwardToDisplayOne(messageData);
        }

        // Always send upstream (main process) with meta for logging/backends
        window.chatInputAPI.sendMessage(messageData);
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

// Parse routing directives from message input.
// Supports:
//  - @<number> anywhere (first occurrence wins) e.g., "@3 open google.com"
//  - @new or @+ to spawn a new card and route there
// Returns { target: number | 'new' | null, cleaned: string }
function parseCardRoute(raw) {
    let target = null;
    let cleaned = raw;
    const newMatch = /@(new|\+)/i.exec(raw);
    const numMatch = /@(\d{1,3})\b/.exec(raw);
    if (newMatch && (!numMatch || newMatch.index < numMatch.index)) {
        target = 'new';
        cleaned = cleaned.replace(newMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    } else if (numMatch) {
        target = Number(numMatch[1]);
        cleaned = cleaned.replace(numMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    }
    return { target, cleaned };
}


