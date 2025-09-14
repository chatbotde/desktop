import { dom } from './dom.js';
import { state } from './state.js';

export function initializeContainerDrag() {
    if (!dom.chatInputContainer) return;

    // Reset to default bottom-center position at start
    resetToDefaultPosition();

    // Re-init on resize to keep within bounds
    window.addEventListener('resize', () => {
        clampWithinViewport();
    });

    dom.chatInputContainer.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('input') || e.target.closest('.dropdown-menu')) {
            return;
        }
        state.isContainerDragging = true;
        const rect = dom.chatInputContainer.getBoundingClientRect();
        state.containerDragOffset.x = e.clientX - rect.left;
        state.containerDragOffset.y = e.clientY - rect.top;
        dom.chatInputContainer.classList.add('dragging');
        dom.chatInputContainer.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!state.isContainerDragging) return;
        const newX = e.clientX - state.containerDragOffset.x;
        const newY = e.clientY - state.containerDragOffset.y;

        const containerWidth = dom.chatInputContainer.offsetWidth;
        const containerHeight = dom.chatInputContainer.offsetHeight;
        const margin = 10;
        const minX = margin;
        const maxX = window.innerWidth - containerWidth - margin;
        const minY = margin;
        const maxY = window.innerHeight - containerHeight - margin;

        const constrainedX = Math.max(minX, Math.min(newX, maxX));
        const constrainedY = Math.max(minY, Math.min(newY, maxY));

        dom.chatInputContainer.style.left = constrainedX + 'px';
        dom.chatInputContainer.style.top = constrainedY + 'px';
        dom.chatInputContainer.style.bottom = 'auto';
        dom.chatInputContainer.style.transform = 'none';
    });

    function endDrag() {
        if (state.isContainerDragging) {
            state.isContainerDragging = false;
            dom.chatInputContainer.classList.remove('dragging');
            dom.chatInputContainer.style.cursor = 'move';
            document.body.style.userSelect = '';
        }
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mouseleave', endDrag);
}

function resetToDefaultPosition() {
    dom.chatInputContainer.style.left = '50%';
    dom.chatInputContainer.style.top = 'auto';
    dom.chatInputContainer.style.bottom = '20px';
    dom.chatInputContainer.style.transform = 'translateX(-50%)';
}

function clampWithinViewport() {
    const rect = dom.chatInputContainer.getBoundingClientRect();
    const margin = 10;
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
    }
}


