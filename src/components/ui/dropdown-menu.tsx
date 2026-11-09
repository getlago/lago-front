import * as Menu from '@radix-ui/react-dropdown-menu'
import { Slottable } from '@radix-ui/react-slot'
import { Check, ChevronRight, Minus } from 'lucide-react'
import * as React from 'react'

import { cn } from '~/lib/utils'

import { ColorThemePortal } from './color-theme'
import './dropdown-menu.css'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group
export const DropdownMenuRadioGroup = Menu.RadioGroup
export const DropdownMenuSub = Menu.Sub

const contentClasses =
  'v2-dropdown-menu v2-text-body z-[2100] w-max min-w-[min(132px,var(--radix-dropdown-menu-content-available-width))] max-w-[min(240px,var(--radix-dropdown-menu-content-available-width))] overflow-y-auto max-h-[var(--radix-dropdown-menu-content-available-height)] rounded-xl border border-border-divider bg-surface-floating p-1 text-text-default shadow-v2-floating outline-none'
const itemClasses =
  'v2-dropdown-menu-item text-text-default group relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg p-2 outline-none data-[highlighted]:bg-interactive-hover data-[state=open]:bg-interactive-hover active:bg-interactive-pressed data-[highlighted]:active:bg-interactive-pressed data-[state=open]:active:bg-interactive-pressed data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg]:text-icon-muted [&[data-disabled]_svg]:text-disabled-foreground'

const truncateItemText = (children: React.ReactNode): React.ReactNode => {
  const result: React.ReactNode[] = []
  let text = ''
  const flushText = (): void => {
    if (!text) return
    result.push(
      <span key={`text-${result.length}`} className="min-w-0 truncate">
        {text}
      </span>,
    )
    text = ''
  }

  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return
    if (typeof child === 'string' || typeof child === 'number') {
      text += child
      return
    }
    flushText()
    result.push(child)
  })
  flushText()

  return result
}

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Content>,
  React.ComponentPropsWithoutRef<typeof Menu.Content>
>(({ className, sideOffset = 8, collisionPadding = 8, align = 'start', ...props }, ref) => (
  <Menu.Portal>
    <ColorThemePortal asChild>
      <Menu.Content
        {...props}
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(contentClasses, className)}
      />
    </ColorThemePortal>
  </Menu.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Menu.SubContent>,
  React.ComponentPropsWithoutRef<typeof Menu.SubContent>
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <Menu.Portal>
    <ColorThemePortal asChild>
      <Menu.SubContent
        {...props}
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(contentClasses, className)}
      />
    </ColorThemePortal>
  </Menu.Portal>
))
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & { variant?: 'default' | 'destructive' }
>(({ className, variant = 'default', children, asChild, ...props }, ref) => (
  <Menu.Item
    {...props}
    asChild={asChild}
    ref={ref}
    className={cn(
      itemClasses,
      variant === 'destructive' && 'text-danger-foreground [&_svg]:text-danger-foreground',
      className,
    )}
  >
    {asChild ? children : truncateItemText(children)}
  </Menu.Item>
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Menu.SubTrigger>
>(({ className, children, asChild, ...props }, ref) => (
  <Menu.SubTrigger {...props} asChild={asChild} ref={ref} className={cn(itemClasses, className)}>
    {asChild ? <Slottable>{children}</Slottable> : truncateItemText(children)}
    <ChevronRight aria-hidden="true" className="ml-auto" />
  </Menu.SubTrigger>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Menu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Menu.CheckboxItem> & { closeOnSelect?: boolean }
>(({ className, children, asChild, checked, onSelect, closeOnSelect = false, ...props }, ref) => (
  <Menu.CheckboxItem
    {...props}
    asChild={asChild}
    ref={ref}
    checked={checked}
    onSelect={(event) => {
      onSelect?.(event)
      if (!closeOnSelect) event.preventDefault()
    }}
    className={cn(itemClasses, className)}
  >
    {asChild ? <Slottable>{children}</Slottable> : truncateItemText(children)}
    <span aria-hidden="true" className="ml-auto flex size-3.5 shrink-0 items-center justify-center">
      <Menu.ItemIndicator>{checked === 'indeterminate' ? <Minus /> : <Check />}</Menu.ItemIndicator>
    </span>
  </Menu.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Menu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Menu.RadioItem> & { closeOnSelect?: boolean }
>(({ className, children, asChild, onSelect, closeOnSelect = false, ...props }, ref) => (
  <Menu.RadioItem
    {...props}
    asChild={asChild}
    ref={ref}
    onSelect={(event) => {
      onSelect?.(event)
      if (!closeOnSelect) event.preventDefault()
    }}
    className={cn(itemClasses, className)}
  >
    {asChild ? <Slottable>{children}</Slottable> : truncateItemText(children)}
    <span aria-hidden="true" className="ml-auto flex size-3.5 shrink-0 items-center justify-center">
      <Menu.ItemIndicator>
        <Check />
      </Menu.ItemIndicator>
    </span>
  </Menu.RadioItem>
))
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Menu.Label>,
  React.ComponentPropsWithoutRef<typeof Menu.Label>
>(({ className, ...props }, ref) => (
  <Menu.Label
    {...props}
    ref={ref}
    className={cn('v2-text-caption truncate px-2 py-1 text-text-muted', className)}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Menu.Separator>,
  React.ComponentPropsWithoutRef<typeof Menu.Separator>
>(({ className, ...props }, ref) => (
  <Menu.Separator
    {...props}
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border-divider', className)}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): JSX.Element => (
  <span
    {...props}
    aria-hidden="true"
    className={cn(
      'v2-text-caption ml-auto shrink-0 text-text-subtle group-data-[disabled]:text-disabled-foreground',
      className,
    )}
  />
)
