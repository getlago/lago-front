import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import * as React from 'react'

import { cn } from '~/lib/utils'

export const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'nav'>>(
  (props, ref) => <nav ref={ref} aria-label="Breadcrumb" {...props} />,
)
Breadcrumb.displayName = 'Breadcrumb'

export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<'ol'>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn('v2-text-body flex min-w-0 items-center gap-1 font-normal', className)}
    {...props}
  />
))
BreadcrumbList.displayName = 'BreadcrumbList'

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex min-w-0 items-center', className)} {...props} />
  ),
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & { asChild?: boolean }
>(({ asChild = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex min-w-0 items-center rounded-lg p-1 text-text-muted outline-none hover:bg-interactive-hover focus-visible:ring-4 focus-visible:ring-focus-ring focus-visible:ring-offset-0 active:bg-interactive-pressed active:text-text-default',
        className,
      )}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = 'BreadcrumbLink'

export const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-current="page"
    className={cn('min-w-0 truncate p-1 text-text-default', className)}
    {...props}
  />
))
BreadcrumbPage.displayName = 'BreadcrumbPage'

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'>): JSX.Element => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('flex shrink-0 items-center text-icon-subtle', className)}
    {...props}
  >
    {children ?? <ChevronRight size={14} strokeWidth={2} />}
  </li>
)

export const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>): JSX.Element => (
  <span
    aria-hidden="true"
    className={cn('flex size-5 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal size={14} strokeWidth={2} />
  </span>
)
