import { dom } from './dom.js';
import { state } from './state.js';
import { createNewFloatingCard, routeMessageToCard, getCardByNumber, getPrimaryCard, centerCardSmooth } from '../ui/floating-cards.js';
import { getBadgeContent, clearBadgesAfterSend } from '../ui/badges.js';

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
    let message = raw.trim();
    const hasImages = window.__getImageAttachments?.().length > 0;
    const hasMedia = window.__getMediaAttachments?.().length > 0;
    const hasAny = hasImages || hasMedia;
    
    // Get badge content
    const badgeContent = getBadgeContent();
    const hasBadgeTexts = badgeContent.texts.length > 0;
    const hasBadgeImages = badgeContent.images.length > 0;
    const hasBadges = hasBadgeTexts || hasBadgeImages;
    
    // Combine message with badge texts
    if (hasBadgeTexts) {
        const badgeTextsCombined = badgeContent.texts.join('\n\n');
        if (message) {
            message = `${message}\n\n${badgeTextsCombined}`;
        } else {
            message = badgeTextsCombined;
        }
    }
    
    const finalHasAny = hasAny || hasBadgeImages;
    if ((!message && !finalHasAny) || state.isSending) return;
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
        // Add badge images as attachments
        if (hasBadgeImages) all.push(...badgeContent.images);
        
        // Parse @mention routing: @<num> or @new/@+
        const route = parseCardRoute(raw);
        const messageData = { 
            content: message, 
            timestamp: new Date().toISOString(), 
            id: Date.now().toString(), 
            type: finalHasAny ? 'mixed' : 'text', 
            attachments: all, 
            meta: {},
            selectedModel: state.selectedModel // Include the selected model
        };

        // Route to specific card or primary card
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
                // If target card not found, create new
                const newC = createNewFloatingCard({ title: message.slice(0, 48) });
                const assigned2 = Number(newC?.dataset?.cardNumber);
                if (assigned2) {
                    messageData.meta.targetCard = assigned2;
                    routeMessageToCard(messageData, assigned2);
                }
            }
        } else {
            // Default: route to primary card and center it smoothly
            const primary = getPrimaryCard();
            if (primary) {
                const primaryNumber = Number(primary.dataset.cardNumber);
                messageData.meta.targetCard = primaryNumber;
                routeMessageToCard(messageData, primaryNumber);
            }
        }

        // Always send upstream (main process) with meta for logging/backends
        window.chatInputAPI.sendMessage(messageData);
        dom.messageInput.value = '';
        window.__clearAllAttachments?.();
        
        // Clear badges after sending
        if (hasBadges) {
            clearBadgesAfterSend();
        }
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

