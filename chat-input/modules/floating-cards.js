// ==================== FLOATING CARDS MODULE (REFACTORED FOR SINGLE-CARD UX) ====================
// Simplified: spawn one centered card on init, user can create more as needed
// Cards auto-center on message send, expand with smooth transitions, resize Windows-style

let zCounter = 3000; // Base z-index (below chat-input which is 50000)
const cardRegistry = new Map(); // cardNumber -> element
let nextCardNumber = 1; // Start from 1 and increment
let primaryCard = null; // Reference to the first/primary card

// Color palette for cards (cycles through these)
const COLOR_PALETTE = [
    { accent: '#60a5fa', strong: '#3b82f6', name: 'blue' },      // Blue
    { accent: '#a78bfa', strong: '#8b5cf6', name: 'violet' },    // Violet
    { accent: '#34d399', strong: '#10b981', name: 'emerald' },   // Emerald
    { accent: '#f59e0b', strong: '#d97706', name: 'amber' },     // Amber
    { accent: '#ec4899', strong: '#db2777', name: 'pink' },      // Pink
    { accent: '#06b6d4', strong: '#0891b2', name: 'cyan' },      // Cyan
    { accent: '#f97316', strong: '#ea580c', name: 'orange' },    // Orange
    { accent: '#8b5cf6', strong: '#7c3aed', name: 'purple' },    // Purple
    { accent: '#14b8a6', strong: '#0d9488', name: 'teal' },      // Teal
    { accent: '#ef4444', strong: '#dc2626', name: 'red' },       // Red
];

function getColorForCard(cardNumber) {
    const index = (cardNumber - 1) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

export function initializeFloatingCards() {
    const container = document.getElementById('floatingCardsContainer') || document.body;
    
    // Spawn the primary card on init (centered, medium size, visible)
    primaryCard = createFloatingCard({ 
        title: 'Display Card', 
        centered: true, 
        visible: true,
        width: 850,
        height: 500
    });
    
    if (primaryCard) {
        container.appendChild(primaryCard);
    }

    // Initialize cards manager UI
    initializeCardsManager();

    // Listen for IPC events if available
    if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.on('display-content', (event, { cardNumber, content }) => {
            const card = getCardByNumber(cardNumber);
            if (card) postMessageToCard(card, content);
        });
        ipcRenderer.on('toggle-display-card', (event, cardNumber) => {
            toggleCardVisibility(cardNumber);
        });
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+N: Create new card
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNewFloatingCard();
        }
        // Escape: close focused card
        if (e.key === 'Escape') {
            const focused = document.querySelector('.floating-card:focus-within');
            if (focused) focused.remove();
        }
    });
}

// ==================== CARD CREATION ====================
export function createFloatingCard(options = {}) {
    const template = document.getElementById('floatingCardTemplate');
    if (!template) {
        console.error('floatingCardTemplate not found');
        return null;
    }
    
    const card = template.content.firstElementChild.cloneNode(true);
    const {
        title = 'Display Card',
        centered = false,
        visible = true,
        width = 850,
        height = 500
    } = options;

    // Assign unique ID and card number
    const cardNumber = nextCardNumber++;
    const id = `floatingCard_${cardNumber}_${Date.now()}`;
    card.id = id;
    card.dataset.cardNumber = String(cardNumber);
    cardRegistry.set(cardNumber, card);

    // Apply color from palette
    const color = getColorForCard(cardNumber);
    card.style.setProperty('--sp-accent', color.accent);
    card.style.setProperty('--sp-accent-strong', color.strong);
    card.dataset.colorTheme = color.name;

    // Set title and badge
    const titleEl = card.querySelector('.floating-card-title');
    if (titleEl) {
        addNumberBadge(titleEl, cardNumber);
        titleEl.append(` ${title}`);
    }

    // Set size
    card.style.width = `${width}px`;
    card.style.height = `${height}px`;

    // Position: centered or staggered
    if (centered) {
        centerCard(card);
    } else {
        // Stagger new cards slightly offset from center
        const offset = (cardNumber - 1) * 30;
        card.style.left = `calc(50% - ${width/2}px + ${offset}px)`;
        card.style.top = `calc(50% - ${height/2}px + ${offset}px)`;
    }

    // Visibility
    card.style.display = visible ? 'flex' : 'none';

    // Wire up controls
    setupCardControls(card, cardNumber);
    
    // Install drag & resize behaviors
    setupDraggable(card);
    setupResizable(card);
    setupExpandCollapse(card);
    
    // Focus stacking
    addFocusStacking(card);
    bringToFront(card);

    return card;
}

