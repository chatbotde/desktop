// Minimal extraction to keep original behavior
let zCounter = 3000; // keep cards below chat UI (chat-input is 50000)
const cardRegistry = new Map(); // number -> element
let nextCardNumber = 5; // dynamic cards numbering starts after 4
export function initializeFloatingCards() {
    for (let i = 1; i <= 4; i++) {
        initializeFloatingCard(i);
        initializeEnhancedFloatingCard(i);
        const el = document.getElementById(`floatingCard${i}`);
        if (el) registerCardNumber(el, i);
    }
    // Wire "new card" buttons on the 4 base cards
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`newFloatingCard${i}`)?.addEventListener('click', (e) => {
            e.stopPropagation();
            createNewFloatingCard();
        });
    }

    if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.on('display-content', (event, { cardNumber, content }) => displayContent(cardNumber, content));
        ipcRenderer.on('request-display-content', (event, cardNumber) => refreshDisplay(cardNumber));
        ipcRenderer.on('toggle-display-card', (event, cardNumber) => toggleFloatingCard(cardNumber));
    }
    // Keyboard shortcuts (Ctrl+1..4)
    document.addEventListener('keydown', (e) => {
        if (!e.ctrlKey) return;
        const n = Number(e.key);
        if ([1,2,3,4].includes(n)) {
            e.preventDefault();
            toggleFloatingCard(n);
        }
    });
}

export function initializeFloatingCard(cardNumber) {
    const floatingCard = document.getElementById(`floatingCard${cardNumber}`);
    const toggleButton = document.getElementById(`floatingCardToggleButton${cardNumber}`);
    const closeButton = document.getElementById(`closeFloatingCard${cardNumber}`);
    const iframeToggleButton = document.getElementById(`iframeToggleFloatingCard${cardNumber}`);
    
    if (!floatingCard || !toggleButton || !closeButton) return;
    
    toggleButton.addEventListener('click', () => toggleFloatingCard(cardNumber));
    closeButton.addEventListener('click', () => hideFloatingCard(cardNumber));

    // Focus stacking: clicking/focusing brings card to front
    addFocusStacking(floatingCard);
    
    // Add iframe visibility toggle functionality
    if (iframeToggleButton) {
        iframeToggleButton.addEventListener('click', () => toggleIframeVisibility(cardNumber));
        
        // Initialize iframe visibility state
        const iframe = floatingCard.querySelector('iframe');
        if (iframe) {
            if (iframeVisible[cardNumber]) {
                iframe.classList.add('visible');
                iframe.classList.remove('hidden');
            } else {
                iframe.classList.add('hidden');
                iframe.classList.remove('visible');
            }
        }
    }
}

const visible = { 1: false, 2: false, 3: false, 4: false };
const iframeVisible = { 1: true, 2: true, 3: true, 4: true };

export function toggleFloatingCard(cardNumber) { if (visible[cardNumber]) hideFloatingCard(cardNumber); else showFloatingCard(cardNumber); }
export function showFloatingCard(cardNumber) { const el = document.getElementById(`floatingCard${cardNumber}`); if (el) { el.style.display = 'flex'; visible[cardNumber] = true; } }
export function hideFloatingCard(cardNumber) { const el = document.getElementById(`floatingCard${cardNumber}`); if (el) { el.style.display = 'none'; visible[cardNumber] = false; } }


