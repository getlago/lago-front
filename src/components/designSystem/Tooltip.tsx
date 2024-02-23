import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material'
import { forwardRef, ReactNode, useState } from 'react'

interface TooltipProps
  extends Pick<
    MuiTooltipProps,
    'placement' | 'title' | 'onClose' | 'disableHoverListener' | 'PopperProps'
  > {
  children?: ReactNode
  className?: string
  maxWidth?: string
}

export const Tooltip = forwardRef(
  (
    { children, disableHoverListener, className, maxWidth = '320px', ...props }: TooltipProps,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: any,
  ) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div
        className={className}
        ref={ref}
        onMouseEnter={() => !disableHoverListener && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <MuiTooltip
          componentsProps={{ tooltip: { style: { maxWidth: maxWidth } } }}
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