// Public API for creating new cards (used by buttons and shortcuts)
export function createNewFloatingCard(options = {}) {
    const container = document.getElementById('floatingCardsContainer') || document.body;
    const newCard = createFloatingCard({
        title: options.title || `Card ${nextCardNumber}`,
        centered: false,
        visible: true,
        width: options.width || 850,
        height: options.height || 500
    });
    
    if (newCard) {
        container.appendChild(newCard);
        bringToFront(newCard);
        
        // Smooth fade-in
        newCard.style.opacity = '0';
        newCard.style.transform = 'scale(0.95)';
        requestAnimationFrame(() => {
            newCard.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            newCard.style.opacity = '1';
            newCard.style.transform = 'scale(1)';
        });
        
        // Update cards manager
        updateCardsManager();
    }
    
    return newCard;
}

function setupCardControls(card, cardNumber) {
    const createBtn = card.querySelector('.floating-card-create-btn');
    const iframeToggleBtn = card.querySelector('.floating-card-iframe-toggle-btn');
    const expandBtn = card.querySelector('.floating-card-expand-btn');
    const hideBtn = card.querySelector('.floating-card-hide-btn');
    const closeBtn = card.querySelector('.floating-card-close');
    const iframe = card.querySelector('iframe');
    
    // Initially visible
    if (iframe) {
        iframe.classList.add('visible');
        iframe.classList.remove('hidden');
    }
    
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            createNewFloatingCard();
        });
    }
    
    if (iframeToggleBtn && iframe) {
        iframeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = iframe.classList.contains('visible');
            
            if (isVisible) {
                // Hide iframe
                iframe.classList.remove('visible');
                iframe.classList.add('hidden');
                iframeToggleBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                `;
                iframeToggleBtn.title = 'Show Content';
            } else {
                // Show iframe
                iframe.classList.remove('hidden');
                iframe.classList.add('visible');
                iframeToggleBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
                iframeToggleBtn.title = 'Hide Content';
            }
        });
    }
    
    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpand(card, expandBtn);
        });
    }
    
    if (hideBtn) {
        hideBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideCard(card, cardNumber);
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fadeOutAndRemove(card, cardNumber);
        });
    }
    
    // Double-click header to expand/collapse
    const header = card.querySelector('.floating-card-header');
    if (header) {
        header.addEventListener('dblclick', () => {
            toggleExpand(card, expandBtn);
        });
    }
}

// ==================== POSITIONING ====================
function centerCard(card) {
    const width = parseFloat(card.style.width) || 850;
    const height = parseFloat(card.style.height) || 500;
    card.style.left = `calc(50% - ${width/2}px)`;
    card.style.top = `calc(50% - ${height/2}px)`;
}

export function centerCardSmooth(card) {
    if (!card) return;
    card.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    centerCard(card);
    setTimeout(() => {
        card.style.transition = '';
    }, 400);
}

// ==================== EXPAND / COLLAPSE ====================
function toggleExpand(card, expandBtn) {
    const isExpanded = card.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse to default size
        card.classList.remove('expanded');
        card.style.width = '850px';
        card.style.height = '500px';
        
        if (expandBtn) {
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
            expandBtn.title = 'Expand';
        }
    } else {
        // Expand to larger size
        card.classList.add('expanded');
        card.style.width = '1200px';
        card.style.height = '700px';
        
        if (expandBtn) {
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 3H3v6M21 9V3h-6M3 15v6h6M15 21h6v-6"/>
                </svg>
            `;
            expandBtn.title = 'Collapse';
        }
    }
    
    // Re-center after expand/collapse
    centerCardSmooth(card);
}

function setupExpandCollapse(card) {
    // Already handled in setupCardControls
}