export function toggleIframeVisibility(cardNumber) {
    const floatingCard = document.getElementById(`floatingCard${cardNumber}`);
    const iframe = floatingCard?.querySelector('iframe');
    const toggleButton = document.getElementById(`iframeToggleFloatingCard${cardNumber}`);
    
    if (!iframe || !toggleButton) return;
    
    if (iframeVisible[cardNumber]) {
        // Hide iframe
        iframe.classList.remove('visible');
        iframe.classList.add('hidden');
        iframeVisible[cardNumber] = false;
        
        // Update button icon to show "eye with slash" (hidden state)
        toggleButton.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        // Show iframe
        iframe.classList.remove('hidden');
        iframe.classList.add('visible');
        iframeVisible[cardNumber] = true;
        
        // Update button icon to show "eye" (visible state)
        toggleButton.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
}



// ==================== DRAGGABLE AND RESIZABLE ====================
function setupDraggableCard(card) {
    let isDragging = false;
    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, initialX, initialY, initialWidth, initialHeight;
    let animationFrameId = null;
    const minimum_size = 200; // Minimum size of the card

    // Get the header element for dragging (like window title bar)
    const headerElement = card.querySelector('.floating-card-header');
    
    // Dragging via entire header (like window title bar)
    if (headerElement) {
        headerElement.addEventListener('mousedown', (e) => {
            // Don't start drag if clicking on buttons
            if (e.target.closest('button')) return;
            
            isDragging = true;
            card.classList.add('dragging');
            bringToFront(card);
            startX = e.clientX; 
            startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left; 
            initialY = rect.top;
            
            // Prevent text selection during drag
            e.preventDefault();
            e.stopPropagation();
            
            // Add smooth cursor transition
            card.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        });
    }

    // Improved resizing via resize handles
    const resizeHandles = card.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            resizeDirection = handle.className.split(' ')[1];
            card.classList.add('resizing');
            bringToFront(card);
            
            startX = e.clientX; 
            startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left; 
            initialY = rect.top; 
            initialWidth = rect.width; 
            initialHeight = rect.height;
            
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
        });
    });

    // Smooth mousemove with requestAnimationFrame
    function handleMouseMove(e) {
        if (!isDragging && !isResizing) return;
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const newX = initialX + deltaX;
                const newY = initialY + deltaY;
                
                // Constrain to viewport
                const maxX = window.innerWidth - card.offsetWidth;
                const maxY = window.innerHeight - card.offsetHeight;
                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));
                
                // Apply smooth positioning
                card.style.left = constrainedX + 'px';
                card.style.top = constrainedY + 'px';
                card.style.right = 'auto';
                card.style.bottom = 'auto';
            } else if (isResizing) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                let newX = initialX;
                let newY = initialY;
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                
                // Apply resize logic based on direction
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
                if (newWidth > minimum_size) {
                    card.style.width = newWidth + 'px';
                    if (resizeDirection.includes('w')) {
                        card.style.left = newX + 'px';
                    }
                }
                if (newHeight > minimum_size) {
                    card.style.height = newHeight + 'px';
                    if (resizeDirection.includes('n')) {
                        card.style.top = newY + 'px';
                    }
                }
                
                // Ensure card stays within viewport bounds
                const rect = card.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    const overflow = rect.right - window.innerWidth;
                    card.style.width = (parseFloat(card.style.width) - overflow) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    const overflow = rect.bottom - window.innerHeight;
                    card.style.height = (parseFloat(card.style.height) - overflow) + 'px';
                }
                if (rect.left < 0) {
                    const overflow = Math.abs(rect.left);
                    card.style.width = (parseFloat(card.style.width) - overflow) + 'px';
                    card.style.left = '0px';
                }
                if (rect.top < 0) {
                    const overflow = Math.abs(rect.top);
                    card.style.height = (parseFloat(card.style.height) - overflow) + 'px';
                    card.style.top = '0px';
                }
            }
        });
    }

    document.addEventListener('mousemove', handleMouseMove);

    function endDrag() {
        if (isDragging) {
            isDragging = false;
            card.classList.remove('dragging');
            card.style.cursor = 'grab';
            document.body.style.userSelect = '';
        }
        if (isResizing) {
            isResizing = false;
            resizeDirection = '';
            card.classList.remove('resizing');
            document.body.style.userSelect = '';
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mouseleave', endDrag);

    // Touch support
    if (headerElement) {
        headerElement.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            
            isDragging = true;
            card.classList.add('dragging');
            bringToFront(card);
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            e.preventDefault();
        });
    }
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging && !isResizing) return;
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', { 
            clientX: touch.clientX, 
            clientY: touch.clientY 
        });
        handleMouseMove(mouseEvent);
        e.preventDefault();
    });
    
    document.addEventListener('touchend', endDrag);
}

// ==================== EXPAND / COLLAPSE ====================
function setupExpandCollapse(card) {
    const expandBtn = card.querySelector('.floating-card-expand-btn');
    if (!expandBtn) return;
    let isExpanded = false;
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isExpanded) {
            card.classList.remove('expanded');
            card.classList.add('collapsed');
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
        } else {
            card.classList.remove('collapsed');
            card.classList.add('expanded');
            expandBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 9h6v6H9z"/>
                    <path d="M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
        }
        isExpanded = !isExpanded;
    });
}

