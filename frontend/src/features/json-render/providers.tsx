/**
 * JSON Render Providers
 * 
 * Provides DataProvider and ActionProvider for json-render components.
 * These providers enable data binding and action handling in AI-generated UI.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { DataProvider, ActionProvider } from '@json-render/react'

/**
 * Data Context
 * Manages the data store that components can bind to via valuePath
 */
interface DataContextValue {
  data: Record<string, any>
  setData: (path: string, value: any) => void
  getData: (path: string) => any
  updateData: (updates: Record<string, any>) => void
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function useJsonRenderData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useJsonRenderData must be used within JsonRenderDataProvider')
  }
  return context
}

interface JsonRenderDataProviderProps {
  initialData?: Record<string, any>
  children: ReactNode
}

/**
 * JsonRenderDataProvider
 * 
 * Provides a data store that components can read from and write to.
 * Components use valuePath to bind to data (e.g., "/form/email").
 */
export function JsonRenderDataProvider({
  initialData = {},
  children,
}: JsonRenderDataProviderProps) {
  const [data, setDataState] = useState<Record<string, any>>(initialData)

  const setData = useCallback((path: string, value: any) => {
    setDataState((prev) => {
      const newData = { ...prev }
      const keys = path.split('/').filter(Boolean)
      let current = newData

      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key]
      }

      // Set the value
      const lastKey = keys[keys.length - 1]
      current[lastKey] = value

      return newData
    })
  }, [])

  const getData = useCallback(
    (path: string) => {
      const keys = path.split('/').filter(Boolean)
      let value = data
      for (const key of keys) {
        value = value?.[key]
        if (value === undefined) return undefined
      }
      return value
    },
    [data]
  )

  const updateData = useCallback((updates: Record<string, any>) => {
    setDataState((prev) => ({ ...prev, ...updates }))
  }, [])

  return (
    <DataContext.Provider value={{ data, setData, getData, updateData }}>
      <DataProvider initialData={data}>{children}</DataProvider>
    </DataContext.Provider>
  )
}

/**
 * Action Handlers
 * Define what happens when actions are triggered
 */
export type ActionHandlers = {
  [key: string]: (params?: Record<string, any>) => void | Promise<void>
}

interface JsonRenderActionProviderProps {
  actions: ActionHandlers
  children: ReactNode
}

/**
 * JsonRenderActionProvider
 * 
 * Provides action handlers that components can trigger.
 * Actions are defined in the catalog and handled here.
 */
export function JsonRenderActionProvider({
  actions,
  children,
}: JsonRenderActionProviderProps) {
  const handleAction = useCallback(
    async (action: { name: string; params?: Record<string, any> }) => {
      const handler = actions[action.name]
      if (handler) {
        try {
          await handler(action.params)
        } catch (error) {
          console.error(`Action ${action.name} failed:`, error)
        }
      } else {
        console.warn(`No handler found for action: ${action.name}`)
      }
    },
    [actions]
  )

  return (
    <ActionProvider actions={handleAction}>{children}</ActionProvider>
  )
}

/**
 * Combined Provider
 * 
 * Convenience component that wraps both DataProvider and ActionProvider
 */
interface JsonRenderProvidersProps {
  initialData?: Record<string, any>
  actions: ActionHandlers
  children: ReactNode
}

export function JsonRenderProviders({
  initialData,
  actions,
  children,
}: JsonRenderProvidersProps) {
  return (
    <JsonRenderDataProvider initialData={initialData}>
      <JsonRenderActionProvider actions={actions}>{children}</JsonRenderActionProvider>
    </JsonRenderDataProvider>
  )
}