// ==================== DRAGGING (IMPROVED - CURSOR MUST STAY IN HEADER) ====================
function setupDraggable(card) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const header = card.querySelector('.floating-card-header');
    if (!header) return;
    
    header.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on buttons
        if (e.target.closest('button')) return;
        
        isDragging = true;
        card.classList.add('dragging');
        bringToFront(card);
        
        startX = e.clientX;
        startY = e.clientY;
        const rect = card.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        e.preventDefault();
        document.body.style.userSelect = 'none';
        header.style.cursor = 'grabbing';
    });
    
    // Mouse move - attached to document for smooth tracking
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        // Check if cursor is still reasonably close to the header
        // Allow some tolerance for smooth dragging
        const headerRect = header.getBoundingClientRect();
        const tolerance = 50; // pixels
        const isNearHeader = (
            e.clientY >= headerRect.top - tolerance &&
            e.clientY <= headerRect.bottom + tolerance &&
            e.clientX >= headerRect.left - tolerance &&
            e.clientX <= headerRect.right + tolerance
        );
        
        // If cursor leaves header area, stop dragging
        if (!isNearHeader) {
            endDrag();
            return;
        }
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const newX = initialX + deltaX;
        const newY = initialY + deltaY;
        
        // Constrain to viewport
        const maxX = window.innerWidth - card.offsetWidth;
        const maxY = window.innerHeight - card.offsetHeight;
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        card.style.left = constrainedX + 'px';
        card.style.top = constrainedY + 'px';
    };
    
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            card.classList.remove('dragging');
            header.style.cursor = 'grab';
            document.body.style.userSelect = '';
        }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', endDrag);
    
    // Also stop on mouse leave from window
    document.addEventListener('mouseleave', endDrag);
}

// ==================== RESIZING (IMPROVED - CURSOR MUST STAY NEAR EDGES) ====================
function setupResizable(card) {
    const handles = card.querySelectorAll('.resize-handle');
    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, initialX, initialY, initialWidth, initialHeight;
    let activeHandle = null;
    const minSize = 300;
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            activeHandle = handle;
            resizeDirection = Array.from(handle.classList).find(c => c.startsWith('resize-'));
            card.classList.add('resizing');
            bringToFront(card);
            
            startX = e.clientX;
            startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            initialWidth = rect.width;
            initialHeight = rect.height;
            
            document.body.style.userSelect = 'none';
            document.body.style.cursor = window.getComputedStyle(handle).cursor;
        });
    });
    
    const handleMouseMove = (e) => {
        if (!isResizing || !activeHandle) return;
        
        // Check if cursor is still reasonably close to the card edges
        const cardRect = card.getBoundingClientRect();
        const tolerance = 100; // pixels tolerance from card edges
        const isNearCard = (
            e.clientX >= cardRect.left - tolerance &&
            e.clientX <= cardRect.right + tolerance &&
            e.clientY >= cardRect.top - tolerance &&
            e.clientY <= cardRect.bottom + tolerance
        );
        
        // If cursor leaves card area with tolerance, stop resizing
        if (!isNearCard) {
            endResize();
            return;
        }
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newX = initialX;
        let newY = initialY;
        let newWidth = initialWidth;
        let newHeight = initialHeight;
        
        // Apply resize based on direction
        switch (resizeDirection) {
            case 'resize-nw':
                newWidth = initialWidth - deltaX;
                newHeight = initialHeight - deltaY;
                newX = initialX + deltaX;
                newY = initialY + deltaY;
                break;
            case 'resize-n':
                newHeight = initialHeight - deltaY;
                newY = initialY + deltaY;
                break;
            case 'resize-ne':
                newWidth = initialWidth + deltaX;
                newHeight = initialHeight - deltaY;
                newY = initialY + deltaY;
                break;
            case 'resize-e':
                newWidth = initialWidth + deltaX;
                break;
            case 'resize-se':
                newWidth = initialWidth + deltaX;
                newHeight = initialHeight + deltaY;
                break;
            case 'resize-s':
                newHeight = initialHeight + deltaY;
                break;
            case 'resize-sw':
                newWidth = initialWidth - deltaX;
                newHeight = initialHeight + deltaY;
                newX = initialX + deltaX;
                break;
            case 'resize-w':
                newWidth = initialWidth - deltaX;
                newX = initialX + deltaX;
                break;
        }
        
        // Apply minimum size constraints
        if (newWidth >= minSize) {
            card.style.width = newWidth + 'px';
            if (resizeDirection.includes('w')) {
                card.style.left = newX + 'px';
            }
        }
        if (newHeight >= minSize) {
            card.style.height = newHeight + 'px';
            if (resizeDirection.includes('n')) {
                card.style.top = newY + 'px';
            }
        }
        
        // Constrain to viewport
        const rect = card.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            card.style.width = (window.innerWidth - rect.left) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            card.style.height = (window.innerHeight - rect.top) + 'px';
        }
    };
    
    function endResize() {
        if (isResizing) {
            isResizing = false;
            resizeDirection = '';
            activeHandle = null;
            card.classList.remove('resizing');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', endResize);
    document.addEventListener('mouseleave', endResize);
}

// ==================== FOCUS STACKING ====================
function bringToFront(card) {
    zCounter += 1;
    card.style.zIndex = String(zCounter);
}

function addFocusStacking(card) {
    ['mousedown', 'touchstart', 'focusin'].forEach(evt => {
        card.addEventListener(evt, () => bringToFront(card));
    });
}

// ==================== CARD REGISTRY ====================
function addNumberBadge(titleElement, number) {
    const badge = document.createElement('span');
    badge.className = 'floating-card-number-badge';
    badge.textContent = String(number);
    titleElement.prepend(badge);
}

export function getCardByNumber(number) {
    return cardRegistry.get(Number(number)) || null;
}

export function getPrimaryCard() {
    return primaryCard;
}

// ==================== VISIBILITY ====================
export function toggleCardVisibility(cardNumber) {
    const card = getCardByNumber(cardNumber);
    if (!card) return;
    
    if (card.style.display === 'none') {
        showCard(card, cardNumber);
    } else {
        hideCard(card, cardNumber);
    }
}

export function hideCard(card, cardNumber) {
    if (!card) return;
    card.style.display = 'none';
    card.dataset.hidden = 'true';
    updateCardsManager();
}

export function showCard(card, cardNumber) {
    if (!card) return;
    card.style.display = 'flex';
    card.dataset.hidden = 'false';
    bringToFront(card);
    centerCardSmooth(card);
    updateCardsManager();
}

function fadeOutAndRemove(card, cardNumber) {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.remove();
        cardRegistry.delete(cardNumber);
        
        // If we removed the primary card, promote the next one
        if (card === primaryCard) {
            primaryCard = cardRegistry.values().next().value || null;
        }
        
        // Update cards manager
        updateCardsManager();
    }, 300);
}

