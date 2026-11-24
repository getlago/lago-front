import { Slot } from '@radix-ui/react-slot'
import { type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import * as React from 'react'

import { buttonVariants } from './button-variants'
import './button.css'

import { cn } from '../lib/utils'

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
      onContextMenuCapture,
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
          className={cn('inline-flex items-center justify-center gap-1', loading && 'opacity-0')}
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
          onContextMenuCapture: (event) => {
            if (blocked) block(event)
            else slotted.props.onContextMenuCapture?.(event)
          },
          onContextMenu: (event) => {
            if (blocked) block(event)
            else slotted.props.onContextMenu?.(event)
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
        data-size={size ?? 'default'}
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
        onContextMenuCapture={(event) => {
          if (blocked) block(event)
          else onContextMenuCapture?.(event)
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

export { Button }
