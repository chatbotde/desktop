/**
 * Block Storage
 * Persistent storage for blocked applications
 */

let Store: any = null;
try {
  Store = require('electron-store');
  // Handle both default export and named export
  if (Store.default) {
    Store = Store.default;
  }
} catch (error) {
  // Store will remain null, fallback to in-memory
}

interface BlockStorageData {
  blockedApps: string[];
  lockEnabled: boolean;
}

const defaultData: BlockStorageData = {
  blockedApps: [],
  lockEnabled: true,
};

let store: any = null;

if (Store) {
  try {
    store = new Store({
      name: 'block-settings',
      defaults: defaultData,
    });
    console.log('BlockStorage: Using electron-store for persistent storage');
  } catch (error) {
    console.warn('BlockStorage: electron-store not available, using in-memory fallback:', error);
    store = null;
  }
} else {
  console.warn('BlockStorage: electron-store module not found, using in-memory fallback');
  store = null;
}

// In-memory fallback
let memoryStore: BlockStorageData = { ...defaultData };

export class BlockStorage {
  /**
   * Get all blocked apps
   */
  static getBlockedApps(): string[] {
    if (store) {
      return (store.get('blockedApps') as string[]) || [];
    }
    return memoryStore.blockedApps;
  }

  /**
   * Set blocked apps
   */
  static setBlockedApps(apps: string[]): void {
    if (store) {
      store.set('blockedApps', apps);
    } else {
      memoryStore.blockedApps = apps;
    }
  }

  /**
   * Check if lock is enabled
   */
  static isLockEnabled(): boolean {
    if (store) {
      return store.get('lockEnabled', true) as boolean;
    }
    return memoryStore.lockEnabled;
  }

  /**
   * Set lock enabled state
   */
  static setLockEnabled(enabled: boolean): void {
    if (store) {
      store.set('lockEnabled', enabled);
    } else {
      memoryStore.lockEnabled = enabled;
    }
  }

  /**
   * Get all storage data
   */
  static getAllData(): BlockStorageData {
    if (store) {
      return {
        blockedApps: (store.get('blockedApps') as string[]) || [],
        lockEnabled: store.get('lockEnabled', true) as boolean,
      };
    }
    return { ...memoryStore };
  }
}


