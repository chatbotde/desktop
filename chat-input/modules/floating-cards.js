// Minimal extraction to keep original behavior
export function initializeFloatingCards() {
    for (let i = 1; i <= 4; i++) {
        initializeFloatingCard(i);
        initializeEnhancedFloatingCard(i);
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
    if (!floatingCard || !toggleButton || !closeButton) return;
    toggleButton.addEventListener('click', () => toggleFloatingCard(cardNumber));
    closeButton.addEventListener('click', () => hideFloatingCard(cardNumber));
}

const visible = { 1: false, 2: false, 3: false, 4: false };

export function toggleFloatingCard(cardNumber) { if (visible[cardNumber]) hideFloatingCard(cardNumber); else showFloatingCard(cardNumber); }
export function showFloatingCard(cardNumber) { const el = document.getElementById(`floatingCard${cardNumber}`); if (el) { el.style.display = 'flex'; visible[cardNumber] = true; } }
export function hideFloatingCard(cardNumber) { const el = document.getElementById(`floatingCard${cardNumber}`); if (el) { el.style.display = 'none'; visible[cardNumber] = false; } }

export function displayContent(cardNumber, content) {
    const displayArea = document.getElementById(`floatingCardDisplay${cardNumber}`);
    if (!displayArea) return;
    const placeholder = displayArea.querySelector('.display-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    let wrapper = displayArea.querySelector('.floating-card-content-display');
    if (!wrapper) { wrapper = document.createElement('div'); wrapper.className = 'floating-card-content-display'; displayArea.appendChild(wrapper); }
    if (typeof content === 'string') wrapper.innerHTML = content; else if (typeof content === 'object') {
        if (content.type === 'html') wrapper.innerHTML = content.data; else if (content.type === 'text') wrapper.innerHTML = `<p>${content.data}</p>`; else if (content.type === 'json') wrapper.innerHTML = `<pre><code>${JSON.stringify(content.data, null, 2)}</code></pre>`; else if (content.type === 'markdown') wrapper.innerHTML = content.data.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code>$1</code>').replace(/\n/g, '<br>'); else wrapper.innerHTML = `<pre><code>${JSON.stringify(content, null, 2)}</code></pre>`;
    }
}

export function refreshDisplay(cardNumber) {
    if (window.chatInputAPI?.requestDisplayContent) window.chatInputAPI.requestDisplayContent(cardNumber);
}

// ==================== SMART CLICK-THROUGH FOR CARD ====================
function setupSmartClickThrough(card) {
    let interactionTimeout;
    let isInteracting = false;
    const dragHandle = card.querySelector('.floating-card-drag-handle');
    const handleMouseEnter = () => {
        clearTimeout(interactionTimeout);
        card.classList.add('interacting');
        isInteracting = true;
    };
    const handleMouseLeave = () => {
        interactionTimeout = setTimeout(() => {
            if (!isInteracting) card.classList.remove('interacting');
        }, 1000);
    };
    const targetElement = dragHandle || card;
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mousedown', () => { card.classList.add('interacting'); isInteracting = true; });
    card.addEventListener('focusin', () => { card.classList.add('interacting'); isInteracting = true; });
    card.addEventListener('focusout', () => {
        setTimeout(() => { if (!card.matches(':hover')) { card.classList.remove('interacting'); isInteracting = false; } }, 100);
    });
    document.addEventListener('click', (e) => { if (!card.contains(e.target) && !card.matches(':hover')) { card.classList.remove('interacting'); isInteracting = false; } });
}

// ==================== DRAGGABLE AND RESIZABLE ====================
function setupDraggableCard(card, dragHandle) {
    let isDragging = false;
    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, initialX, initialY, initialWidth, initialHeight;

    // Dragging via drag handle
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            card.classList.add('dragging');
            startX = e.clientX; startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left; initialY = rect.top;
            e.preventDefault(); e.stopPropagation();
        });
    }

    // Resizing via resize handles
    const resizeHandles = card.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeDirection = handle.className.split(' ')[1];
            card.classList.add('resizing');
            startX = e.clientX; startY = e.clientY;
            const rect = card.getBoundingClientRect();
            initialX = rect.left; initialY = rect.top; initialWidth = rect.width; initialHeight = rect.height;
            e.preventDefault(); e.stopPropagation();
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX; const deltaY = e.clientY - startY;
            const newX = initialX + deltaX; const newY = initialY + deltaY;
            const maxX = window.innerWidth - card.offsetWidth; const maxY = window.innerHeight - card.offsetHeight;
            const constrainedX = Math.max(0, Math.min(newX, maxX)); const constrainedY = Math.max(0, Math.min(newY, maxY));
            card.style.left = constrainedX + 'px'; card.style.top = constrainedY + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto';
        } else if (isResizing) {
            const deltaX = e.clientX - startX; const deltaY = e.clientY - startY;
            let newX = initialX; let newY = initialY; let newWidth = initialWidth; let newHeight = initialHeight;
            switch (resizeDirection) {
                case 'resize-nw': newX = initialX + deltaX; newY = initialY + deltaY; newWidth = initialWidth - deltaX; newHeight = initialHeight - deltaY; break;
                case 'resize-n': newY = initialY + deltaY; newHeight = initialHeight - deltaY; break;
                case 'resize-ne': newY = initialY + deltaY; newWidth = initialWidth + deltaX; newHeight = initialHeight - deltaY; break;
                case 'resize-e': newWidth = initialWidth + deltaX; break;
                case 'resize-se': newWidth = initialWidth + deltaX; newHeight = initialHeight + deltaY; break;
                case 'resize-s': newHeight = initialHeight + deltaY; break;
                case 'resize-sw': newX = initialX + deltaX; newWidth = initialWidth - deltaX; newHeight = initialHeight + deltaY; break;
                case 'resize-w': newX = initialX + deltaX; newWidth = initialWidth - deltaX; break;
            }
            const minWidth = 200; const minHeight = 150; const maxWidth = window.innerWidth * 0.8; const maxHeight = window.innerHeight * 0.8;
            newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth)); newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
            if (resizeDirection.includes('w')) newX = initialX + (initialWidth - newWidth);
            if (resizeDirection.includes('n')) newY = initialY + (initialHeight - newHeight);
            const maxX = window.innerWidth - newWidth; const maxY = window.innerHeight - newHeight;
            newX = Math.max(0, Math.min(newX, maxX)); newY = Math.max(0, Math.min(newY, maxY));
            card.style.left = newX + 'px'; card.style.top = newY + 'px'; card.style.width = newWidth + 'px'; card.style.height = newHeight + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) { isDragging = false; card.classList.remove('dragging'); }
        if (isResizing) { isResizing = false; resizeDirection = ''; card.classList.remove('resizing'); }
    });

    // Touch support
    if (dragHandle) {
        dragHandle.addEventListener('touchstart', (e) => {
            isDragging = true; card.classList.add('dragging');
            const touch = e.touches[0]; startX = touch.clientX; startY = touch.clientY;
            const rect = card.getBoundingClientRect(); initialX = rect.left; initialY = rect.top; e.preventDefault();
        });
    }
    document.addEventListener('touchmove', (e) => {
        if (!isDragging && !isResizing) return;
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
        document.dispatchEvent(mouseEvent); e.preventDefault();
    });
    document.addEventListener('touchend', () => {
        if (isDragging) { isDragging = false; card.classList.remove('dragging'); }
        if (isResizing) { isResizing = false; resizeDirection = ''; card.classList.remove('resizing'); }
    });
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
    const dragHandle = floatingCard.querySelector('.floating-card-drag-handle');
    setupSmartClickThrough(floatingCard);
    setupDraggableCard(floatingCard, dragHandle);
    setupExpandCollapse(floatingCard);
}


