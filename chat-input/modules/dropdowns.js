import { dom } from './dom.js';
import { geometryController } from './geometry.js';

export function hideDropdown(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    dropdown.style.display = 'none';
    dropdown.setAttribute('aria-hidden', 'true');
}

export function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dd => hideDropdown(dd.id));
}

export function showDropdownAdvanced(dropdownId, triggerButton, options = {}) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || !triggerButton) return;
    hideAllDropdowns();
    dropdown.style.display = 'block';
    dropdown.setAttribute('aria-hidden', 'false');
    geometryController.positionDropdownAdvanced(dropdown, triggerButton, {
        preferredPosition: options.position || 'below',
        offset: options.offset || 8,
        margin: options.margin || 20,
        constrainToScreen: options.constrainToScreen !== false,
        preferAbove: options.preferAbove || false
    });
    setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
}

function handleClickOutside(event) {
    const dropdowns = document.querySelectorAll('.dropdown-menu:not([aria-hidden="true"])');
    let inside = false;
    dropdowns.forEach(d => { if (d.contains(event.target)) inside = true; });
    if (!inside) {
        hideAllDropdowns();
        document.removeEventListener('click', handleClickOutside);
    }
}

export function wireDropdownButtons() {
    dom.uploadButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('uploadDropdown', dom.uploadButton); });
    dom.captureButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('captureDropdown', dom.captureButton); });
    dom.modelSelectButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('modelSelectDropdown', dom.modelSelectButton); });
    dom.expandedPlusButton?.addEventListener('click', (e) => { e.stopPropagation(); showDropdownAdvanced('plusActionsDropdown', dom.expandedPlusButton); });
}


