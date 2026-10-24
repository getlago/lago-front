import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import { cn } from '~/lib/utils'

import { ColorThemePortal } from './color-theme'

/** Share one provider across a toolbar or shadcn region, not one per trigger. */
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={500}>
    {children}
  </TooltipPrimitive.Provider>
)

export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <ColorThemePortal asChild>
      <TooltipPrimitive.Content
        {...props}
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'v2-tooltip v2-text-body z-[1500] w-max max-w-[min(240px,var(--radix-tooltip-content-available-width))] whitespace-normal break-words rounded-xl border-0 bg-inverse px-3 py-2 text-left text-inverse-foreground shadow-v2-floating',
          className,
        )}
      />
    </ColorThemePortal>
  </TooltipPrimitive.Portal>
))

TooltipContent.displayName = 'TooltipContent'
