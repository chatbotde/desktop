/**
 * Block Manager
 * Manages blocked applications list
 * Checks if current active window matches blocked items
 */

import { EventEmitter } from 'events';
import { BlockStorage } from './block-storage';

export interface BlockStatus {
  isLocked: boolean;
  blockedApp?: string;
}

export class BlockManager extends EventEmitter {
  private blockedApps: Set<string> = new Set();
  private lockEnabled: boolean = true;
  private currentLockStatus: BlockStatus = { isLocked: false };

  constructor() {
    super();
    this.loadFromStorage();
  }

  /**
   * Load blocked items from storage
   */
  private loadFromStorage(): void {
    const data = BlockStorage.getAllData();
    this.blockedApps = new Set(data.blockedApps);
    this.lockEnabled = data.lockEnabled;
    console.log('BlockManager: Loaded', this.blockedApps.size, 'blocked apps');
  }

  /**
   * Add a blocked application
   */
  addBlockedApp(processName: string): boolean {
    const normalized = this.normalizeProcessName(processName);
    if (this.blockedApps.has(normalized)) {
      return false;
    }
    this.blockedApps.add(normalized);
    this.saveToStorage();
    this.emit('blocked-apps-changed', Array.from(this.blockedApps));
    return true;
  }

  /**
   * Remove a blocked application
   */
  removeBlockedApp(processName: string): boolean {
    const normalized = this.normalizeProcessName(processName);
    if (!this.blockedApps.has(normalized)) {
      return false;
    }
    this.blockedApps.delete(normalized);
    this.saveToStorage();
    this.emit('blocked-apps-changed', Array.from(this.blockedApps));
    return true;
  }

  /**
   * Check if an application is blocked
   */
  isAppBlocked(processName: string, _windowTitle?: string): boolean {
    if (!this.lockEnabled) {
      return false;
    }
    const normalized = this.normalizeProcessName(processName);
    return this.blockedApps.has(normalized);
  }

  /**
   * Get all blocked apps
   */
  getBlockedApps(): string[] {
    return Array.from(this.blockedApps);
  }

  /**
   * Set lock enabled state
   */
  setLockEnabled(enabled: boolean): void {
    this.lockEnabled = enabled;
    BlockStorage.setLockEnabled(enabled);
    this.emit('lock-enabled-changed', enabled);
    // Re-check lock status after enabling/disabling
    const currentStatus = this.getLockStatus();
    if (currentStatus.isLocked && !enabled) {
      // If lock was disabled and we were locked, unlock
      this.currentLockStatus = { isLocked: false };
      this.emit('lock-status-changed', this.currentLockStatus);
    }
  }

  /**
   * Check if lock is enabled
   */
  isLockEnabled(): boolean {
    return this.lockEnabled;
  }

  /**
   * Update lock status based on current active app
   */
  updateLockStatus(processName?: string, windowTitle?: string): void {
    const previousStatus = { ...this.currentLockStatus };
    let isLocked = false;
    let blockedApp: string | undefined;

    if (processName && this.isAppBlocked(processName, windowTitle)) {
      isLocked = true;
      blockedApp = processName;
    }

    this.currentLockStatus = {
      isLocked,
      blockedApp,
    };

    // Emit event if status changed
    if (previousStatus.isLocked !== isLocked) {
      this.emit('lock-status-changed', this.currentLockStatus);
    }
  }

  /**
   * Get current lock status
   */
  getLockStatus(): BlockStatus {
    return { ...this.currentLockStatus };
  }

  /**
   * Normalize process name for comparison (case-insensitive)
   */
  private normalizeProcessName(processName: string): string {
    return processName.toLowerCase().trim();
  }

  /**
   * Save to storage
   */
  private saveToStorage(): void {
    BlockStorage.setBlockedApps(Array.from(this.blockedApps));
  }
}


