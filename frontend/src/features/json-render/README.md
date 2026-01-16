# JSON Render Feature

This feature integrates [json-render](https://github.com/vercel-labs/json-render) into the application, allowing AI to generate UI components safely and predictably.

## Overview

JSON Render provides a **guardrailed** way for AI to generate UI. Instead of generating arbitrary HTML or React code, AI generates structured JSON that maps to components you define. This ensures:

- **Safety**: AI can only use components in your catalog
- **Predictability**: JSON output always matches your schema
- **Maintainability**: Easy to add/remove components and actions

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User Prompt │────▶│  AI + Catalog│────▶│  JSON Tree  │
│ "dashboard" │     │ (guardrailed)│     │(predictable)│
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
                    ┌──────────────┐            │
                    │  Your React  │◀───────────┘
                    │  Components  │ (streamed)
                    └──────────────┘
```

## File Structure

```
features/json-render/
├── catalog.ts          # Component catalog (what AI can use)
├── registry.tsx        # Component registry (how to render)
├── providers.tsx      # Data and action providers
├── hooks.ts           # Custom hooks
├── api-handler.ts     # AI generation handler
├── components/
│   └── JsonRenderView.tsx  # Main render component
└── index.ts           # Public exports
```

## Usage

### Basic Example

```tsx
import {
  JsonRenderProviders,
  JsonRenderView,
  useJsonRenderStream,
} from '@/features/json-render'

function Dashboard() {
  const { tree, send, isLoading } = useJsonRenderStream({
    api: '/api/generate-ui',
  })

  return (
    <JsonRenderProviders
      initialData={{ revenue: 125000, growth: 0.15 }}
      actions={{
        refresh_data: () => console.log('Refreshing...'),
        export_report: () => downloadPDF(),
      }}
    >
      <input
        placeholder="Create a dashboard..."
        onKeyDown={(e) => e.key === 'Enter' && send(e.target.value)}
      />
      <JsonRenderView tree={tree} />
    </JsonRenderProviders>
  )
}
```

### Adding Components

1. **Add to Catalog** (`catalog.ts`):
```ts
Card: {
  props: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  hasChildren: true,
},
```

2. **Add to Registry** (`registry.tsx`):
```tsx
Card: ({ element, children }) => (
  <Card className={element.props.className}>
    {element.props.title && <CardTitle>{element.props.title}</CardTitle>}
    {children}
  </Card>
),
```

### Adding Actions

1. **Add to Catalog** (`catalog.ts`):
```ts
actions: {
  refresh_data: {
    description: 'Refresh all metrics',
  },
}
```

2. **Handle in Providers**:
```tsx
<JsonRenderProviders
  actions={{
    refresh_data: () => {
      // Your implementation
      refetchData()
    },
  }}
>
```

## Data Binding

Components can bind to data using `valuePath`:

```tsx
// In catalog
Metric: {
  props: z.object({
    label: z.string(),
    valuePath: z.string(), // e.g., "/revenue"
  }),
}

// In registry
const value = getData(element.props.valuePath) // Gets data.revenue
```

## Integration with AI Service

The `api-handler.ts` file provides a template for integrating with your AI service. Update the `callAIService` function to use your actual AI provider (OpenAI, Anthropic, etc.).

## Best Practices

1. **Keep catalog focused**: Only add components you actually want AI to use
2. **Version schemas**: When changing component props, consider versioning
3. **Test registry**: Ensure all catalog components have corresponding registry entries
4. **Document actions**: Provide clear descriptions for actions
5. **Validate data**: Always validate AI-generated JSON server-side

## Resources

- [json-render GitHub](https://github.com/vercel-labs/json-render)
- [json-render.dev](https://json-render.dev)
