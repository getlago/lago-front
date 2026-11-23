import { DirectionProvider, useDirection } from '@base-ui/react/direction-provider'
import { Menu } from '@base-ui/react/menu'
import { Check, ChevronRight, Minus } from 'lucide-react'
import * as React from 'react'

import { ColorThemePortal } from './color-theme'
import './dropdown-menu.css'

import { skipDisabledNavigation } from '../lib/skip-disabled-navigation'
import { cn } from '../lib/utils'

const ModalContext = React.createContext(true)
const SelectionContext = React.createContext<React.MutableRefObject<Event | undefined> | null>(null)

export const DropdownMenu = ({
  onOpenChange,
  modal = true,
  dir,
  ...props
}: Omit<Menu.Root.Props, 'onOpenChange'> & {
  onOpenChange?: (open: boolean) => void
  dir?: 'ltr' | 'rtl'
}): JSX.Element => {
  const inheritedDirection = useDirection()
  const canceledSelection = React.useRef<Event>()

  return (
    <DirectionProvider direction={dir ?? inheritedDirection}>
      <SelectionContext.Provider value={canceledSelection}>
        <ModalContext.Provider value={modal}>
          <Menu.Root
            loopFocus={false}
            modal={modal}
            {...props}
            onOpenChange={(open, details) => {
              if (
                !open &&
                details.reason === 'item-press' &&
                canceledSelection.current === details.event
              ) {
                details.cancel()
                return
              }
              onOpenChange?.(open)
            }}
          />
        </ModalContext.Provider>
      </SelectionContext.Provider>
    </DirectionProvider>
  )
}

export const DropdownMenuSub = ({
  onOpenChange,
  ...props
}: Omit<Menu.SubmenuRoot.Props, 'onOpenChange'> & {
  onOpenChange?: (open: boolean) => void
}): JSX.Element => {
  const canceledSelection = React.useContext(SelectionContext)

  return (
    <ModalContext.Provider value={false}>
      <Menu.SubmenuRoot
        closeParentOnEsc
        {...props}
        onOpenChange={(open, details) => {
          if (
            !open &&
            details.reason === 'item-press' &&
            canceledSelection?.current === details.event
          ) {
            details.cancel()
            return
          }
          onOpenChange?.(open)
        }}
      />
    </ModalContext.Provider>
  )
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
  <Menu.Trigger
    {...props}
    ref={ref}
    render={asChild ? (React.Children.only(children) as React.ReactElement) : undefined}
  >
    {asChild ? undefined : children}
  </Menu.Trigger>
))
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'
export const DropdownMenuGroup = Menu.Group
export const DropdownMenuRadioGroup = React.forwardRef<
  HTMLDivElement,
  Omit<Menu.RadioGroup.Props, 'onValueChange'> & { onValueChange?: (value: string) => void }
>(({ onValueChange, ...props }, ref) => (
  <Menu.RadioGroup {...props} ref={ref} onValueChange={(value: string) => onValueChange?.(value)} />
))
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup'

const contentClasses =
  'v2-dropdown-menu v2-text-body z-[2100] w-max min-w-[min(132px,var(--available-width))] max-w-[min(240px,var(--available-width))] overflow-y-auto max-h-[var(--available-height)] rounded-xl border border-border-divider bg-surface-floating p-1 text-text-default shadow-v2-floating outline-none'
const itemClasses =
  'v2-dropdown-menu-item text-text-default group relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg p-2 outline-none data-[highlighted]:bg-interactive-hover data-[popup-open]:bg-interactive-hover active:bg-interactive-pressed data-[highlighted]:active:bg-interactive-pressed data-[popup-open]:active:bg-interactive-pressed data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg]:text-icon-muted [&[data-disabled]_svg]:text-disabled-foreground'

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

