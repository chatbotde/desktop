/**
 * JSON Render Component Registry
 * 
 * Maps json-render component types to actual React components.
 * This is where you connect the AI-generated JSON to your UI components.
 * 
 * @see https://github.com/vercel-labs/json-render
 */

import React from 'react'
// import type { UIElement } from '@json-render/core'

// Type alias for convenience
// Type alias for convenience - using any to avoid strict prop checking for dynamic JSON components
type Element = any

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Separator,
  Progress,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui'
import { Markdown } from '@/shared/components/markdown'
import { cn } from '@/lib/utils'

/**
 * Component Registry
 * 
 * Maps component types from the catalog to React components.
 * Each entry receives the element props and children from json-render.
 */
export const jsonRenderRegistry = {
  // Layout Components
  Card: ({ element, children }: { element: any; children?: React.ReactNode }) => (
    <Card className={element.props.className}>
      {element.props.title && (
        <CardHeader>
          {element.props.title && <CardTitle>{element.props.title}</CardTitle>}
          {element.props.description && (
            <CardDescription>{element.props.description}</CardDescription>
          )}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
    </Card>
  ),

  CardHeader: ({ element, children }: { element: any; children?: React.ReactNode }) => (
    <CardHeader className={element.props.className}>{children}</CardHeader>
  ),

  CardTitle: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <CardTitle className={element.props.className}>{children}</CardTitle>
  ),

  CardDescription: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <CardDescription className={element.props.className}>{children}</CardDescription>
  ),

  CardContent: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <CardContent className={element.props.className}>{children}</CardContent>
  ),

  CardFooter: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <CardFooter className={element.props.className}>{children}</CardFooter>
  ),

  // Form Components
  Button: ({
    element,
    onAction,
  }: {
    element: Element
    onAction?: (action: any) => void
  }) => {
    const handleClick = () => {
      if (element.props.action && onAction) {
        onAction(element.props.action)
      }
    }

    return (
      <Button
        variant={element.props.variant}
        size={element.props.size}
        disabled={element.props.disabled}
        className={element.props.className}
        onClick={handleClick}
      >
        {element.props.label}
      </Button>
    )
  },

  Input: ({ element }: { element: Element }) => (
    <div className="space-y-2">
      {element.props.label && (
        <Label htmlFor={element.props.valuePath}>{element.props.label}</Label>
      )}
      <Input
        id={element.props.valuePath}
        type={element.props.type || 'text'}
        placeholder={element.props.placeholder}
        disabled={element.props.disabled}
        required={element.props.required}
        className={element.props.className}
      />
    </div>
  ),

  Textarea: ({ element }: { element: Element }) => (
    <div className="space-y-2">
      {element.props.label && (
        <Label htmlFor={element.props.valuePath}>{element.props.label}</Label>
      )}
      <Textarea
        id={element.props.valuePath}
        placeholder={element.props.placeholder}
        rows={element.props.rows}
        disabled={element.props.disabled}
        className={element.props.className}
      />
    </div>
  ),

  Checkbox: ({ element }: { element: Element }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={element.props.valuePath}
        checked={element.props.checked}
        disabled={element.props.disabled}
        className={element.props.className}
      />
      <Label htmlFor={element.props.valuePath}>{element.props.label}</Label>
    </div>
  ),

  Switch: ({ element }: { element: Element }) => (
    <div className="flex items-center space-x-2">
      <Switch
        id={element.props.valuePath}
        checked={element.props.checked}
        disabled={element.props.disabled}
        className={element.props.className}
      />
      <Label htmlFor={element.props.valuePath}>{element.props.label}</Label>
    </div>
  ),

  Select: ({ element }: { element: Element }) => (
    <div className="space-y-2">
      {element.props.label && (
        <Label htmlFor={element.props.valuePath}>{element.props.label}</Label>
      )}
      <Select>
        <SelectTrigger className={element.props.className}>
          <SelectValue placeholder={element.props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {element.props.options?.map((option: any) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),

  Label: ({ element }: { element: Element }) => (
    <Label htmlFor={element.props.htmlFor} className={element.props.className}>
      {element.props.text}
    </Label>
  ),

  // Display Components
  Alert: ({ element }: { element: Element }) => (
    <Alert
      variant={element.props.variant || 'default'}
      className={element.props.className}
    >
      {element.props.title && <AlertTitle>{element.props.title}</AlertTitle>}
      <AlertDescription>{element.props.message}</AlertDescription>
    </Alert>
  ),

  Badge: ({ element }: { element: Element }) => (
    <Badge variant={element.props.variant || 'default'} className={element.props.className}>
      {element.props.text}
    </Badge>
  ),

  Separator: ({ element }: { element: Element }) => (
    <Separator
      orientation={element.props.orientation || 'horizontal'}
      className={element.props.className}
    />
  ),

  Progress: ({ element }: { element: Element }) => (
    <Progress value={element.props.value || 0} className={element.props.className} />
  ),

  Skeleton: ({ element }: { element: Element }) => (
    <Skeleton
      className={cn(element.props.className, element.props.width && `w-[${element.props.width}]`, element.props.height && `h-[${element.props.height}]`)}
    />
  ),

  // Navigation Components
  Tabs: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <Tabs defaultValue={element.props.defaultValue} className={element.props.className}>
      {children}
    </Tabs>
  ),

  TabsList: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <TabsList className={element.props.className}>{children}</TabsList>
  ),

  TabsTrigger: ({ element }: { element: Element }) => (
    <TabsTrigger value={element.props.value} className={element.props.className}>
      {element.props.label}
    </TabsTrigger>
  ),

  TabsContent: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <TabsContent value={element.props.value} className={element.props.className}>
      {children}
    </TabsContent>
  ),

  // Dialog Components
  Dialog: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <Dialog open={element.props.open}>
      {children}
    </Dialog>
  ),

  DialogTrigger: ({ element }: { element: Element }) => (
    <DialogTrigger className={element.props.className}>{element.props.label}</DialogTrigger>
  ),

  DialogContent: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <DialogContent className={element.props.className}>{children}</DialogContent>
  ),

  DialogHeader: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <DialogHeader className={element.props.className}>{children}</DialogHeader>
  ),

  DialogTitle: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <DialogTitle className={element.props.className}>{children}</DialogTitle>
  ),

  DialogDescription: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <DialogDescription className={element.props.className}>{children}</DialogDescription>
  ),

  DialogFooter: ({ element, children }: { element: Element; children?: React.ReactNode }) => (
    <DialogFooter className={element.props.className}>{children}</DialogFooter>
  ),

  // Data Display
  Metric: ({ element, data }: { element: Element; data?: any }) => {
    // Get value from data path
    const getValue = (path: string) => {
      if (!data) return null
      const keys = path.split('/').filter(Boolean)
      let value = data
      for (const key of keys) {
        value = value?.[key]
        if (value === undefined) return null
      }
      return value
    }

    const value = getValue(element.props.valuePath)

    const formatValue = (val: any, format?: string) => {
      if (val === null || val === undefined) return 'N/A'

      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(val)
        case 'percent':
          return `${(val * 100).toFixed(1)}%`
        case 'date':
          return new Date(val).toLocaleDateString()
        case 'number':
        default:
          return new Intl.NumberFormat('en-US').format(val)
      }
    }

    return (
      <div className={cn('space-y-1', element.props.className)}>
        <div className="text-sm text-muted-foreground">{element.props.label}</div>
        <div className="text-2xl font-semibold">{formatValue(value, element.props.format)}</div>
      </div>
    )
  },

  Table: ({ element, data }: { element: Element; data?: any }) => {
    const getValue = (path: string, obj: any) => {
      if (!obj) return null
      const keys = path.split('/').filter(Boolean)
      let value = obj
      for (const key of keys) {
        value = value?.[key]
        if (value === undefined) return null
      }
      return value
    }

    const tableData = getValue(element.props.dataPath, data) || []

    return (
      <div className={cn('rounded-md border', element.props.className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {element.props.columns.map((col: any) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row: any, idx: number) => (
              <TableRow key={idx}>
                {element.props.columns.map((col: any) => {
                  const accessor = col.accessor || col.key
                  const value = getValue(accessor, row)
                  return <TableCell key={col.key}>{value ?? '-'}</TableCell>
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },

  // Layout Utilities
  Container: ({ element, children }: { element: Element; children?: React.ReactNode }) => {
    const maxWidthMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full',
    }

    return (
      <div
        className={cn(
          'mx-auto w-full px-4',
          element.props.maxWidth && (maxWidthMap as any)[element.props.maxWidth],
          element.props.className
        )}
      >
        {children}
      </div>
    )
  },

  Stack: ({ element, children }: { element: Element; children?: React.ReactNode }) => {
    const directionMap = {
      row: 'flex-row',
      column: 'flex-col',
    }

    const gapMap = {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    }

    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    }

    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    }

    return (
      <div
        className={cn(
          'flex',
          element.props.direction && (directionMap as any)[element.props.direction],
          element.props.gap && (gapMap as any)[element.props.gap],
          element.props.align && (alignMap as any)[element.props.align],
          element.props.justify && (justifyMap as any)[element.props.justify],
          element.props.className
        )}
      >
        {children}
      </div>
    )
  },

  Grid: ({ element, children }: { element: Element; children?: React.ReactNode }) => {
    const gapMap = {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    }

    return (
      <div
        className={cn(
          'grid',
          element.props.cols && `grid-cols-${element.props.cols}`,
          element.props.gap && (gapMap as any)[element.props.gap],
          element.props.className
        )}
      >
        {children}
      </div>
    )
  },

  // Text Components
  Heading: ({ element }: { element: Element }) => {
    const HeadingTag = `h${element.props.level}` as React.ElementType
    return (
      <HeadingTag className={cn('font-semibold', element.props.className)}>
        {element.props.text}
      </HeadingTag>
    )
  },

  Text: ({ element }: { element: Element }) => {
    const variantMap = {
      default: 'text-base',
      muted: 'text-sm text-muted-foreground',
      small: 'text-sm',
    }

    return (
      <p className={cn((variantMap as any)[element.props.variant || 'default'], element.props.className)}>
        {element.props.text}
      </p>
    )
  },

  Markdown: ({ element, data }: { element: Element; data?: any }) => {
    const getValue = (path: string) => {
      if (!data) return null
      const keys = path.split('/').filter(Boolean)
      let value = data
      for (const key of keys) {
        value = value?.[key]
        if (value === undefined) return null
      }
      return value
    }

    const content = element.props.contentPath
      ? getValue(element.props.contentPath)
      : element.props.content

    return (
      <div className={element.props.className}>
        <Markdown>{content || ''}</Markdown>
      </div>
    )
  },
}

export type JsonRenderRegistry = typeof jsonRenderRegistry
