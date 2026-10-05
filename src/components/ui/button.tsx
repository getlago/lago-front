import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '~/lib/utils'

const surfaceInteractionClasses =
  '[&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:bg-[linear-gradient(var(--color-interactive-hover),var(--color-interactive-hover))] [&:not(:disabled):not([aria-disabled=true]):active]:bg-[linear-gradient(var(--color-interactive-pressed),var(--color-interactive-pressed))]'

const buttonVariants = cva(
  "v2-text-label inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[transparent] outline-none transition-colors focus-visible:border-focus-border focus-visible:ring-[3px] focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground aria-disabled:pointer-events-none aria-disabled:border-disabled-border aria-disabled:bg-disabled aria-disabled:text-disabled-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-action-primary text-action-primary-foreground [&:not(:disabled):not([aria-disabled=true]):active]:bg-action-primary-pressed [&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:bg-action-primary-hover',
        destructive:
          'bg-destructive text-destructive-foreground [&:not(:disabled):not([aria-disabled=true]):active]:bg-destructive-pressed [&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:bg-destructive-hover',
        outline: ['border-border-default bg-surface text-text-default', surfaceInteractionClasses],
        secondary: ['bg-surface-raised text-text-default', surfaceInteractionClasses],
        ghost:
          'bg-[transparent] text-text-default [&:not(:disabled):not([aria-disabled=true]):active]:bg-interactive-pressed [&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:bg-interactive-hover',
        link: 'bg-[transparent] text-link underline-offset-4 [&:not(:disabled):not([aria-disabled=true]):active]:text-link-hover [&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:text-link-hover [&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