type ContentProps = React.HTMLAttributes<HTMLDivElement> &
  Pick<
    Menu.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'collisionPadding'
  > & {
    onCloseAutoFocus?: (event: Event) => void
    forceMount?: true
  }

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, ContentProps>(
  (
    {
      className,
      side = 'bottom',
      sideOffset = 8,
      alignOffset,
      collisionPadding = 8,
      align = 'start',
      onCloseAutoFocus,
      forceMount,
      onKeyDownCapture,
      ...props
    },
    ref,
  ) => {
    const modal = React.useContext(ModalContext)

    return (
      <Menu.Portal keepMounted={forceMount}>
        {modal && <Menu.Backdrop className="fixed inset-0 z-[2100]" />}
        <Menu.Positioner
          side={side}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
          align={align}
          className="z-[2100]"
        >
          <ColorThemePortal asChild>
            <Menu.Popup
              {...props}
              onKeyDownCapture={(event) => {
                onKeyDownCapture?.(event)
                skipDisabledNavigation(event, '[role^="menuitem"]', 'vertical', false)
              }}
              ref={ref}
              className={cn(contentClasses, className)}
              finalFocus={() => {
                const event = new Event('closeAutoFocus', { cancelable: true })

                onCloseAutoFocus?.(event)
                return !event.defaultPrevented
              }}
            />
          </ColorThemePortal>
        </Menu.Positioner>
      </Menu.Portal>
    )
  },
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, ContentProps>(
  (props, ref) => {
    const direction = useDirection()

    return (
      <DropdownMenuContent
        side={direction === 'rtl' ? 'left' : 'right'}
        sideOffset={4}
        {...props}
        ref={ref}
      />
    )
  },
)
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

type ItemProps = Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> & {
  asChild?: boolean
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
}

const useSelection = (
  onSelect: ItemProps['onSelect'],
  onClick: ItemProps['onClick'],
): React.MouseEventHandler<HTMLElement> => {
  const canceledSelection = React.useContext(SelectionContext)

  return (event) => {
    onClick?.(event)
    if (event.defaultPrevented) {
      if ('preventBaseUIHandler' in event && typeof event.preventBaseUIHandler === 'function')
        event.preventBaseUIHandler()
      return
    }
    const selection = new Event('menu.itemSelect', { bubbles: true, cancelable: true })

    event.currentTarget.dispatchEvent(selection)

    onSelect?.(selection)
    if (selection.defaultPrevented && canceledSelection)
      canceledSelection.current = event.nativeEvent
  }
}

const itemContent = (
  children: React.ReactNode,
  asChild: boolean | undefined,
  indicator?: React.ReactNode,
): { render?: React.ReactElement; children?: React.ReactNode; nativeButton?: boolean } => {
  if (!asChild)
    return {
      children: (
        <>
          {truncateItemText(children)}
          {indicator}
        </>
      ),
    }
  const child = React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>

  return {
    nativeButton: child.type === 'button',
    render: React.cloneElement(
      child,
      {},
      <>
        {child.props.children}
        {indicator}
      </>,
    ),
  }
}

export const DropdownMenuItem = React.forwardRef<
  HTMLElement,
  ItemProps & { variant?: 'default' | 'destructive' }
>(
  (
    { className, variant = 'default', children, asChild, textValue, onSelect, onClick, ...props },
    ref,
  ) => {
    const select = useSelection(onSelect, onClick)

    return (
      <Menu.Item
        {...props}
        {...itemContent(children, asChild)}
        ref={ref}
        label={textValue}
        onClick={select}
        className={cn(
          itemClasses,
          variant === 'destructive' && 'text-danger-foreground [&_svg]:text-danger-foreground',
          className,
        )}
      />
    )
  },
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSubTrigger = React.forwardRef<HTMLElement, Omit<ItemProps, 'onSelect'>>(
  ({ className, children, asChild, textValue, ...props }, ref) => (
    <Menu.SubmenuTrigger
      {...props}
      {...itemContent(children, asChild, <ChevronRight aria-hidden="true" className="ml-auto" />)}
      ref={ref}
      label={textValue}
      className={cn(itemClasses, className)}
    />
  ),
)
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLElement,
  ItemProps & {
    checked?: boolean | 'indeterminate'
    onCheckedChange?: (checked: boolean) => void
    closeOnSelect?: boolean
  }
>(
  (
    {
      className,
      children,
      asChild,
      checked,
      onCheckedChange,
      onSelect,
      onClick,
      textValue,
      closeOnSelect = false,
      ...props
    },
    ref,
  ) => {
    const select = useSelection(onSelect, onClick)
    const indicator = (
      <span
        aria-hidden="true"
        className="ml-auto flex size-3.5 shrink-0 items-center justify-center"
      >
        {checked === 'indeterminate' ? (
          <Minus />
        ) : (
          <Menu.CheckboxItemIndicator>
            <Check />
          </Menu.CheckboxItemIndicator>
        )}
      </span>
    )

    return (
      <Menu.CheckboxItem
        {...props}
        {...itemContent(children, asChild, indicator)}
        ref={ref}
        label={textValue}
        checked={checked === 'indeterminate' ? false : checked}
        {...(checked === 'indeterminate' ? { 'aria-checked': 'mixed' as const } : {})}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        onClick={select}
        closeOnClick={closeOnSelect}
        className={cn(itemClasses, className)}
      />
    )
  },
)
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

export const DropdownMenuRadioItem = React.forwardRef<
  HTMLElement,
  ItemProps & { value: string; closeOnSelect?: boolean }
>(
  (
    { className, children, asChild, onSelect, onClick, textValue, closeOnSelect = false, ...props },
    ref,
  ) => {
    const select = useSelection(onSelect, onClick)
    const indicator = (
      <span
        aria-hidden="true"
        className="ml-auto flex size-3.5 shrink-0 items-center justify-center"
      >
        <Menu.RadioItemIndicator>
          <Check />
        </Menu.RadioItemIndicator>
      </span>
    )

    return (
      <Menu.RadioItem
        {...props}
        {...itemContent(children, asChild, indicator)}
        ref={ref}
        label={textValue}
        onClick={select}
        closeOnClick={closeOnSelect}
        className={cn(itemClasses, className)}
      />
    )
  },
)
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn('v2-text-caption h-7 shrink-0 truncate p-2 text-text-muted', className)}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
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
