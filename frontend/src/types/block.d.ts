/**
 * Block feature type definitions
 */

export interface BlockStatus {
  isLocked: boolean;
  blockedApp?: string;
}

export interface BlockAPIResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}


