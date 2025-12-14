/**
 * Active Window Monitor
 * Monitors active window changes and checks against blocked applications
 */

import { EventEmitter } from 'events';
import { BlockManager } from './BlockManager';

// Use existing TSF focus tracker (native) to avoid ffi-napi issues.
// At runtime this resolves to: dist/tsf/tsf-manager.js
import { tsfManager, FocusInfo as TsfFocusInfo } from '../tsf/tsf-manager';

export interface FocusInfo {
  // Keep this shape compatible with TSF FocusInfo
  processName: string;
  windowTitle: string;
  processId: number;
  isEditable: boolean;
}

export class ActiveWindowMonitor extends EventEmitter {
  private blockManager: BlockManager;
  private isMonitoring: boolean = false;
  private lastProcessName: string | null = null;
  private checkInterval: number = 500; // ms
  private onFocusChangedBound: ((focusInfo: TsfFocusInfo) => void) | null = null;

  constructor(blockManager: BlockManager) {
    super();
    this.blockManager = blockManager;
  }

  /**
   * Start monitoring active window
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Ensure TSF focus monitoring is running (it is usually started by initializeTsf())
    // but calling again is safe.
    try {
      tsfManager.startFocusMonitoring(this.checkInterval);
    } catch {
      // ignore
    }

    this.onFocusChangedBound = (focusInfo: TsfFocusInfo) => {
      this.handleFocusChange(focusInfo);
    };

    tsfManager.on('focus-changed', this.onFocusChangedBound);

    console.log('ActiveWindowMonitor: Started monitoring active windows');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.onFocusChangedBound) {
      tsfManager.off('focus-changed', this.onFocusChangedBound);
      this.onFocusChangedBound = null;
    }

    console.log('ActiveWindowMonitor: Stopped monitoring');
  }

  /**
   * Handle focus change event
   */
  private handleFocusChange(focusInfo: TsfFocusInfo): void {
    const { processName, windowTitle } = focusInfo;

    // Skip if it's our own process
    if (processName.toLowerCase().includes('electron') || 
        processName.toLowerCase().includes('buddy')) {
      return;
    }

    // Check if this is a blocked app
    const isBlocked = this.blockManager.isAppBlocked(processName, windowTitle);

    // Update lock status in BlockManager
    this.blockManager.updateLockStatus(processName, windowTitle);

    // Emit events
    if (isBlocked) {
      if (this.lastProcessName !== processName) {
        this.emit('blocked-app-active', { processName, windowTitle });
        console.log(`ActiveWindowMonitor: Blocked app became active: ${processName}`);
      }
    } else {
      if (this.lastProcessName && this.blockManager.isAppBlocked(this.lastProcessName)) {
        this.emit('blocked-app-inactive', { processName: this.lastProcessName });
        console.log(`ActiveWindowMonitor: Blocked app became inactive: ${this.lastProcessName}`);
      }
    }

    this.lastProcessName = processName;
  }

  /**
   * Set check interval
   */
  setCheckInterval(interval: number): void {
    this.checkInterval = Math.max(100, interval); // Minimum 100ms
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current monitoring status
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}


