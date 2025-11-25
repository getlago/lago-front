import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material'
import { styled } from '@mui/material/styles'
import { colors } from 'lago-configs/tailwind'
import { forwardRef, ReactNode, useCallback, useState } from 'react'

import { tw } from '~/lib'

// Styled Tooltip with design system styles applied at component level
const StyledTooltip = styled(MuiTooltip)({
  // Target the tooltip slot directly
  '& .MuiTooltip-tooltip': {
    // Typography (caption style)
    fontSize: '14px',
    lineHeight: '24px',
    letterSpacing: '-0.16px',
    fontWeight: 400,
    // Colors & spacing (using the shared color palette)
    backgroundColor: colors.grey[700],
    padding: '12px 16px',
  },
  // Placement-specific margins using MUI's class modifiers
  '& .MuiTooltip-tooltipPlacementBottom': {
    marginTop: '8px',
  },
  '& .MuiTooltip-tooltipPlacementTop': {
    marginBottom: '8px',
  },
  '& .MuiTooltip-tooltipPlacementLeft': {
    marginRight: '8px',
  },
  '& .MuiTooltip-tooltipPlacementRight': {
    marginLeft: '8px',
  },
})

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
        <StyledTooltip
          slotProps={{
            tooltip: {
              sx: {
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
          <div onClick={handleClose}>{children}</div>
        </StyledTooltip>
      </div>
    )
  },
)

Tooltip.displayName = 'Tooltip'
