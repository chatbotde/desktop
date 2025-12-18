/**
 * IPC Handler Registry
 * Centralized IPC handler registration and management
 * Follows: Single Responsibility Principle (SRP)
 */

import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron';

type HandlerType = 'handle' | 'on';

type IpcHandler = 
  | ((event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any)
  | ((event: IpcMainEvent, ...args: any[]) => void);

interface HandlerInfo {
  handler: IpcHandler;
  type: HandlerType;
}

export class IpcHandlerRegistry {
  private handlers: Map<string, HandlerInfo>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register an IPC handler
   * @param channel - IPC channel name
   * @param handler - Handler function
   * @param type - Handler type ('on' or 'handle')
   */
  register(channel: string, handler: IpcHandler, type: HandlerType = 'handle'): boolean {
    if (this.handlers.has(channel)) {
      console.warn(`IpcHandlerRegistry: Handler for ${channel} already registered`);
      return false;
    }

    if (type === 'handle') {
      ipcMain.handle(channel, handler as (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any);
    } else if (type === 'on') {
      ipcMain.on(channel, handler as (event: IpcMainEvent, ...args: any[]) => void);
    } else {
      throw new Error(`Unknown handler type: ${type}`);
    }

    this.handlers.set(channel, { handler, type });
    console.log(`IpcHandlerRegistry: Registered ${type} handler for ${channel}`);
    return true;
  }

  /**
   * Unregister an IPC handler
   * @param channel - IPC channel name
   */
  unregister(channel: string): boolean {
    const handlerInfo = this.handlers.get(channel);
    if (!handlerInfo) {
      return false;
    }

    if (handlerInfo.type === 'handle') {
      ipcMain.removeHandler(channel);
    } else {
      ipcMain.removeAllListeners(channel);
    }

    this.handlers.delete(channel);
    console.log(`IpcHandlerRegistry: Unregistered handler for ${channel}`);
    return true;
  }

  /**
   * Unregister all handlers
   */
  unregisterAll(): void {
    for (const [channel, info] of this.handlers) {
      if (info.type === 'handle') {
        ipcMain.removeHandler(channel);
      } else {
        ipcMain.removeAllListeners(channel);
      }
    }
    this.handlers.clear();
    console.log('IpcHandlerRegistry: Unregistered all handlers');
  }

  /**
   * Check if handler is registered
   * @param channel - IPC channel name
   * @returns True if registered
   */
  isRegistered(channel: string): boolean {
    return this.handlers.has(channel);
  }

  /**
   * Get all registered handlers
   * @returns Map of registered handlers
   */
  getRegisteredHandlers(): Map<string, HandlerInfo> {
    return new Map(this.handlers);
  }
}