// ==================== MESSAGING ====================
export function postMessageToCard(card, messageData) {
    if (!card) return false;
    const iframe = card.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return false;
    
    try {
        const origin = iframe.src && iframe.src.startsWith('http') 
            ? new URL(iframe.src).origin 
            : '*';
        iframe.contentWindow.postMessage({ 
            type: 'chat-input-message', 
            payload: messageData 
        }, origin);
        return true;
    } catch (e) {
        try {
            iframe.contentWindow.postMessage({ 
                type: 'chat-input-message', 
                payload: messageData 
            }, '*');
            return true;
        } catch {
            return false;
        }
    }
}

export function routeMessageToCard(messageData, number) {
    const card = getCardByNumber(number);
    if (!card) return false;
    
    // Show and center the target card
    if (card.style.display === 'none') {
        showCard(card, number);
    } else {
        centerCardSmooth(card);
        bringToFront(card);
    }
    
    return postMessageToCard(card, messageData);
}

// ==================== CARDS MANAGER UI ====================
let cardsManagerVisible = false;

export function initializeCardsManager() {
    const managerBtn = document.getElementById('cardsManagerButton');
    const manager = document.getElementById('floatingCardsManager');
    const showAllBtn = document.getElementById('showAllCardsBtn');
    const hideAllBtn = document.getElementById('hideAllCardsBtn');
    const createNewBtn = document.getElementById('createNewCardBtn');
    const cardsGrid = document.getElementById('cardsGrid');

    if (!manager || !managerBtn) return;

    // Toggle cards manager visibility
    managerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCardsManager();
    });

    // Show all cards
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            cardRegistry.forEach((card, number) => {
                showCard(card, number);
            });
        });
    }

    // Hide all cards
    if (hideAllBtn) {
        hideAllBtn.addEventListener('click', () => {
            cardRegistry.forEach((card, number) => {
                hideCard(card, number);
            });
        });
    }

    // Create new card
    if (createNewBtn) {
        createNewBtn.addEventListener('click', () => {
            const newCard = createNewFloatingCard();
            if (newCard) {
                updateCardsManager();
            }
        });
    }

    // Initialize with current cards
    updateCardsManager();

    // Close manager when clicking outside
    document.addEventListener('click', (e) => {
        if (cardsManagerVisible && 
            !manager.contains(e.target) && 
            !managerBtn.contains(e.target)) {
            hideCardsManager();
        }
    });

    // Position manager above chat input
    positionCardsManager();
    window.addEventListener('resize', positionCardsManager);
}