function initializeEnhancedFloatingCard(cardNumber) {
    const floatingCard = document.getElementById(`floatingCard${cardNumber}`);
    if (!floatingCard) return;
    setupDraggableCard(floatingCard);
    setupExpandCollapse(floatingCard);
    addFocusStacking(floatingCard);
}

// ==================== FOCUS STACKING ====================
function bringToFront(card) {
    zCounter += 1;
    card.style.zIndex = String(zCounter);
}

function addFocusStacking(card) {
    ['mousedown','touchstart','focusin'].forEach(evt => {
        card.addEventListener(evt, () => bringToFront(card));
    });
}

// ==================== DYNAMIC CARD CREATION ====================
export function createNewFloatingCard(options = {}) {
    const template = document.getElementById('floatingCardTemplate');
    if (!template) return null;
    const content = template.content.firstElementChild.cloneNode(true);
    const container = document.body;

    // Assign a unique id and position offset to avoid overlap
    const id = `floatingCardDynamic_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    content.id = id;

    // Assign a card number and register
    const assignedNumber = nextCardNumber++;
    registerCardNumber(content, assignedNumber);

    // Optional: set title/content based on current input
    const titleEl = content.querySelector('.floating-card-title');
    const currentInput = document.getElementById('messageInput')?.value?.trim();
    if (options.title) {
        titleEl.textContent = options.title;
    } else if (currentInput) {
        titleEl.textContent = currentInput.slice(0, 48);
    } else {
        titleEl.textContent = 'New Card';
    }

    // Wire close
    content.querySelector('.floating-card-close')?.addEventListener('click', () => {
        content.remove();
    });

    // Wire new (spawn from dynamic card as well)
    content.querySelector('.floating-card-new-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        createNewFloatingCard();
    });

    // Wire iframe toggle state (default visible)
    const iframe = content.querySelector('iframe');
    const iframeToggle = content.querySelector('.floating-card-iframe-toggle-btn');
    if (iframe && iframeToggle) {
        iframe.classList.add('visible');
        iframe.classList.remove('hidden');
        iframeToggle.addEventListener('click', () => {
            if (iframe.classList.contains('visible')) {
                iframe.classList.remove('visible');
                iframe.classList.add('hidden');
                iframeToggle.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                `;
            } else {
                iframe.classList.add('visible');
                iframe.classList.remove('hidden');
                iframeToggle.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
            }
        });
    }

    // Install behaviors
    setupDraggableCard(content);
    setupExpandCollapse(content);
    addFocusStacking(content);
    bringToFront(content);

    container.appendChild(content);
    return content;
}

// ==================== CARD REGISTRY AND BADGE ====================
function registerCardNumber(card, number) {
    card.dataset.cardNumber = String(number);
    cardRegistry.set(number, card);
    addOrUpdateNumberBadge(card, number);
}

function addOrUpdateNumberBadge(card, number) {
    const header = card.querySelector('.floating-card-header');
    if (!header) return;
    let badge = header.querySelector('.floating-card-number-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'floating-card-number-badge';
        header.insertBefore(badge, header.firstChild);
    }
    badge.textContent = String(number);
}

export function getCardByNumber(number) {
    return cardRegistry.get(Number(number)) || null;
}

// Post message to a card's iframe
function postMessageToCard(card, messageData) {
    if (!card) return false;
    const iframe = card.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return false;
    try {
        const origin = iframe.src && iframe.src.startsWith('http') ? new URL(iframe.src).origin : '*';
        iframe.contentWindow.postMessage({ type: 'chat-input-message', payload: messageData }, origin);
        return true;
    } catch (e) {
        try { iframe.contentWindow.postMessage({ type: 'chat-input-message', payload: messageData }, '*'); return true; } catch { return false; }
    }
}

export function routeMessageToCard(messageData, number) {
    const card = getCardByNumber(number);
    if (!card) return false;
    bringToFront(card);
    return postMessageToCard(card, messageData);
}


