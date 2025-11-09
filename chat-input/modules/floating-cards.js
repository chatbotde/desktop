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
    { accent: '#84cc16', strong: '#65a30d', name: 'lime' },      // Lime
    { accent: '#06d6a0', strong: '#059669', name: 'mint' },      // Mint
    { accent: '#ff6b6b', strong: '#e03131', name: 'coral' },     // Coral
    { accent: '#4dabf7', strong: '#228be6', name: 'sky' },       // Sky
    { accent: '#69db7c', strong: '#51cf66', name: 'green' },     // Green
    { accent: '#ffd43b', strong: '#fab005', name: 'yellow' },    // Yellow
    { accent: '#ff8cc8', strong: '#e64980', name: 'rose' },      // Rose
    { accent: '#9775fa', strong: '#7950f2', name: 'indigo' },    // Indigo
    { accent: '#20c997', strong: '#12b886', name: 'seafoam' },   // Seafoam
    { accent: '#fd7e14', strong: '#e8590c', name: 'tangerine' }, // Tangerine
    { accent: '#495057', strong: '#343a40', name: 'slate' },     // Slate
    { accent: '#6f42c1', strong: '#5a3396', name: 'plum' },      // Plum
    { accent: '#fd79a8', strong: '#e84393', name: 'magenta' },   // Magenta
    { accent: '#00cec9', strong: '#00b894', name: 'turquoise' }, // Turquoise
    { accent: 'rgb(2, 6, 23)', strong: 'rgb(1, 3, 12)', name: 'midnight' },     // Dark blue-black
    { accent: 'rgb(3, 7, 18)', strong: 'rgb(1, 4, 10)', name: 'charcoal' },     // Dark charcoal
    { accent: 'rgb(15, 15, 15)', strong: 'rgb(8, 8, 8)', name: 'obsidian' },    // Near black
    { accent: 'rgb(23, 23, 23)', strong: 'rgb(12, 12, 12)', name: 'onyx' },     // Dark gray
];

