/**
 * Electron Adapter
 * 
 * Abstracts Electron APIs to allow easy replacement or mocking.
 * This makes the codebase more testable and allows swapping Electron
 * for other desktop frameworks if needed.
 * 
 * @example
 * ```ts
 * // Use adapter instead of direct electron calls
 * await electronAdapter.clipboard.writeText('Hello')
 * 
 * // Easy to mock for testing
 * electronAdapter.clipboard.writeText = vi.fn()
 * ```
 */

/**
 * Electron Adapter Interface
 */
export interface IElectronAdapter {
  clipboard: {
    readText(): Promise<string>
    writeText(text: string): Promise<void>
    readImage(): Promise<string | null> // Returns base64 image data
    writeImage(imageData: string): Promise<void>
  }
  window: {
    minimize(): void
    maximize(): void
    close(): void
    isMaximized(): boolean
    isMinimized(): boolean
    setSize(width: number, height: number): void
    setPosition(x: number, y: number): void
    getPosition(): Promise<{ x: number; y: number }>
    getSize(): Promise<{ width: number; height: number }>
  }
  dialog: {
    showOpenDialog(options?: {
      title?: string
      filters?: Array<{ name: string; extensions: string[] }>
      properties?: string[]
    }): Promise<string[] | null>
    showSaveDialog(options?: {
      title?: string
      defaultPath?: string
      filters?: Array<{ name: string; extensions: string[] }>
    }): Promise<string | null>
  }
  ipc: {
    invoke(channel: string, ...args: any[]): Promise<any>
    send(channel: string, ...args: any[]): void
    on(channel: string, handler: (...args: any[]) => void): () => void
  }
  screen: {
    getPrimaryDisplay(): Promise<{
      bounds: { x: number; y: number; width: number; height: number }
      scaleFactor: number
    }>
    getAllDisplays(): Promise<Array<{
      bounds: { x: number; y: number; width: number; height: number }
      scaleFactor: number
    }>>
  }
  app: {
    getVersion(): string
    getName(): string
    getPath(name: string): Promise<string>
    quit(): void
  }
}

/**
 * Electron Adapter Implementation
 */
class ElectronAdapter implements IElectronAdapter {
  private get electron() {
    if (typeof window === 'undefined') {
      return null
    }
    return (window as any).electron
  }

  clipboard = {
    readText: async (): Promise<string> => {
      if (this.electron?.clipboard?.readText) {
        return await this.electron.clipboard.readText()
      }
      // Fallback to browser clipboard API
      try {
        return await navigator.clipboard.readText()
      } catch {
        return ''
      }
    },

    writeText: async (text: string): Promise<void> => {
      if (this.electron?.clipboard?.writeText) {
        await this.electron.clipboard.writeText(text)
      } else {
        // Fallback to browser clipboard API
        try {
          await navigator.clipboard.writeText(text)
        } catch (error) {
          console.error('Failed to write to clipboard:', error)
        }
      }
    },

    readImage: async (): Promise<string | null> => {
      if (this.electron?.clipboard?.readImage) {
        return await this.electron.clipboard.readImage()
      }
      return null
    },

    writeImage: async (imageData: string): Promise<void> => {
      if (this.electron?.clipboard?.writeImage) {
        await this.electron.clipboard.writeImage(imageData)
      }
    },
  }

  window = {
    minimize: (): void => {
      this.electron?.window?.minimize?.()
    },

    maximize: (): void => {
      this.electron?.window?.maximize?.()
    },

    close: (): void => {
      this.electron?.window?.close?.()
    },

    isMaximized: (): boolean => {
      return this.electron?.window?.isMaximized?.() ?? false
    },

    isMinimized: (): boolean => {
      return this.electron?.window?.isMinimized?.() ?? false
    },

    setSize: (width: number, height: number): void => {
      this.electron?.window?.setSize?.(width, height)
    },

    setPosition: (x: number, y: number): void => {
      this.electron?.window?.setPosition?.(x, y)
    },

    getPosition: async (): Promise<{ x: number; y: number }> => {
      if (this.electron?.window?.getPosition) {
        return await this.electron.window.getPosition()
      }
      return { x: 0, y: 0 }
    },

    getSize: async (): Promise<{ width: number; height: number }> => {
      if (this.electron?.window?.getSize) {
        return await this.electron.window.getSize()
      }
      return { width: window.innerWidth, height: window.innerHeight }
    },
  }

  dialog = {
    showOpenDialog: async (options?: {
      title?: string
      filters?: Array<{ name: string; extensions: string[] }>
      properties?: string[]
    }): Promise<string[] | null> => {
      if (this.electron?.dialog?.showOpenDialog) {
        return await this.electron.dialog.showOpenDialog(options)
      }
      // Fallback to browser file input
      return null
    },

    showSaveDialog: async (options?: {
      title?: string
      defaultPath?: string
      filters?: Array<{ name: string; extensions: string[] }>
    }): Promise<string | null> => {
      if (this.electron?.dialog?.showSaveDialog) {
        return await this.electron.dialog.showSaveDialog(options)
      }
      return null
    },
  }

  ipc = {
    invoke: async (channel: string, ...args: any[]): Promise<any> => {
      if (this.electron?.ipc?.invoke) {
        return await this.electron.ipc.invoke(channel, ...args)
      }
      throw new Error(`IPC channel "${channel}" not available`)
    },

    send: (channel: string, ...args: any[]): void => {
      this.electron?.ipc?.send?.(channel, ...args)
    },

    on: (channel: string, handler: (...args: any[]) => void): (() => void) => {
      if (this.electron?.ipc?.on) {
        this.electron.ipc.on(channel, handler)
        return () => {
          this.electron?.ipc?.off?.(channel, handler)
        }
      }
      return () => {}
    },
  }

  screen = {
    getPrimaryDisplay: async (): Promise<{
      bounds: { x: number; y: number; width: number; height: number }
      scaleFactor: number
    }> => {
      if (this.electron?.screen?.getPrimaryDisplay) {
        return await this.electron.screen.getPrimaryDisplay()
      }
      return {
        bounds: {
          x: 0,
          y: 0,
          width: window.screen.width,
          height: window.screen.height,
        },
        scaleFactor: window.devicePixelRatio,
      }
    },

    getAllDisplays: async (): Promise<Array<{
      bounds: { x: number; y: number; width: number; height: number }
      scaleFactor: number
    }>> => {
      if (this.electron?.screen?.getAllDisplays) {
        return await this.electron.screen.getAllDisplays()
      }
      return [
        {
          bounds: {
            x: 0,
            y: 0,
            width: window.screen.width,
            height: window.screen.height,
          },
          scaleFactor: window.devicePixelRatio,
        },
      ]
    },
  }

  app = {
    getVersion: (): string => {
      return this.electron?.app?.getVersion?.() ?? '1.0.0'
    },

    getName: (): string => {
      return this.electron?.app?.getName?.() ?? 'App'
    },

    getPath: async (name: string): Promise<string> => {
      if (this.electron?.app?.getPath) {
        return await this.electron.app.getPath(name)
      }
      return ''
    },

    quit: (): void => {
      this.electron?.app?.quit?.()
    },
  }
}

/**
 * Global Electron adapter instance
 */
export const electronAdapter: IElectronAdapter = new ElectronAdapter()

