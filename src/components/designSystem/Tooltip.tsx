import { forwardRef, useState } from 'react'
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material'

interface TooltipProps
  extends Pick<
    MuiTooltipProps,
    'placement' | 'title' | 'onClose' | 'disableHoverListener' | 'PopperProps'
  > {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactElement<any, any>
  className?: string
}

export const Tooltip = forwardRef(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ children, disableHoverListener, className, ...props }: TooltipProps, ref: any) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div
        className={className}
        ref={ref}
        onMouseEnter={() => !disableHoverListener && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <MuiTooltip open={isOpen} enterDelay={400} leaveDelay={0} {...props}>
          {/* eslint-disable-next-line */}
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </MuiTooltip>
      </div>
    )
  }
)

Tooltip.displayName = 'Tooltip'
