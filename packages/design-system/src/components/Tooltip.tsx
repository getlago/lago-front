import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material'
import { CSSProperties, forwardRef, ReactNode, useCallback, useState } from 'react'

import { tw } from '~/lib'

export interface TooltipProps
  extends Pick<
    MuiTooltipProps,
    | 'placement'
    | 'title'
    | 'onClose'
    | 'disableHoverListener'
    | 'PopperProps'
    | 'arrow'
    | 'components'
  > {
  children?: ReactNode
  className?: string
  maxWidth?: string
  tooltipClassName?: string
  tooltipStyle?: CSSProperties
  arrowClassName?: string
  arrowStyle?: CSSProperties
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      disableHoverListener,
      className,
      maxWidth = '320px',
      tooltipClassName,
      tooltipStyle,
      arrowClassName,
      arrowStyle,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpen = useCallback(() => {
      if (!disableHoverListener) {
        setIsOpen(true)
      }
    }, [disableHoverListener])

    const handleClose = useCallback(() => setIsOpen(false), [])

    return (
      <div
        className={tw(className)}
        ref={ref}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        <MuiTooltip
          componentsProps={{
            tooltip: {
              className: tw(tooltipClassName),
              style: {
                maxWidth: maxWidth,
                ...tooltipStyle,
              },
            },
            arrow: {
              className: tw(arrowClassName),
              style: {
                ...arrowStyle,
              },
            },
          }}
          open={isOpen}
          enterDelay={400}
          leaveDelay={0}
          {...props}
        >
          {/* eslint-disable-next-line */}
          <div onClick={handleClose}>{children}</div>
        </MuiTooltip>
      </div>
    )
  },
)

Tooltip.displayName = 'Tooltip'
