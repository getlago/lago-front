import { Tooltip as Primitive } from '@base-ui/react/tooltip'
import * as React from 'react'

import { ColorThemePortal } from './color-theme'

import { cn } from '../lib/utils'

const TooltipContext = React.createContext({
  id: '',
  open: false,
  delayDuration: undefined as number | undefined,
})

export const TooltipProvider = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <Primitive.Provider delay={300} closeDelay={0} timeout={500}>
    {children}
  </Primitive.Provider>
)

type TooltipProps = Omit<Primitive.Root.Props, 'children' | 'onOpenChange'> & {
  children?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  disableHoverableContent?: boolean
}

export const Tooltip = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration,
  disableHoverableContent,
  children,
  ...props
}: TooltipProps): JSX.Element => {
  const id = React.useId()
  const [internalOpen, setOpen] = React.useState(defaultOpen)
  const open = controlledOpen ?? internalOpen

  return (
    <TooltipContext.Provider value={{ id, open, delayDuration }}>
      <Primitive.Root
        {...props}
        open={open}
        disableHoverablePopup={disableHoverableContent}
        onOpenChange={(next, details) => {
          onOpenChange?.(next)
          if (!details.isCanceled) setOpen(next)
        }}
      >
        {children}
      </Primitive.Root>
    </TooltipContext.Provider>
  )
}

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; 'aria-describedby'?: string }
>(({ asChild, children, 'aria-describedby': describedBy, ...props }, ref) => {
  const { id, open, delayDuration } = React.useContext(TooltipContext)

  return (
    <Primitive.Trigger
      {...props}
      ref={ref}
      delay={delayDuration}
      aria-describedby={[describedBy, open ? id : undefined].filter(Boolean).join(' ') || undefined}
      render={asChild ? (React.Children.only(children) as React.ReactElement) : undefined}
    >
      {asChild ? undefined : children}
    </Primitive.Trigger>
  )
})
TooltipTrigger.displayName = 'TooltipTrigger'

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> &
  Pick<
    Primitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'collisionPadding'
  > & { forceMount?: true }

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = 'top',
      align = 'center',
      sideOffset = 8,
      alignOffset,
      collisionPadding = 8,
      forceMount,
      ...props
    },
    ref,
  ) => {
    const { id } = React.useContext(TooltipContext)

    return (
      <Primitive.Portal keepMounted={forceMount}>
        <Primitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
          className="z-tooltip"
        >
          <ColorThemePortal asChild>
            <Primitive.Popup
              {...props}
              id={id}
              role="tooltip"
              ref={ref}
              className={cn(
                'v2-tooltip v2-text-body z-tooltip w-max max-w-[min(240px,var(--available-width))] whitespace-normal break-words rounded-xl border-0 bg-inverse px-3 py-2 text-left text-inverse-foreground shadow-v2-floating',
                className,
              )}
            />
          </ColorThemePortal>
        </Primitive.Positioner>
      </Primitive.Portal>
    )
  },
)
TooltipContent.displayName = 'TooltipContent'