function getColorForCard(cardNumber) {
    const index = (cardNumber - 1) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

export function initializeFloatingCards() {
    const container = document.getElementById('floatingCardsContainer') || document.body;
    
    // Spawn the primary card on init (centered, medium size, visible)
    primaryCard = createFloatingCard({ 
        title: '', 
        centered: true, 
        visible: true,
        width: 400,
        height: 400
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
        // Escape: close focused card (except card 1)
        if (e.key === 'Escape') {
            const focused = document.querySelector('.floating-card:focus-within');
            if (focused) {
                const cardNumber = Number(focused.dataset.cardNumber);
                if (cardNumber !== 1) {
                    focused.remove();
                }
            }
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

    // Set iframe src dynamically based on environment
    const iframe = card.querySelector('iframe');
    if (iframe && window.electronAPI && window.electronAPI.getFrontendURL) {
        window.electronAPI.getFrontendURL().then(url => {
            console.log(`Setting card ${cardNumber} iframe to:`, url);
            iframe.src = url;
        }).catch(err => {
            console.error(`Failed to get frontend URL for card ${cardNumber}:`, err);
            // Fallback to development URL
            iframe.src = 'http://localhost:5173';
        });
    }

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
    const newChatBtn = card.querySelector('.floating-card-new-chat-btn');
    const createBtn = card.querySelector('.floating-card-create-btn');
    const iframeToggleBtn = card.querySelector('.floating-card-iframe-toggle-btn');
    const expandBtn = card.querySelector('.floating-card-expand-btn');
    const hideBtn = card.querySelector('.floating-card-hide-btn');
    const closeBtn = card.querySelector('.floating-card-close');
    const settingsBtn = card.querySelector('.floating-card-settings-btn');
    const settingsMenu = card.querySelector('.floating-card-menu');
    const iframe = card.querySelector('iframe');
    
    // Initially visible
    if (iframe) {
        iframe.classList.add('visible');
        iframe.classList.remove('hidden');
    }
    
    if (newChatBtn) {
        newChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Clear the iframe content by reloading it
            if (iframe && iframe.src) {
                iframe.src = iframe.src;
            }
        });
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
        // Hide close button for card #1
        if (cardNumber === 1) {
            closeBtn.style.display = 'none';
        }
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Prevent closing card 1 (primary card)
            if (cardNumber === 1) {
                return;
            }
            fadeOutAndRemove(card, cardNumber);
        });
    }
    // Settings button and menu actions
    if (settingsBtn && settingsMenu) {
        // Toggle menu visibility
        const toggleMenu = (show) => {
            const shouldShow = show ?? settingsMenu.hasAttribute('hidden');
            if (shouldShow) {
                settingsMenu.removeAttribute('hidden');
                settingsMenu.setAttribute('aria-hidden', 'false');
            } else {
                settingsMenu.setAttribute('hidden', '');
                settingsMenu.setAttribute('aria-hidden', 'true');
            }
        };
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!settingsMenu.hasAttribute('hidden')) {
                if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                    toggleMenu(false);
                }
            }
        });
        // Handle menu actions
        settingsMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('.floating-card-menu-item');
            if (!btn) return;
            e.stopPropagation();
            const action = btn.dataset.action;
            if (action === 'toggle-neutral') {
                const isNeutral = card.classList.toggle('neutral');
                // Persist state on dataset for previews or later use
                card.dataset.neutral = String(isNeutral);
                // Update menu label to reflect current state
                const toggleItem = settingsMenu.querySelector('[data-action="toggle-neutral"]');
                if (toggleItem) {
                    toggleItem.textContent = isNeutral ? 'Use color' : 'No color (neutral)';
                }
                toggleMenu(false);
                updateCardsManager();
            } else if (action === 'next-color') {
                // Cycle color palette index for this card
                const number = Number(card.dataset.cardNumber);
                // Determine current color index based on palette name
                const currentName = card.dataset.colorTheme;
                let index = COLOR_PALETTE.findIndex(c => c.name === currentName);
                if (index < 0) index = (number - 1) % COLOR_PALETTE.length;
                const next = COLOR_PALETTE[(index + 1) % COLOR_PALETTE.length];
                card.style.setProperty('--sp-accent', next.accent);
                card.style.setProperty('--sp-accent-strong', next.strong);
                card.dataset.colorTheme = next.name;
                // If neutral was active, keep it neutral but remember chosen color for when toggled back
                toggleMenu(false);
                updateCardsManager();
            }
        });
    }
    
    // Note: header double-click reserved for enabling drag; do not attach expand/collapse here
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

// ==================== POSITION HELPERS ====================
function isUserPositioned(card) {
    return card && card.dataset.userPositioned === 'true';
}

function markUserPositioned(card) {
    if (card) card.dataset.userPositioned = 'true';
}

function clampCardToViewport(card, margin = 8) {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    let width = rect.width;
    let height = rect.height;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    left = Math.min(Math.max(left, margin), maxLeft);
    top = Math.min(Math.max(top, margin), maxTop);
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
    card.style.bottom = 'auto';
}

