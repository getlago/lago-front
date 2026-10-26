import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import * as React from 'react'

import { cn } from '~/lib/utils'

import './button.css'

const buttonVariants = cva(
  'v2-button v2-text-label relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[var(--v2-button-background)] align-middle text-[color:var(--v2-button-foreground)] outline-none transition-colors focus-visible:ring-4 focus-visible:ring-focus-ring focus-visible:ring-offset-0 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2',
  {
    variants: {
      variant: {
        default: '',
        secondary: 'border border-border-subtle shadow-v2-interactive',
        outline: 'border border-border-default',
        ghost: '',
        link: '',
        destructive: '',
      },
      size: {
        default: 'h-9 px-4 py-0',
        sm: 'h-8 px-3 py-0',
        lg: 'h-10 px-5 py-0',
        'icon-sm': 'size-8 p-0',
        icon: 'size-9 p-0',
        'icon-lg': 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

type SlottedProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      loading = false,
      disabled = false,
      type = 'button',
      children,
      onClickCapture,
      onAuxClickCapture,
      onKeyDownCapture,
      onContextMenu,
      ...props
    },
    ref,
  ) => {
    const blocked = disabled || loading
    const Comp = asChild ? Slot : 'button'
    const content = (value: React.ReactNode) => (
      <>
        {/* Opacity preserves both geometry and the accessible name during loading. */}
        <span
          className={cn(
            'v2-button-content inline-flex items-center justify-center gap-1',
            loading && 'opacity-0',
          )}
        >
          {value}
        </span>
        {loading && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <LoaderCircle
              size={14}
              strokeWidth={2}
              className="animate-spin motion-reduce:animate-none"
            />
          </span>
        )}
      </>
    )
    const block = (event: React.SyntheticEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    // Slot merges child handlers first. Guard the child capture handlers too, so a
    // disabled/loading anchor cannot run its own handlers before ours.
    const slotted = asChild
      ? (React.Children.only(children) as React.ReactElement<SlottedProps>)
      : null
    const rendered = slotted
      ? React.cloneElement(slotted, {
          onClickCapture: (event) => {
            if (blocked) block(event)
            else slotted.props.onClickCapture?.(event)
          },
          onAuxClickCapture: (event) => {
            if (blocked) block(event)
            else slotted.props.onAuxClickCapture?.(event)
          },
          onKeyDownCapture: (event) => {
            if (blocked && (event.key === 'Enter' || event.key === ' ')) block(event)
            else slotted.props.onKeyDownCapture?.(event)
          },
          children: content(slotted.props.children),
        })
      : content(children)

    return (
      <Comp
        {...props}
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : blocked}
        aria-disabled={blocked || undefined}
        aria-busy={loading || undefined}
        data-variant={variant ?? 'default'}
        data-disabled={disabled || undefined}
        data-loading={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        onClickCapture={(event) => {
          if (blocked) block(event)
          else onClickCapture?.(event)
        }}
        onAuxClickCapture={(event) => {
          if (blocked) block(event)
          else onAuxClickCapture?.(event)
        }}
        onKeyDownCapture={(event) => {
          if (blocked && (event.key === 'Enter' || event.key === ' ')) block(event)
          else onKeyDownCapture?.(event)
        }}
        onContextMenu={(event) => {
          if (blocked) block(event)
          else onContextMenu?.(event)
        }}
      >
        {rendered}
      </Comp>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
