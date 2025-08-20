// Window drag functionality
export class DragHandler {
    constructor(elements, state) {
        this.elements = elements;
        this.state = state;
        this.startX = 0;
        this.startY = 0;
        this.lastMoveTime = 0;
        this.draggedElement = null;
        this.init();
    }

    init() {
        this.setupDragHandling();
    }

    setupDragHandling() {
        // Add drag listeners to multiple elements
        const draggableElements = this.elements.getDraggableElements();
        
        draggableElements.forEach(element => {
            if (element) {
                element.addEventListener('mousedown', (e) => {
                    this.startDrag(e, element);
                });
            }
        });

        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', () => {
            this.handleMouseUp();
        });

        // Handle drag leaving window
        document.addEventListener('mouseleave', () => {
            this.handleMouseUp();
        });
    }

    // Function to start dragging
    startDrag(e, element) {
        // Don't start drag if clicking on buttons
        if (e.target.closest('.action-btn')) {
            return false;
        }

        this.state.isDragging = true;
        this.draggedElement = element;
        this.startX = e.screenX;
        this.startY = e.screenY;
        
        element.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
        return true;
    }

    // Handle mouse move during drag
    handleMouseMove(e) {
        if (!this.state.isDragging || !this.draggedElement) return;
        
        // Throttle move events for better performance
        const now = Date.now();
        if (now - this.lastMoveTime < 16) return; // ~60fps
        this.lastMoveTime = now;
        
        const deltaX = e.screenX - this.startX;
        const deltaY = e.screenY - this.startY;
        
        if (window.chatInputAPI?.setWindowPosition) {
            window.chatInputAPI.setWindowPosition(deltaX, deltaY);
        }
        
        // Update start position for next move
        this.startX = e.screenX;
        this.startY = e.screenY;
        
        e.preventDefault();
    }

    // Handle mouse up to end drag
    handleMouseUp() {
        if (this.state.isDragging && this.draggedElement) {
            this.state.isDragging = false;
            this.draggedElement.style.cursor = 'move';
            document.body.style.userSelect = '';
            this.draggedElement = null;
        }
    }
}
