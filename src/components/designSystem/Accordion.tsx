import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ReactNode, useState } from 'react'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'
import { tw } from '~/styles/utils'

import { Button } from './Button'
import { Tooltip } from './Tooltip'

enum AccordionSizeEnum {
  medium = 'medium',
  large = 'large',
}

type AccordionSize = keyof typeof AccordionSizeEnum

interface AccordionBaseProps {
  id?: string
  className?: string
  summary: ReactNode
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  initiallyOpen?: boolean
  transitionProps?: TransitionProps
  onOpen?: () => void
}

interface AccordionCardProps extends AccordionBaseProps {
  variant?: 'card'
  size?: AccordionSize
  noContentMargin?: boolean
}

interface AccordionBorderlessProps extends AccordionBaseProps {
  variant?: 'borderless'
  size?: never
  noContentMargin?: never
}

type AccordionProps = AccordionCardProps | AccordionBorderlessProps

export const Accordion = ({
  id,
  className,
  summary,
  children,
  initiallyOpen = false,
  size: localSize,
  noContentMargin = false,
  transitionProps = {},
  variant = 'card',
  onOpen,
  ...props
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const { translate } = useInternationalization()

  const size = localSize ?? (variant === 'card' ? 'medium' : undefined)

  return (
    <MuiAccordion
      id={id}
      expanded={isOpen}
      className={tw(
        {
          'border border-solid border-grey-400': variant === 'card',
          '!rounded-none': variant === 'borderless',
        },
        className,
      )}
      onChange={(_, expanded) => {
        const selection = window.getSelection()

        if (selection?.type !== 'Range') {
          setIsOpen(expanded)

          if (expanded && !!onOpen) onOpen()
        }
      }}
      TransitionProps={{ unmountOnExit: true, ...transitionProps }}
      {...props}
    >
      <AccordionSummary
        className={tw(
          'select-text focus:bg-inherit focus-visible:ring focus-visible:hover:bg-grey-100',
          {
            'h-23': size === AccordionSizeEnum.large,
            'h-18': size === AccordionSizeEnum.medium,
          },
          variant === 'card' && (isOpen ? 'rounded-t-xl' : 'rounded-xl'),
          {
            'hover:bg-grey-100 active:bg-grey-200': variant === 'card',
            'h-auto focus:rounded-lg': variant === 'borderless',
          },
        )}
        sx={{
          '& .MuiAccordionSummary-content': {
            padding:
              size === AccordionSizeEnum.medium
                ? theme.spacing(4)
                : size === AccordionSizeEnum.large
                  ? theme.spacing(8)
                  : undefined,
            alignItems: variant === 'borderless' ? 'baseline' : 'center',
            height:
              size === AccordionSizeEnum.medium
                ? NAV_HEIGHT
                : size === AccordionSizeEnum.large
                  ? 92
                  : undefined,
          },
        }}
      >
        <Tooltip
          className="mr-3"
          placement="top-start"
          title={translate(
            isOpen ? 'text_624aa732d6af4e0103d40e61' : 'text_624aa79870f60300a3c4d074',
          )}
        >
          <Button
            tabIndex={-1}
            data-test="open-charge"
            variant="quaternary"
            size="small"
            icon={isOpen ? 'chevron-down-filled' : 'chevron-right-filled'}
          />
        </Tooltip>
        {summary}
      </AccordionSummary>
      <AccordionDetails
        className={tw('flex flex-col', {
          'shadow-t': variant === 'card',
          'mt-6': variant === 'borderless',
          'p-4': size === AccordionSizeEnum.medium,
          'p-8': size === AccordionSizeEnum.large,
          'p-0': noContentMargin,
        })}
      >
        {typeof children === 'function' ? children({ isOpen }) : children}
      </AccordionDetails>
    </MuiAccordion>
  )
}
