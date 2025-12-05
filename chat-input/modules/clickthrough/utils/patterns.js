/**
 * UI Detection Patterns
 * Contains pattern definitions for automatic UI element detection
 * Following Single Responsibility Principle (SRP)
 */

/**
 * Patterns to identify UI elements automatically
 */
export const UI_PATTERNS = {
  // Class name patterns that suggest UI elements
  classPatterns: [
    /container$/i,
    /wrapper$/i,
    /modal$/i,
    /dialog$/i,
    /dropdown$/i,
    /menu$/i,
    /panel$/i,
    /sidebar$/i,
    /toolbar$/i,
    /button$/i,
    /input$/i,
    /card$/i,
    /popup$/i,
    /overlay$/i,
    /tooltip$/i
  ],
  
  // Data attributes that indicate interactivity
  dataAttributes: [
    'data-action',
    'data-clickable',
    'data-interactive',
    'data-ui',
    'data-component',
    'data-testid'
  ],
  
  // ARIA roles that indicate interactive elements
  ariaRoles: [
    'button',
    'menuitem',
    'link',
    'tab',
    'checkbox',
    'radio',
    'switch',
    'textbox',
    'searchbox',
    'combobox',
    'listbox',
    'menu',
    'menubar',
    'tablist',
    'dialog',
    'alertdialog',
    'toolbar',
    'tooltip'
  ],
  
  // Interactive HTML element tags
  interactiveElements: [
    'BUTTON',
    'INPUT',
    'TEXTAREA',
    'SELECT',
    'A',
    'VIDEO',
    'AUDIO',
    'CANVAS'
  ]
};
