import { defineCatalog } from '@json-render/core'
import { defineRegistry } from '@json-render/react'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { Maximize2 } from 'lucide-react'
import * as React from 'react'

/**
 * Buddy JSON UI catalog (fundamentals only).
 *
 * This follows the json-render idea: **small primitive set** + compose for everything else.
 * You can evolve UI "rules" by changing only these component implementations (styles/structure),
 * without changing the JSON specs.
 */
export const buddyJsonUiCatalog = defineCatalog(schema, {
  components: {
    Stack: {
      description: 'Flex layout container',
      props: z.object({
        direction: z.enum(['vertical', 'horizontal']).default('vertical'),
        gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
        align: z.enum(['start', 'center', 'end', 'stretch']).nullable().default(null),
        justify: z.enum(['start', 'center', 'end', 'between']).nullable().default(null),
        wrap: z.boolean().default(false),
        className: z.string().optional(),
      }),
    },
    Card: {
      description: 'Surface container with optional title',
      props: z.object({
        title: z.string().nullable().default(null),
        description: z.string().nullable().default(null),
        maxWidth: z.enum(['sm', 'md', 'lg', 'full']).nullable().default(null),
        centered: z.boolean().default(false),
        className: z.string().optional(),
      }),
    },
    Text: {
      description: 'Text block',
      props: z.object({
        text: z.string(),
        variant: z.enum(['body', 'muted', 'caption', 'lead']).default('body'),
        color: z.enum(['default', 'muted', 'primary']).nullable().default(null),
        className: z.string().optional(),
      }),
    },
    Heading: {
      description: 'Heading text',
      props: z.object({
        text: z.string(),
        level: z.enum(['h1', 'h2', 'h3', 'h4']).default('h3'),
        className: z.string().optional(),
      }),
    },
    Button: {
      description: 'Clickable button (no actions wired yet)',
      props: z.object({
        label: z.string(),
        variant: z
          .enum(['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'])
          .default('default'),
        size: z.enum(['default', 'sm', 'lg', 'icon']).default('default'),
        disabled: z.boolean().default(false),
        className: z.string().optional(),
      }),
    },
    Separator: {
      description: 'Divider line',
      props: z.object({
        orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
        className: z.string().optional(),
      }),
    },
    Grid: {
      description: 'Grid layout container',
      props: z.object({
        columns: z.number().int().min(1).max(6).default(2),
        gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
        className: z.string().optional(),
      }),
    },
    Icon: {
      description: 'Icon (lucide subset)',
      props: z.object({
        name: z.string(),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
        color: z.enum(['default', 'muted', 'primary']).default('default'),
        className: z.string().optional(),
      }),
    },
  },
  actions: {},
})

export const { registry: buddyJsonUiRegistry } = defineRegistry(buddyJsonUiCatalog, {
  components: {
    Stack: ({ props, children }) => {
      const gapClass =
        props.gap === 'none'
          ? 'gap-0'
          : props.gap === 'sm'
            ? 'gap-2'
            : props.gap === 'md'
              ? 'gap-3'
              : 'gap-4'

      const alignClass =
        props.align === 'start'
          ? 'items-start'
          : props.align === 'center'
            ? 'items-center'
            : props.align === 'end'
              ? 'items-end'
              : props.align === 'stretch'
                ? 'items-stretch'
                : undefined

      const justifyClass =
        props.justify === 'start'
          ? 'justify-start'
          : props.justify === 'center'
            ? 'justify-center'
            : props.justify === 'end'
              ? 'justify-end'
              : props.justify === 'between'
                ? 'justify-between'
                : undefined

      return (
        <div
          className={cn(
            'min-w-0',
            props.direction === 'horizontal' ? 'flex flex-row' : 'flex flex-col',
            gapClass,
            alignClass,
            justifyClass,
            props.wrap && 'flex-wrap',
            props.className
          )}
        >
          {children}
        </div>
      )
    },
    Card: ({ props, children }) => (
      <section
        className={cn(
          'min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm',
          props.maxWidth === 'sm'
            ? 'max-w-sm'
            : props.maxWidth === 'md'
              ? 'max-w-md'
              : props.maxWidth === 'lg'
                ? 'max-w-lg'
                : props.maxWidth === 'full'
                  ? 'max-w-full'
                  : undefined,
          props.centered && 'mx-auto',
          props.className
        )}
      >
        {(props.title || props.description) && (
          <header className="mb-3 min-w-0">
            {props.title && <h3 className="truncate text-sm font-semibold">{props.title}</h3>}
            {props.description && (
              <p className="mt-1 text-xs text-muted-foreground">{props.description}</p>
            )}
          </header>
        )}
        {children}
      </section>
    ),
    Text: ({ props }) => (
      <p
        className={cn(
          'min-w-0',
          props.variant === 'lead'
            ? 'text-base font-semibold'
            : props.variant === 'muted'
              ? 'text-sm'
              : props.variant === 'caption'
                ? 'text-xs'
                : 'text-sm',
          props.color === 'primary'
            ? 'text-primary'
            : props.color === 'muted' || props.variant === 'muted' || props.variant === 'caption'
              ? 'text-muted-foreground'
              : 'text-foreground',
          props.className
        )}
      >
        {props.text}
      </p>
    ),
    Heading: ({ props }) => {
      const Tag =
        props.level === 'h1'
          ? 'h1'
          : props.level === 'h2'
            ? 'h2'
            : props.level === 'h3'
              ? 'h3'
              : 'h4'
      return (
        <Tag
          className={cn(
            'min-w-0 font-semibold tracking-tight',
            props.level === 'h1'
              ? 'text-2xl'
              : props.level === 'h2'
                ? 'text-xl'
                : props.level === 'h3'
                  ? 'text-base'
                  : 'text-sm',
            props.className
          )}
        >
          {props.text}
        </Tag>
      )
    },
    Button: ({ props, emit }) => (
      <Button
        type="button"
        variant={props.variant}
        size={props.size}
        disabled={props.disabled}
        className={props.className}
        onClick={() => emit('press')}
      >
        {props.label}
      </Button>
    ),
    Separator: ({ props }) => (
      <Separator orientation={props.orientation} className={props.className} />
    ),
    Grid: ({ props, children }) => {
      const gapClass =
        props.gap === 'none'
          ? 'gap-0'
          : props.gap === 'sm'
            ? 'gap-2'
            : props.gap === 'md'
              ? 'gap-3'
              : 'gap-4'
      const cols =
        props.columns === 1
          ? 'grid-cols-1'
          : props.columns === 2
            ? 'grid-cols-2'
            : props.columns === 3
              ? 'grid-cols-3'
              : props.columns === 4
                ? 'grid-cols-4'
                : props.columns === 5
                  ? 'grid-cols-5'
                  : 'grid-cols-6'

      return <div className={cn('grid min-w-0', cols, gapClass, props.className)}>{children}</div>
    },
    Icon: ({ props }) => {
      const size =
        props.size === 'sm' ? 16 : props.size === 'lg' ? 24 : 20
      const colorClass =
        props.color === 'primary'
          ? 'text-primary'
          : props.color === 'muted'
            ? 'text-muted-foreground'
            : 'text-foreground'

      // Minimal, extend as needed.
      const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
        Maximize2,
      }

      const Comp = iconMap[props.name] ?? Maximize2
      return <Comp size={size} className={cn(colorClass, props.className)} />
    },
  },
})