function resizeAroundCenter(card, newWidth, newHeight, smooth = true) {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const targetLeft = Math.round(centerX - newWidth / 2);
    const targetTop = Math.round(centerY - newHeight / 2);
    if (smooth) {
        card.style.transition = 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    card.style.width = Math.round(newWidth) + 'px';
    card.style.height = Math.round(newHeight) + 'px';
    card.style.left = targetLeft + 'px';
    card.style.top = targetTop + 'px';
    card.style.bottom = 'auto';
    // Clamp into viewport after sizing
    clampCardToViewport(card);
    if (smooth) {
        setTimeout(() => { card.style.transition = ''; }, 260);
    }
}

// ==================== EXPAND / COLLAPSE ====================
function toggleExpand(card, expandBtn) {
    const isExpanded = card.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse to default size
        card.classList.remove('expanded');
        // If user positioned, keep anchor at current center; otherwise, center
        if (isUserPositioned(card)) {
            resizeAroundCenter(card, 850, 500, true);
        } else {
            card.style.width = '850px';
            card.style.height = '500px';
            centerCardSmooth(card);
        }
        
        if (expandBtn) {
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
            expandBtn.title = 'Expand';
        }
    } else {
        // Expand to larger size but ensure it fits within viewport
        card.classList.add('expanded');
        
        // Calculate max dimensions that fit within viewport
        const maxWidth = Math.min(1200, window.innerWidth - 40);
        const maxHeight = Math.min(700, window.innerHeight - 40);
        
        if (isUserPositioned(card)) {
            resizeAroundCenter(card, maxWidth, maxHeight, true);
        } else {
            card.style.width = maxWidth + 'px';
            card.style.height = maxHeight + 'px';
            centerCardSmooth(card);
        }
        
        // Ensure card stays within viewport after expansion
        setTimeout(() => {
            clampCardToViewport(card, 20);
        }, 250);
        
        if (expandBtn) {
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 3H3v6M21 9V3h-6M3 15v6h6M15 21h6v-6"/>
                </svg>
            `;
            expandBtn.title = 'Collapse';
        }
    }
}

function setupExpandCollapse(card) {
    // Already handled in setupCardControls
}

// ==================== DRAGGING (DOUBLE-CLICK TO ENABLE, CURSOR MUST STAY IN HEADER) ====================
function setupDraggable(card) {
    let isDragging = false;
    let dragEnabled = false;
    let startX, startY, initialX, initialY;
    let lastClickTime = 0;
    let clickTimer = null;
    const doubleClickThreshold = 300; // 300ms for double-click detection
    
    const header = card.querySelector('.floating-card-header');
    if (!header) return;
    
    header.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on buttons
        if (e.target.closest('button')) return;
        
        const currentTime = Date.now();
        const timeDiff = currentTime - lastClickTime;
        
        // Clear any existing timer
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }
        
        // Check if this is a double-click
        if (timeDiff < doubleClickThreshold) {
            // Double-click detected - enable dragging
            dragEnabled = true;
            isDragging = true;
            card.classList.add('dragging');
            card.classList.add('drag-enabled');
            bringToFront(card);
            
            startX = e.clientX;
            startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            e.preventDefault();
            document.body.style.userSelect = 'none';
            header.style.cursor = 'grabbing';
        } else {
            // Single click - set timer for potential double-click
            clickTimer = setTimeout(() => {
                // This was just a single click, do nothing special
                clickTimer = null;
            }, doubleClickThreshold);
            
            // Just bring to front on single click
            bringToFront(card);
        }
        
        lastClickTime = currentTime;
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
        card.style.bottom = 'auto';
    };
    
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            dragEnabled = false;
            card.classList.remove('dragging');
            card.classList.remove('drag-enabled');
            header.style.cursor = 'grab';
            document.body.style.userSelect = '';
            // Remember that the user has manually placed the card
            markUserPositioned(card);
        }
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', endDrag);
    
    // Also stop on mouse leave from window
    document.addEventListener('mouseleave', endDrag);
}

// ==================== RESIZING (ULTRA-SMOOTH WITH RAF & GPU ACCELERATION) ====================
function setupResizable(card) {
    let handles = card.querySelectorAll('.resize-handle');
    if (!handles || handles.length === 0) {
        try {
            console.warn('[FloatingCards] No resize handles found, injecting default handles');
            const dirs = ['nw','n','ne','e','se','s','sw','w'];
            dirs.forEach(d => {
                const h = document.createElement('div');
                h.className = `resize-handle resize-${d}`;
                card.appendChild(h);
            });
            handles = card.querySelectorAll('.resize-handle');
        } catch {}
    }
    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, initialBounds;
    let activeHandle = null;
    let rafId = null;
    let lastMouseEvent = null;
    
    // Configuration
    const config = {
        minWidth: 300,
        minHeight: 200,
        maxWidth: window.innerWidth,
        maxHeight: window.innerHeight,
        snapThreshold: 15, // Snap to edges when within this distance
        smoothness: 0.95, // Smoothing factor for resize calculations
    };
    
    // Initialize resize on handle mousedown
    handles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
    });
    
    function startResize(e) {
        if (e.button !== 0) return; // Only left click
        
        e.preventDefault();
        e.stopPropagation();
        
    isResizing = true;
        activeHandle = e.currentTarget;
        // Determine the specific direction class (exclude the generic 'resize-handle')
        resizeDirection = Array.from(activeHandle.classList).find(
            c => c !== 'resize-handle' && c.startsWith('resize-')
        ) || '';
        if (!resizeDirection) {
            try { console.warn('[FloatingCards] resize direction not found on handle', activeHandle.className); } catch {}
            return;
        }
    try { console.debug('[FloatingCards] resize start', { dir: resizeDirection }); } catch {}
        
        // Bring card to front and add resizing state
        bringToFront(card);
        card.classList.add('resizing');
        
        // Capture initial state
        startX = e.clientX;
        startY = e.clientY;
        const rect = card.getBoundingClientRect();
        initialBounds = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
        };
        
    // Optimize for performance
        document.body.style.userSelect = 'none';
        document.body.style.cursor = window.getComputedStyle(activeHandle).cursor;
        card.style.willChange = 'width, height, transform';
    // Ensure iframe does not swallow mouse events during resize
    const iframe = card.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
        
        // Attach move and end listeners
        // Do not use passive here so we can optionally preventDefault in future
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', endResize);
        document.addEventListener('mouseleave', endResize);
    }
    
    function onMouseMove(e) {
        if (!isResizing) return;
        lastMouseEvent = e;
        
        // Use RAF for smooth 60fps updates
        if (!rafId) {
            rafId = requestAnimationFrame(performResize);
        }
    }
    
    function performResize() {
        rafId = null;
        if (!isResizing || !lastMouseEvent) return;
        
        const e = lastMouseEvent;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Calculate new bounds based on resize direction
        const newBounds = calculateNewBounds(deltaX, deltaY);
        
        // Apply constraints
        const constrainedBounds = applyConstraints(newBounds);
        
        // Apply to DOM with transform for GPU acceleration
        applyBounds(constrainedBounds);
        
        // Continue animation loop if still resizing
        if (isResizing) {
            rafId = requestAnimationFrame(performResize);
        }
    }
    
    function calculateNewBounds(deltaX, deltaY) {
        const bounds = { ...initialBounds };
        
        // Calculate based on resize direction
        const directions = {
            'resize-nw': () => {
                bounds.width = initialBounds.width - deltaX;
                bounds.height = initialBounds.height - deltaY;
                bounds.left = initialBounds.left + deltaX;
                bounds.top = initialBounds.top + deltaY;
            },
            'resize-n': () => {
                bounds.height = initialBounds.height - deltaY;
                bounds.top = initialBounds.top + deltaY;
            },
            'resize-ne': () => {
                bounds.width = initialBounds.width + deltaX;
                bounds.height = initialBounds.height - deltaY;
                bounds.top = initialBounds.top + deltaY;
            },
            'resize-e': () => {
                bounds.width = initialBounds.width + deltaX;
            },
            'resize-se': () => {
                bounds.width = initialBounds.width + deltaX;
                bounds.height = initialBounds.height + deltaY;
            },
            'resize-s': () => {
                bounds.height = initialBounds.height + deltaY;
            },
            'resize-sw': () => {
                bounds.width = initialBounds.width - deltaX;
                bounds.height = initialBounds.height + deltaY;
                bounds.left = initialBounds.left + deltaX;
            },
            'resize-w': () => {
                bounds.width = initialBounds.width - deltaX;
                bounds.left = initialBounds.left + deltaX;
            },
        };
        
        const resizeFunc = directions[resizeDirection];
        if (resizeFunc) resizeFunc();
        
        return bounds;
    }
    
    function applyConstraints(bounds) {
        const constrained = { ...bounds };
        
        // Apply minimum size constraints
        if (constrained.width < config.minWidth) {
            constrained.width = config.minWidth;
            if (resizeDirection.includes('w')) {
                constrained.left = initialBounds.left + initialBounds.width - config.minWidth;
            }
        }
        
        if (constrained.height < config.minHeight) {
            constrained.height = config.minHeight;
            if (resizeDirection.includes('n')) {
                constrained.top = initialBounds.top + initialBounds.height - config.minHeight;
            }
        }
        
        // Apply maximum size constraints (viewport bounds)
        const maxWidth = window.innerWidth - constrained.left;
        const maxHeight = window.innerHeight - constrained.top;
        
        if (constrained.width > maxWidth) {
            constrained.width = maxWidth;
        }
        if (constrained.height > maxHeight) {
            constrained.height = maxHeight;
        }
        
        // Keep within viewport bounds
        if (constrained.left < 0) {
            constrained.width += constrained.left;
            constrained.left = 0;
        }
        if (constrained.top < 0) {
            constrained.height += constrained.top;
            constrained.top = 0;
        }
        
        // Snap to edges when close
        if (Math.abs(constrained.left) < config.snapThreshold) {
            constrained.left = 0;
        }
        if (Math.abs(constrained.top) < config.snapThreshold) {
            constrained.top = 0;
        }
        if (Math.abs(window.innerWidth - (constrained.left + constrained.width)) < config.snapThreshold) {
            constrained.width = window.innerWidth - constrained.left;
        }
        if (Math.abs(window.innerHeight - (constrained.top + constrained.height)) < config.snapThreshold) {
            constrained.height = window.innerHeight - constrained.top;
        }
        
        return constrained;
    }
    
    function applyBounds(bounds) {
        // Use transform for position (GPU accelerated) with smooth interpolation
        const smoothLeft = Math.round(bounds.left);
        const smoothTop = Math.round(bounds.top);
        const smoothWidth = Math.round(bounds.width);
        const smoothHeight = Math.round(bounds.height);
        
        // Apply with smooth transitions
        card.style.left = smoothLeft + 'px';
        card.style.top = smoothTop + 'px';
        card.style.bottom = 'auto';
        card.style.width = smoothWidth + 'px';
        card.style.height = smoothHeight + 'px';
        
        // Mark as user-positioned after any manual resize/move via handles
        markUserPositioned(card);
    }
    
    function endResize() {
        if (!isResizing) return;
        
        isResizing = false;
        lastMouseEvent = null;
        
        // Cancel any pending animation frame
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        
        // Clean up state with smooth transition
        resizeDirection = '';
        activeHandle = null;
        
        // Add a subtle transition back to normal state
        card.style.transition = 'box-shadow 0.2s ease, transform 0.1s ease';
        card.classList.remove('resizing');
        
        // Reset styles after transition
        setTimeout(() => {
            card.style.willChange = '';
            card.style.transition = '';
        }, 200);
        
        const iframe2 = card.querySelector('iframe');
        if (iframe2) iframe2.style.pointerEvents = '';
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Remove event listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', endResize);
        document.removeEventListener('mouseleave', endResize);
    }
    
    // Handle window resize to update max constraints
    window.addEventListener('resize', () => {
        config.maxWidth = window.innerWidth;
        config.maxHeight = window.innerHeight;
    });
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
    // Preserve user placement; only center if never moved
    if (!isUserPositioned(card)) {
        centerCardSmooth(card);
    } else {
        // Clamp to viewport and use a subtle transition
        const prev = card.style.transition;
        card.style.transition = 'left 0.2s ease, top 0.2s ease';
        clampCardToViewport(card);
        setTimeout(() => { card.style.transition = prev; }, 220);
    }
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
        if (!isUserPositioned(card)) {
            centerCardSmooth(card);
        } else {
            bringToFront(card);
            clampCardToViewport(card);
        }
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

    // Get card color (respect per-card override and neutral)
    const isNeutral = card.classList.contains('neutral');
    if (!isNeutral) {
        const themeName = card.dataset.colorTheme;
        const color = COLOR_PALETTE.find(c => c.name === themeName) || getColorForCard(number);
        preview.style.setProperty('--sp-accent', color.accent);
        preview.style.setProperty('--sp-accent-strong', color.strong);
    } else {
        // Use subtle gray accent for preview when neutral
        preview.style.setProperty('--sp-accent', 'rgba(148, 163, 184, 0.5)');
        preview.style.setProperty('--sp-accent-strong', 'rgba(148, 163, 184, 0.7)');
    }

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
            // Prevent closing card 1 (primary card)
            if (number === 1) {
                return;
            }
            fadeOutAndRemove(card, number);
        });
    }

    return preview;
}

