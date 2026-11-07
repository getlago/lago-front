import * as Primitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '~/lib/utils'

import { NumericBadge, NumericBadgeProps } from './numeric-badge'

export const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: '',
  onValueChange: (): void => {},
})
export const TabsTriggerContext = React.createContext({ selected: false, disabled: false })

export const Tabs = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root>
>(({ value, defaultValue = '', onValueChange, activationMode = 'manual', ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const selected = value ?? internalValue
  const change = (next: string): void => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ value: selected, onValueChange: change }}>
      <Primitive.Root
        {...props}
        ref={ref}
        value={selected}
        onValueChange={change}
        activationMode={activationMode}
      />
    </TabsContext.Provider>
  )
})
Tabs.displayName = 'Tabs'

export const tabsTrackClasses = 'inline-flex max-w-full gap-1 rounded-xl bg-surface-subtle p-1'
export const tabsTriggerClasses =
  'v2-text-label font-normal inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-[transparent] px-3 text-text-muted outline-none hover:bg-interactive-hover hover:text-text-default active:bg-interactive-pressed focus-visible:ring-4 focus-visible:ring-focus-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:text-disabled-foreground data-[state=active]:border-border-divider data-[state=active]:bg-surface-raised data-[state=active]:text-text-default data-[state=active]:shadow-v2-interactive data-[state=active]:disabled:text-disabled-foreground [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg]:text-icon-muted [&[data-state=active]_svg]:text-icon-default [&:disabled_svg]:text-disabled-foreground'

export const TabsList = React.forwardRef<
  React.ElementRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    {...props}
    ref={ref}
    className={cn(
      tabsTrackClasses,
      'data-[orientation=vertical]:min-w-[220px] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
      className,
    )}
  />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, children, value, disabled = false, ...props }, ref) => {
  const tabs = React.useContext(TabsContext)

  return (
    <TabsTriggerContext.Provider value={{ selected: tabs.value === value, disabled }}>
      <Primitive.Trigger
        {...props}
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(tabsTriggerClasses, className)}
      >
        {children}
      </Primitive.Trigger>
    </TabsTriggerContext.Provider>
  )
})
TabsTrigger.displayName = 'TabsTrigger'

export const TabsCounter = (
  props: Omit<NumericBadgeProps, 'selected' | 'disabled'>,
): JSX.Element => {
  const state = React.useContext(TabsTriggerContext)

  return <NumericBadge {...props} {...state} data-slot="tabs-counter" />
}

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Content
    {...props}
    ref={ref}
    className={cn(
      'v2-text-body mt-4 text-text-default outline-none focus-visible:ring-4 focus-visible:ring-focus-ring',
      className,
    )}
  />
))
TabsContent.displayName = 'TabsContent'
