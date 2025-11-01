import { dom } from './dom.js';
import { state, getNextBadgeId } from './state.js';

function positionBadgesContainer() {
    const container = dom.badgesContainer;
    const prompt = dom.promptInput;
    if (!container || !prompt) return;
    
    const promptRect = prompt.getBoundingClientRect();
    container.style.width = `${Math.round(promptRect.width)}px`;
    
    const containerHeight = container.offsetHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceAbove = promptRect.top;
    const spaceBelow = viewportHeight - promptRect.bottom;
    
    let top;
    if (spaceAbove >= containerHeight + 12) {
        top = Math.max(0, promptRect.top - containerHeight - 8);
    } else {
        top = Math.min(viewportHeight - containerHeight - 8, promptRect.bottom + 8);
    }
    container.style.top = `${Math.max(0, top)}px`;
    
    const centerX = promptRect.left + promptRect.width / 2;
    container.style.left = `${Math.round(centerX)}px`;
}

/**
 * Add a text badge
 */
export function addTextBadge(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return;
    
    const badge = {
        id: getNextBadgeId(),
        type: 'text',
        content: text.trim(),
        timestamp: Date.now()
    };
    
    state.badges.push(badge);
    // Re-render all badges to ensure correct numbering
    rerenderAllBadges();
    updateBadgesVisibility();
    positionBadgesContainer();
    
    setTimeout(() => {
        positionBadgesContainer();
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }, 100);
    
    return badge;
}

/**
 * Add an image badge
 */
export function addImageBadge(imageData) {
    const badge = {
        id: getNextBadgeId(),
        type: 'image',
        name: imageData.name || 'Image',
        data: imageData.data,
        timestamp: Date.now()
    };
    
    state.badges.push(badge);
    // Re-render all badges to ensure correct numbering
    rerenderAllBadges();
    updateBadgesVisibility();
    positionBadgesContainer();
    
    setTimeout(() => {
        positionBadgesContainer();
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }, 100);
    
    return badge;
}

/**
 * Remove a badge
 */
