import { DirectionProvider, useDirection } from '@base-ui/react/direction-provider'
import { Tabs as Primitive } from '@base-ui/react/tabs'
import * as React from 'react'

import { NumericBadge, NumericBadgeProps } from './numeric-badge'

import { skipDisabledNavigation } from '../lib/skip-disabled-navigation'
import { cn } from '../lib/utils'

export const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  activationMode?: 'automatic' | 'manual'
}>({
  value: '',
  onValueChange: (): void => {},
})
export const TabsTriggerContext = React.createContext({ selected: false, disabled: false })

export const Tabs = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof Primitive.Root>,
    'value' | 'defaultValue' | 'onValueChange' | 'dir'
  > & {
    dir?: 'ltr' | 'rtl'
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    activationMode?: 'automatic' | 'manual'
  }
>(({ value, defaultValue = '', onValueChange, activationMode = 'manual', dir, ...props }, ref) => {
  const inheritedDirection = useDirection()
  const direction = dir ?? inheritedDirection
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const selected = value ?? internalValue
  const change = (next: string): void => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <DirectionProvider direction={direction}>
      <TabsContext.Provider value={{ value: selected, onValueChange: change, activationMode }}>
        <Primitive.Root
          {...props}
          ref={ref}
          dir={direction}
          value={selected}
          onValueChange={(next) => {
            if (typeof next === 'string') change(next)
          }}
        />
      </TabsContext.Provider>
    </DirectionProvider>
  )
})
Tabs.displayName = 'Tabs'

export const tabsTrackClasses = 'inline-flex max-w-full gap-1 rounded-xl bg-surface-subtle p-1'
export const tabsTriggerClasses =
  'v2-text-label inline-flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-[transparent] px-3 text-text-muted outline-none hover:bg-interactive-hover hover:text-text-default active:bg-interactive-pressed focus-visible:ring-4 focus-visible:ring-focus-ring focus-visible:ring-offset-0 data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground data-[state=active]:border-border-divider data-[state=active]:bg-surface-raised data-[state=active]:text-text-default data-[state=active]:shadow-v2-interactive data-[state=active]:data-[disabled]:text-disabled-foreground [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg]:text-icon-muted [&[data-state=active]_svg]:text-icon-default [&[data-disabled]_svg]:text-disabled-foreground'

export const TabsList = React.forwardRef<
  React.ElementRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List> & { loop?: boolean }
>(({ className, loop = true, onKeyDownCapture, ...props }, ref) => {
  const { activationMode } = React.useContext(TabsContext)

  return (
    <Primitive.List
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event)
        skipDisabledNavigation(
          event,
          '[role="tab"]',
          event.currentTarget.getAttribute('aria-orientation') === 'vertical'
            ? 'vertical'
            : 'horizontal',
          loop,
        )
      }}
      activateOnFocus={activationMode === 'automatic'}
      loopFocus={loop}
      {...props}
      ref={ref}
      className={cn(
        tabsTrackClasses,
        'data-[orientation=vertical]:min-w-[220px] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
        className,
      )}
    />
  )
})
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<typeof Primitive.Tab>, 'value'> & { value: string }
>(({ className, children, value, disabled = false, ...props }, ref) => {
  const tabs = React.useContext(TabsContext)

  return (
    <TabsTriggerContext.Provider value={{ selected: tabs.value === value, disabled }}>
      <Primitive.Tab
        {...props}
        ref={ref}
        value={value}
        data-state={tabs.value === value ? 'active' : 'inactive'}
        disabled={disabled}
        className={cn(tabsTriggerClasses, className)}
      >
        {children}
      </Primitive.Tab>
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
  React.ElementRef<typeof Primitive.Panel>,
  React.ComponentPropsWithoutRef<typeof Primitive.Panel> & { forceMount?: true }
>(({ className, forceMount, ...props }, ref) => (
  <Primitive.Panel
    keepMounted={forceMount}
    {...props}
    ref={ref}
    className={cn(
      'v2-text-body mt-4 text-text-default outline-none focus-visible:ring-4 focus-visible:ring-focus-ring',
      className,
    )}
  />
))
TabsContent.displayName = 'TabsContent'
