import { defineCatalog } from '@json-render/core'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'
import { shadcnComponents } from '@json-render/shadcn'
import { defineRegistry } from '@json-render/react'
import { schema } from '@json-render/react/schema'

/**
 * Full shadcn/json-render catalog — use for AI prompts, validation, and streaming specs.
 * @see https://json-render.dev/docs/installation
 */
export const buddyJsonUiCatalog = defineCatalog(schema, {
  components: shadcnComponentDefinitions,
  actions: {},
})

export const { registry: buddyJsonUiRegistry } = defineRegistry(buddyJsonUiCatalog, {
  components: shadcnComponents,
})
