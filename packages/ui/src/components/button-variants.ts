import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'v2-button v2-text-label relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[var(--v2-button-background)] align-middle text-[color:var(--v2-button-foreground)] outline-none transition-colors focus-visible:ring-4 focus-visible:ring-focus-ring focus-visible:ring-offset-0 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2',
  {
    variants: {
      variant: {
        default: '',
        secondary: 'border border-border-divider shadow-v2-interactive',
        outline: 'border border-border-control',
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