export function removeBadge(badgeId) {
    const index = state.badges.findIndex(b => b.id === badgeId);
    if (index === -1) return;
    
    state.badges.splice(index, 1);
    
    const element = document.querySelector(`[data-badge-id="${badgeId}"]`);
    if (element) {
        element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        setTimeout(() => {
            element.remove();
            // Re-render all badges to update numbering
            rerenderAllBadges();
            updateBadgesVisibility();
            positionBadgesContainer();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 150);
    } else {
        rerenderAllBadges();
        updateBadgesVisibility();
        positionBadgesContainer();
    }
}

/**
 * Re-render all badges to update numbering
 */
function rerenderAllBadges() {
    if (!dom.badgesGrid) return;
    
    // Store current badges and their animation states
    const currentBadges = [...state.badges];
    const existingElements = new Map();
    
    // Store existing elements that are already visible (to preserve animations)
    currentBadges.forEach(badge => {
        const existing = document.querySelector(`[data-badge-id="${badge.id}"]`);
        if (existing) {
            existingElements.set(badge.id, existing);
        }
    });
    
    // Clear the grid
    dom.badgesGrid.innerHTML = '';
    
    // Re-render all badges with updated numbering
    currentBadges.forEach(badge => {
        const existing = existingElements.get(badge.id);
        if (existing) {
            // If badge already exists, just update its content and numbering
            const sameTypeBadges = state.badges.filter(b => b.type === badge.type);
            const badgeIndex = sameTypeBadges.findIndex(b => b.id === badge.id);
            const badgeNumber = sameTypeBadges.length > 1 ? ` ${badgeIndex + 1}` : '';
            
            const contentSpan = existing.querySelector('.badge-content');
            if (contentSpan) {
                if (badge.type === 'text') {
                    contentSpan.textContent = `Text${badgeNumber}`;
                } else if (badge.type === 'image') {
                    contentSpan.textContent = `Image${badgeNumber}`;
                }
            }
            
            // Re-append existing element (preserves animations)
            dom.badgesGrid.appendChild(existing);
        } else {
            // New badge - render it
            renderBadge(badge);
        }
    });
}

/**
 * Clear all badges
 */
export function clearAllBadges() {
    state.badges = [];
    if (dom.badgesGrid) {
        dom.badgesGrid.innerHTML = '';
    }
    updateBadgesVisibility();
    positionBadgesContainer();
    if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
}

/**
 * Render a badge
 */
function renderBadge(badge) {
    const badgeElement = document.createElement('div');
    badgeElement.className = 'badge-item';
    badgeElement.setAttribute('data-badge-id', badge.id);
    
    badgeElement.style.opacity = '0';
    badgeElement.style.transform = 'scale(0.8)';
    
    // Count badges of the same type to add numbering
    const sameTypeBadges = state.badges.filter(b => b.type === badge.type);
    const badgeIndex = sameTypeBadges.findIndex(b => b.id === badge.id);
    const badgeNumber = sameTypeBadges.length > 1 ? ` ${badgeIndex + 1}` : '';
    
    if (badge.type === 'text') {
        badgeElement.innerHTML = `
            <span class="badge-content">Text${badgeNumber}</span>
            <button class="badge-remove" onclick="window.removeBadge('${badge.id}')" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        `;
        badgeElement.classList.add('badge-text');
    } else if (badge.type === 'image') {
        badgeElement.innerHTML = `
            <span class="badge-content">Image${badgeNumber}</span>
            <button class="badge-remove" onclick="window.removeBadge('${badge.id}')" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        `;
        badgeElement.classList.add('badge-image');
    }
    
    if (dom.badgesGrid) {
        dom.badgesGrid.appendChild(badgeElement);
        
        requestAnimationFrame(() => {
            badgeElement.style.opacity = '1';
            badgeElement.style.transform = 'scale(1)';
            positionBadgesContainer();
        });
    }
}

/**
 * Update badges visibility
 */
function updateBadgesVisibility() {
    const hasBadges = state.badges.length > 0;
    const badgesContainer = dom.badgesContainer;
    
    if (!badgesContainer) return;
    
    if (hasBadges) {
        badgesContainer.style.display = 'block';
        badgesContainer.classList.add('visible', 'has-badges');
    } else {
        badgesContainer.classList.remove('visible', 'has-badges');
        setTimeout(() => {
            if (state.badges.length === 0) {
                badgesContainer.style.display = 'none';
            }
        }, 300);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Reposition on window resize and scroll
window.addEventListener('resize', () => positionBadgesContainer());
window.addEventListener('scroll', () => positionBadgesContainer(), { passive: true });

// Expose globally for onclick handlers
window.removeBadge = removeBadge;

/**
 * Get all badge content for sending
 * Returns { texts: string[], images: Array }
 */
export function getBadgeContent() {
    const texts = [];
    const images = [];
    
    state.badges.forEach(badge => {
        if (badge.type === 'text' && badge.content) {
            texts.push(badge.content);
        } else if (badge.type === 'image' && badge.data) {
            // Extract mime type from data URL
            const mimeMatch = badge.data.match(/^data:([^;]+);base64,/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
            const ext = (mime.split('/')[1] || 'png').toLowerCase();
            
            images.push({
                id: badge.id,
                name: badge.name || `badge-image-${badge.id}.${ext}`,
                type: mime,
                size: 0,
                data: badge.data,
                source: 'badge',
                mediaType: 'image'
            });
        }
    });
    
    return { texts, images };
}

/**
 * Clear all badges after sending
 */
export function clearBadgesAfterSend() {
    state.badges = [];
    if (dom.badgesGrid) {
        dom.badgesGrid.innerHTML = '';
    }
    updateBadgesVisibility();
    positionBadgesContainer();
}

// Track dragging of the chat input container to keep badges attached
let __badgeDragRaf = null;
function __startBadgeDragTracking() {
    if (__badgeDragRaf) return;
    const loop = () => {
        positionBadgesContainer();
        __badgeDragRaf = requestAnimationFrame(loop);
    };
    __badgeDragRaf = requestAnimationFrame(loop);
}

function __stopBadgeDragTracking() {
    if (__badgeDragRaf) {
        cancelAnimationFrame(__badgeDragRaf);
        __badgeDragRaf = null;
    }
}

// Observe class changes for the dragging state
try {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const isDragging = dom.chatInputContainer?.classList.contains('dragging');
                if (isDragging) __startBadgeDragTracking(); else __stopBadgeDragTracking();
                positionBadgesContainer();
            }
        }
    });
    if (dom.chatInputContainer) {
        observer.observe(dom.chatInputContainer, { attributes: true, attributeFilter: ['class'] });
    }
} catch {}

