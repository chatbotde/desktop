/**
 * Clickthrough Types
 * TypeScript type definitions for clickthrough module
 */

/**
 * Clickthrough state
 */
export interface ClickthroughState {
  enabled: boolean;
}

/**
 * Clickthrough event detail
 */
export interface ClickthroughEventDetail {
  enabled: boolean;
}

/**
 * Clickthrough message types
 */
export type ClickthroughAction = 'enable' | 'disable' | 'toggle' | 'get-state';

/**
 * Clickthrough message
 */
export interface ClickthroughMessage {
  type: 'clickthrough-control';
  action: ClickthroughAction;
  data?: any;
}

/**
 * Clickthrough state message
 */
export interface ClickthroughStateMessage {
  type: 'clickthrough-state';
  enabled: boolean;
}
