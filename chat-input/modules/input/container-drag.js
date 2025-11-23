import { dom } from '../core/dom.js';
import { state } from '../core/state.js';

// Expose updateHideButtonPosition globally so other modules can use it
function updateHideButtonPosition() {
    const hideButton = dom.hideChatButton;
    if (!hideButton || !dom.chatInputContainer) return;
    
    const containerRect = dom.chatInputContainer.getBoundingClientRect();
    const buttonWidth = 36;
    const gap = 10;
    
    hideButton.style.position = 'fixed';
    hideButton.style.left = (containerRect.left - buttonWidth - gap) + 'px';
    hideButton.style.top = (containerRect.top + containerRect.height / 2) + 'px';
    hideButton.style.transform = 'translateY(-50%)';
    
    // Add 'positioned' class to show the button after positioning
    hideButton.classList.add('positioned');
}

// Make it accessible globally
window.updateHideButtonPosition = updateHideButtonPosition;

export function initializeContainerDrag() {
    if (!dom.chatInputContainer) return;

    // Don't reset position - let CSS handle initial centering
    // resetToDefaultPosition(); // REMOVED - CSS centers it now
    
    // Initial position update for hide button after a brief delay to ensure DOM is ready
    setTimeout(() => {
        updateHideButtonPosition();
    }, 100);

    // Re-init on resize to keep within bounds and update button position
    window.addEventListener('resize', () => {
        clampWithinViewport();
        updateHideButtonPosition();
    });

    // Double-click detection variables
    let lastClickTime = 0;
    let clickTimer = null;
    const doubleClickThreshold = 300; // 300ms for double-click detection

    dom.chatInputContainer.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('input') || e.target.closest('.dropdown-menu')) {
            return;
        }

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
            state.isContainerDragging = true;
            const rect = dom.chatInputContainer.getBoundingClientRect();
            state.containerDragOffset.x = e.clientX - rect.left;
            state.containerDragOffset.y = e.clientY - rect.top;
            dom.chatInputContainer.classList.add('dragging');
            dom.chatInputContainer.classList.add('drag-enabled');
            document.body.style.userSelect = 'none';
            e.preventDefault();
        } else {
            // Single click - set timer for potential double-click
            clickTimer = setTimeout(() => {
                // This was just a single click, do nothing special
                clickTimer = null;
            }, doubleClickThreshold);
        }

        lastClickTime = currentTime;
    });

    document.addEventListener('mousemove', (e) => {
        if (!state.isContainerDragging) return;
        const newX = e.clientX - state.containerDragOffset.x;
        const newY = e.clientY - state.containerDragOffset.y;

        const containerWidth = dom.chatInputContainer.offsetWidth;
        const containerHeight = dom.chatInputContainer.offsetHeight;
        const margin = 0;
        const minX = margin;
        const maxX = window.innerWidth - containerWidth - margin;
        const minY = margin;
        const maxY = window.innerHeight - containerHeight - margin;

        const constrainedX = Math.max(minX, Math.min(newX, maxX));
        const constrainedY = Math.max(minY, Math.min(newY, maxY));

        const bottomY = window.innerHeight - constrainedY - containerHeight;

        dom.chatInputContainer.style.left = constrainedX + 'px';
        dom.chatInputContainer.style.top = 'auto';
        dom.chatInputContainer.style.bottom = bottomY + 'px';
        dom.chatInputContainer.style.transform = 'none';
        
        // Update hide button position to follow the container
        updateHideButtonPosition();
    });

    function endDrag() {
        if (state.isContainerDragging) {
            state.isContainerDragging = false;
            dom.chatInputContainer.classList.remove('dragging');
            dom.chatInputContainer.classList.remove('drag-enabled');
            document.body.style.userSelect = '';
        }
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mouseleave', endDrag);
}

function resetToDefaultPosition() {
    // Reset to center position
    dom.chatInputContainer.style.left = '50%';
    dom.chatInputContainer.style.top = '50%';
    dom.chatInputContainer.style.bottom = 'auto';
    dom.chatInputContainer.style.transform = 'translate(-50%, -50%)';
    updateHideButtonPosition();
}

function clampWithinViewport() {
    const rect = dom.chatInputContainer.getBoundingClientRect();
    const margin = 0;
    let left = rect.left;
    let top = rect.top;
    const width = rect.width;
    const height = rect.height;
    const maxX = window.innerWidth - width - margin;
    const maxY = window.innerHeight - height - margin;
    if (left < margin || top < margin || left > maxX || top > maxY) {
        left = Math.max(margin, Math.min(left, maxX));
        top = Math.max(margin, Math.min(top, maxY));
        dom.chatInputContainer.style.left = left + 'px';
        dom.chatInputContainer.style.top = top + 'px';
        dom.chatInputContainer.style.bottom = 'auto';
        dom.chatInputContainer.style.transform = 'none';
        updateHideButtonPosition();
    }
}


