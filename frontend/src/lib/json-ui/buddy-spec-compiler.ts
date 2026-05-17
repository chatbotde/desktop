import type { Spec } from '@json-render/core'

type AnyRecord = Record<string, any>

type RepeatSpec = {
  statePath: string
  key?: string
}

type ElementLike = {
  type: string
  props?: AnyRecord
  children?: string[]
  repeat?: RepeatSpec
}

type SpecLike = Spec & {
  // json-render Spec doesn't include state by default in its type,
  // but many producers put it alongside the spec. We support it for repetition + bindings.
  state?: AnyRecord
}

function getByStatePath(state: AnyRecord | undefined, statePath: string): unknown {
  if (!state) return undefined
  const path = statePath.startsWith('/') ? statePath.slice(1) : statePath
  if (!path) return state
  const parts = path.split('/').filter(Boolean)
  let cur: any = state
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

function resolveTemplateString(template: string, ctx: AnyRecord): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const k = String(key).trim()
    const v = ctx[k]
    return v == null ? '' : String(v)
  })
}

function resolveValue(value: unknown, ctx: AnyRecord): unknown {
  if (value == null) return value
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value
  if (Array.isArray(value)) return value.map(v => resolveValue(v, ctx))

  if (typeof value === 'object') {
    const obj = value as AnyRecord

    // {$item: "field"}
    if (typeof obj.$item === 'string') return ctx[obj.$item]

    // {$template: "Use case: ${useCase}"}
    if (typeof obj.$template === 'string') return resolveTemplateString(obj.$template, ctx)

    // Recurse normal objects
    const out: AnyRecord = {}
    for (const [k, v] of Object.entries(obj)) out[k] = resolveValue(v, ctx)
    return out
  }

  return value
}

function cloneElementIds(id: string, suffix: string) {
  return `${id}__${suffix}`
}

/**
 * Compile a "Buddy spec" that may include:
 * - `spec.state`: local data model
 * - `repeat`: repeat an element's children for each item in `statePath`
 * - `$item` and `$template` in props
 *
 * Output is a plain json-render `Spec` (no repeat/bindings).
 */
export function compileBuddySpec(input: SpecLike | null): Spec | null {
  if (!input) return null
  if (!input.root || !input.elements) return input

  const originalElements = input.elements as Record<string, ElementLike>
  const compiledElements: Record<string, ElementLike> = {}

  const compileNode = (nodeId: string, ctx: AnyRecord): string => {
    const node = originalElements[nodeId]
    if (!node) return nodeId

    // Repeat: expand the element's children subtree for each item in the array.
    if (node.repeat?.statePath) {
      const arr = getByStatePath(input.state, node.repeat.statePath)
      const items = Array.isArray(arr) ? arr : []
      const keyField = node.repeat.key || 'id'

      const newChildren: string[] = []
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx] ?? {}
        const suffix = String(item?.[keyField] ?? idx)
        for (const childId of node.children ?? []) {
          const clonedRoot = cloneSubtree(childId, suffix, { ...ctx, ...item })
          newChildren.push(clonedRoot)
        }
      }

      compiledElements[nodeId] = {
        ...node,
        repeat: undefined,
        props: resolveValue(node.props ?? {}, ctx) as AnyRecord,
        children: newChildren,
      }

      return nodeId
    }

    compiledElements[nodeId] = {
      ...node,
      props: resolveValue(node.props ?? {}, ctx) as AnyRecord,
      children: (node.children ?? []).map(child => compileNode(child, ctx)),
    }
    return nodeId
  }

  const cloneSubtree = (nodeId: string, suffix: string, ctx: AnyRecord): string => {
    const node = originalElements[nodeId]
    if (!node) return nodeId

    const newId = cloneElementIds(nodeId, suffix)

    // If node has repeat, handle it in the cloned world too
    if (node.repeat?.statePath) {
      const arr = getByStatePath(input.state, node.repeat.statePath)
      const items = Array.isArray(arr) ? arr : []
      const keyField = node.repeat.key || 'id'

      const newChildren: string[] = []
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx] ?? {}
        const itemSuffix = `${suffix}_${String(item?.[keyField] ?? idx)}`
        for (const childId of node.children ?? []) {
          const clonedChildRoot = cloneSubtree(childId, itemSuffix, { ...ctx, ...item })
          newChildren.push(clonedChildRoot)
        }
      }

      compiledElements[newId] = {
        ...node,
        repeat: undefined,
        props: resolveValue(node.props ?? {}, ctx) as AnyRecord,
        children: newChildren,
      }

      return newId
    }

    compiledElements[newId] = {
      ...node,
      props: resolveValue(node.props ?? {}, ctx) as AnyRecord,
      children: (node.children ?? []).map(child => cloneSubtree(child, suffix, ctx)),
    }
    return newId
  }

  // Compile from root with empty context (repeat adds item context)
  const root = compileNode(input.root, {})

  return {
    root,
    elements: compiledElements as any,
  }
}

