import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material'
import { forwardRef, ReactNode, useState } from 'react'

import { tw } from '~/styles/utils'

export interface TooltipProps
  extends Pick<
    MuiTooltipProps,
    'placement' | 'title' | 'onClose' | 'disableHoverListener' | 'PopperProps'
  > {
  children?: ReactNode
  className?: string
  maxWidth?: string
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, disableHoverListener, className, maxWidth = '320px', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div
        className={tw(className)}
        ref={ref}
        onMouseEnter={() => !disableHoverListener && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <MuiTooltip
          componentsProps={{
            tooltip: {
              style: {
                maxWidth: maxWidth,
              },
            },
          }}
          open={isOpen}
          enterDelay={400}
          leaveDelay={0}
          {...props}
        >
          {/* eslint-disable-next-line */}
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </MuiTooltip>
      </div>
    )
  },
)

Tooltip.displayName = 'Tooltip'
