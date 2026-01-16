/**
 * JSON Render Catalog
 * 
 * Defines the component catalog that AI can use to generate UI.
 * This is the "vocabulary" that constrains AI output to predictable, safe components.
 * 
 * @see https://github.com/vercel-labs/json-render
 */

import { createCatalog } from '@json-render/core'
import { z } from 'zod'

// Action schema for buttons and interactive elements
const ActionSchema = z.object({
  name: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
  confirm: z.object({
    title: z.string(),
    message: z.string(),
    variant: z.enum(['default', 'destructive']).optional(),
  }).optional(),
  onSuccess: z.object({
    set: z.record(z.string(), z.unknown()),
  }).optional(),
  onError: z.object({
    set: z.record(z.string(), z.unknown()),
  }).optional(),
})

/**
 * Component Catalog
 * 
 * Defines all components that AI can generate, along with their props schemas.
 * Adding a component here makes it available for AI to use.
 */
const catalogComponents = {
    // Layout Components
    Card: {
      props: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    CardHeader: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    CardTitle: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    CardDescription: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    CardContent: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    CardFooter: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },

    // Form Components
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).optional(),
        size: z.enum(['default', 'sm', 'lg', 'icon']).optional(),
        action: ActionSchema.optional(),
        disabled: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Input: {
      props: z.object({
        label: z.string().optional(),
        placeholder: z.string().optional(),
        valuePath: z.string().optional(), // Binds to data path
        type: z.enum(['text', 'email', 'password', 'number', 'tel', 'url']).optional(),
        disabled: z.boolean().optional(),
        required: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Textarea: {
      props: z.object({
        label: z.string().optional(),
        placeholder: z.string().optional(),
        valuePath: z.string().optional(),
        rows: z.number().optional(),
        disabled: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Checkbox: {
      props: z.object({
        label: z.string(),
        valuePath: z.string().optional(),
        checked: z.boolean().optional(),
        disabled: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Switch: {
      props: z.object({
        label: z.string(),
        valuePath: z.string().optional(),
        checked: z.boolean().optional(),
        disabled: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Select: {
      props: z.object({
        label: z.string().optional(),
        placeholder: z.string().optional(),
        valuePath: z.string().optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
        })),
        disabled: z.boolean().optional(),
        className: z.string().optional(),
      }),
    },
    Label: {
      props: z.object({
        text: z.string(),
        htmlFor: z.string().optional(),
        className: z.string().optional(),
      }),
    },

    // Display Components
    Alert: {
      props: z.object({
        title: z.string().optional(),
        message: z.string(),
        variant: z.enum(['default', 'destructive']).optional(),
        className: z.string().optional(),
      }),
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'secondary', 'destructive', 'outline']).optional(),
        className: z.string().optional(),
      }),
    },
    Separator: {
      props: z.object({
        orientation: z.enum(['horizontal', 'vertical']).optional(),
        className: z.string().optional(),
      }),
    },
    Progress: {
      props: z.object({
        value: z.number().min(0).max(100).optional(),
        valuePath: z.string().optional(), // Can bind to data
        className: z.string().optional(),
      }),
    },
    Skeleton: {
      props: z.object({
        className: z.string().optional(),
        width: z.string().optional(),
        height: z.string().optional(),
      }),
    },

    // Navigation Components
    Tabs: {
      props: z.object({
        defaultValue: z.string().optional(),
        valuePath: z.string().optional(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    TabsList: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    TabsTrigger: {
      props: z.object({
        value: z.string(),
        label: z.string(),
        className: z.string().optional(),
      }),
    },
    TabsContent: {
      props: z.object({
        value: z.string(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },

    // Dialog Components
    Dialog: {
      props: z.object({
        open: z.boolean().optional(),
        openPath: z.string().optional(), // Binds to data path
        title: z.string().optional(),
        description: z.string().optional(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    DialogTrigger: {
      props: z.object({
        label: z.string(),
        className: z.string().optional(),
      }),
    },
    DialogContent: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    DialogHeader: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    DialogTitle: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    DialogDescription: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    DialogFooter: {
      props: z.object({
        className: z.string().optional(),
      }),
      hasChildren: true,
    },

    // Data Display
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(), // Binds to data
        format: z.enum(['currency', 'percent', 'number', 'date']).optional(),
        className: z.string().optional(),
      }),
    },
    Table: {
      props: z.object({
        dataPath: z.string(), // Array path in data
        columns: z.array(z.object({
          key: z.string(),
          header: z.string(),
          accessor: z.string().optional(), // Path within each row
        })),
        className: z.string().optional(),
      }),
    },

    // Layout Utilities
    Container: {
      props: z.object({
        className: z.string().optional(),
        maxWidth: z.enum(['sm', 'md', 'lg', 'xl', '2xl', 'full']).optional(),
      }),
      hasChildren: true,
    },
    Stack: {
      props: z.object({
        direction: z.enum(['row', 'column']).optional(),
        gap: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
        align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
        justify: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },
    Grid: {
      props: z.object({
        cols: z.number().optional(),
        gap: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
        className: z.string().optional(),
      }),
      hasChildren: true,
    },

    // Text Components
    Heading: {
      props: z.object({
        level: z.enum(['1', '2', '3', '4', '5', '6']),
        text: z.string(),
        className: z.string().optional(),
      }),
    },
    Text: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'muted', 'small']).optional(),
        className: z.string().optional(),
      }),
    },
    Markdown: {
      props: z.object({
        content: z.string(),
        contentPath: z.string().optional(), // Can bind to data
        className: z.string().optional(),
      }),
    }
  }


// Actions that components can trigger
const catalogActions = {
    // Navigation actions
    navigate: {
      description: 'Navigate to a different page or route',
    },
    open_dialog: {
      description: 'Open a dialog or modal',
    },
    close_dialog: {
      description: 'Close a dialog or modal',
    },
    
    // Data actions
    refresh_data: {
      description: 'Refresh or reload data',
    },
    submit_form: {
      description: 'Submit a form',
    },
    reset_form: {
      description: 'Reset form fields to initial values',
    },
    
    // UI actions
    toggle_visibility: {
      description: 'Toggle visibility of an element',
    },
    set_value: {
      description: 'Set a value in the data store',
    },
    
    // Application-specific actions
    send_message: {
      description: 'Send a message in the chat interface',
    },
    generate_image: {
      description: 'Generate an image using AI',
    },
    export_data: {
      description: 'Export data to a file',
    },
    copy_to_clipboard: {
      description: 'Copy text to clipboard'
    }
  };

export const jsonRenderCatalog = createCatalog({
  components: catalogComponents,
  actions: catalogActions
});

export type JsonRenderCatalog = typeof jsonRenderCatalog;
