import { dom } from '../core/dom.js';
import { geometryController } from '../core/geometry.js';

export function hideDropdown(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    dropdown.classList.remove('open');
    dropdown.style.display = 'none';
    dropdown.setAttribute('aria-hidden', 'true');
    
}

export function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dd => hideDropdown(dd.id));
    
    // Remove all event listeners when hiding dropdowns
    document.removeEventListener('click', handleClickOutside, true);
    document.removeEventListener('keydown', handleEscapeKey);
}

export function showDropdownAdvanced(dropdownId, triggerButton, options = {}) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || !triggerButton) return;
    hideAllDropdowns();
    
    // Special handling for model selector - position above chat input
    if (dropdownId === 'modelSelectDropdown') {
        // Position dropdown - no backdrop needed
        dropdown.style.display = 'block';
        dropdown.setAttribute('aria-hidden', 'false');
    } else {
        // Normal dropdown positioning for others
        dropdown.style.display = 'block';
        dropdown.setAttribute('aria-hidden', 'false');
        geometryController.positionDropdownAdvanced(dropdown, triggerButton, {
            preferredPosition: options.position || 'below',
            offset: options.offset || 8,
            margin: options.margin || 20,
            constrainToScreen: options.constrainToScreen !== false,
            preferAbove: options.preferAbove || false
        });
    }
    
    // next tick to allow CSS transitions
    requestAnimationFrame(() => dropdown.classList.add('open'));
    
    // Add click outside listeners with a small delay to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true);
        document.addEventListener('keydown', handleEscapeKey);
    }, 50);
}

function handleClickOutside(event) {
    const dropdowns = document.querySelectorAll('.dropdown-menu.open');
    if (dropdowns.length === 0) {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        return;
    }
    
    let inside = false;
    dropdowns.forEach(d => { 
        if (d.contains(event.target)) inside = true; 
    });
    
    if (!inside) {
        hideAllDropdowns();
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        hideAllDropdowns();
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

export function wireDropdownButtons() {
    dom.uploadButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('uploadDropdown', dom.uploadButton); });
    dom.captureButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('captureDropdown', dom.captureButton); });
    dom.modelSelectButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('modelSelectDropdown', dom.modelSelectButton); });
    // In expanded state, toggle inline action buttons instead of floating dropdown
    const expandedDial = document.getElementById('expandedSpeedDial');
    if (expandedDial && dom.expandedPlusButton) {
        const closeSubmenus = (dial) => {
            dial?.querySelector('.upload-submenu')?.classList.remove('open');
            dial?.querySelector('.capture-submenu')?.classList.remove('open');
        };
        const openDial = () => { 
            // Ensure other dropdowns are closed to keep UI cohesive
            const opens = document.querySelectorAll('.dropdown-menu.open');
            opens.forEach(el => { el.classList.remove('open'); el.style.display = 'none'; el.setAttribute('aria-hidden','true'); });
            expandedDial.classList.add('open'); 
            expandedDial.setAttribute('aria-hidden', 'false'); 
        };
        const closeDial = () => { expandedDial.classList.remove('open'); expandedDial.setAttribute('aria-hidden', 'true'); closeSubmenus(expandedDial); };
        const toggleDial = () => { if (expandedDial.classList.contains('open')) closeDial(); else openDial(); };

        dom.expandedPlusButton.addEventListener('click', (e) => { e.stopPropagation(); toggleDial(); });
        document.addEventListener('click', (e) => { if (!expandedDial.contains(e.target) && e.target !== dom.expandedPlusButton) closeDial(); });

        // Handle actions similar to collapsed dial
        expandedDial.addEventListener('click', (e) => {
            const item = e.target.closest('.speed-item');
            if (!item) return;
            e.stopPropagation();
            const action = item.getAttribute('data-action');
            item.style.transform = 'scale(0.94)'; setTimeout(() => { item.style.transform = ''; }, 120);
            switch (action) {
                case 'upload':
                    expandedDial.querySelector('.capture-submenu')?.classList.remove('open');
                    const eu = expandedDial.querySelector('.upload-submenu');
                    if (eu) {
                        const top = item.offsetTop + (item.offsetHeight/2) - (eu.offsetHeight/2);
                        eu.style.top = `${Math.max(0, top)}px`;
                        eu.classList.toggle('open');
                    }
                    break;
                case 'capture':
                    expandedDial.querySelector('.upload-submenu')?.classList.remove('open');
                    const ec = expandedDial.querySelector('.capture-submenu');
                    if (ec) {
                        const top2 = item.offsetTop + (item.offsetHeight/2) - (ec.offsetHeight/2);
                        ec.style.top = `${Math.max(0, top2)}px`;
                        ec.classList.toggle('open');
                    }
                    break;
                case 'theme':
                    import('./theme.js').then(m => m.toggleTheme());
                    closeDial();
                    break;
                case 'collapse':
                    import('./expand-collapse.js').then(m => m.collapseUI());
                    closeDial();
                    break;
            }
        });

        expandedDial.addEventListener('click', (e) => {
            const sub = e.target.closest('.submenu-item');
            if (!sub) return; e.stopPropagation();
            const subaction = sub.getAttribute('data-subaction');
            import('../capture/uploads-capture.js').then(m => {
                switch (subaction) {
                    case 'upload-image': m.handleImageUpload(); break;
                    case 'upload-video': m.handleVideoUpload(); break;
                    case 'upload-audio': m.handleAudioUpload(); break;
                    case 'desktop-capture': m.handleDesktopCapture(); break;
                    case 'area-screenshot': m.handleAreaScreenshot(); break;
                    case 'audio-capture': m.handleAudioCapture(); break;
                    case 'capture-video': m.handleVideoCapture(); break;
                }
            });
            closeSubmenus(expandedDial); closeDial();
        });
    }
}