function toggleCardsManager() {
    if (cardsManagerVisible) {
        hideCardsManager();
    } else {
        showCardsManager();
    }
}

function showCardsManager() {
    const manager = document.getElementById('floatingCardsManager');
    if (!manager) return;

    cardsManagerVisible = true;
    manager.style.display = 'block';
    manager.classList.add('visible');
    
    if (cardRegistry.size > 0) {
        manager.classList.add('has-cards');
    }
    
    updateCardsManager();
    positionCardsManager();
}

function hideCardsManager() {
    const manager = document.getElementById('floatingCardsManager');
    if (!manager) return;

    cardsManagerVisible = false;
    manager.classList.remove('visible');
    
    setTimeout(() => {
        if (!cardsManagerVisible) {
            manager.style.display = 'none';
        }
    }, 300);
}

function positionCardsManager() {
    const manager = document.getElementById('floatingCardsManager');
    const chatInput = document.querySelector('.chat-input-container');
    
    if (!manager || !chatInput) return;

    const chatInputRect = chatInput.getBoundingClientRect();
    const managerHeight = manager.offsetHeight || 100;
    
    // Position above chat input with some spacing
    manager.style.bottom = `${window.innerHeight - chatInputRect.top + 8}px`;
}

export function updateCardsManager() {
    const manager = document.getElementById('floatingCardsManager');
    const cardsGrid = document.getElementById('cardsGrid');
    
    if (!manager || !cardsGrid) return;

    // Clear existing previews
    cardsGrid.innerHTML = '';

    // Add preview for each card
    cardRegistry.forEach((card, number) => {
        const preview = createCardPreview(card, number);
        cardsGrid.appendChild(preview);
    });

    // Update visibility
    if (cardRegistry.size > 0) {
        manager.classList.add('has-cards');
    } else {
        manager.classList.remove('has-cards');
    }

    // Reposition
    positionCardsManager();
}

function createCardPreview(card, number) {
    const preview = document.createElement('div');
    preview.className = 'card-preview-item';
    preview.dataset.cardNumber = number;
    
    const isHidden = card.style.display === 'none' || card.dataset.hidden === 'true';
    if (isHidden) preview.classList.add('hidden');

    // Get card color
    const color = getColorForCard(number);
    preview.style.setProperty('--sp-accent', color.accent);
    preview.style.setProperty('--sp-accent-strong', color.strong);

    // Get card title
    const titleEl = card.querySelector('.floating-card-title');
    const titleText = titleEl ? titleEl.textContent.trim().replace(/^\d+\s*/, '') : `Card ${number}`;

    preview.innerHTML = `
        <div class="card-preview-header">
            <span class="card-preview-badge">${number}</span>
        </div>
        <div class="card-preview-title">${titleText}</div>
        <div class="card-preview-status">${isHidden ? 'Hidden' : 'Visible'}</div>
        <div class="card-preview-actions">
            <button class="card-preview-action-btn show" title="${isHidden ? 'Show' : 'Focus'}" data-action="toggle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${isHidden 
                        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                        : '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>'}
                </svg>
            </button>
            <button class="card-preview-action-btn close" title="Close" data-action="close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    // Click on preview to focus/show card
    preview.addEventListener('click', (e) => {
        if (e.target.closest('.card-preview-action-btn')) return;
        
        if (isHidden) {
            showCard(card, number);
        } else {
            centerCardSmooth(card);
            bringToFront(card);
        }
    });

    // Action buttons
    const toggleBtn = preview.querySelector('[data-action="toggle"]');
    const closeBtn = preview.querySelector('[data-action="close"]');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCardVisibility(number);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fadeOutAndRemove(card, number);
        });
    }

    return preview;
}

