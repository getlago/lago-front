import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { useState } from 'react'
import { ReactNode } from 'react'

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

interface AccordionProps {
  id?: string
  className?: string
  summary: ReactNode
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  initiallyOpen?: boolean
  size?: AccordionSize
  noContentMargin?: boolean
  transitionProps?: TransitionProps
  onOpen?: () => void
}

export const Accordion = ({
  id,
  className,
  summary,
  children,
  initiallyOpen = false,
  size = AccordionSizeEnum.medium,
  noContentMargin = false,
  transitionProps = {},
  onOpen,
  ...props
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const { translate } = useInternationalization()

  return (
    <MuiAccordion
      square
      id={id}
      expanded={isOpen}
      className={tw('border border-solid border-grey-400', className)}
      onChange={(_, expanded) => {
        setIsOpen(expanded)

        if (expanded && !!onOpen) onOpen()
      }}
      TransitionProps={{ unmountOnExit: true, ...transitionProps }}
      {...props}
    >
      <AccordionSummary
        className={tw('h-23 rounded-xl', {
          'h-18': size === AccordionSizeEnum.medium,
        })}
        sx={{
          '& .MuiAccordionSummary-content': {
            height: size === AccordionSizeEnum.medium ? NAV_HEIGHT : 92,
            padding: size === AccordionSizeEnum.medium ? theme.spacing(4) : theme.spacing(8),
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
            icon={isOpen ? 'chevron-down' : 'chevron-right'}
          />
        </Tooltip>
        {summary}
      </AccordionSummary>
      <AccordionDetails
        className={tw('flex flex-col p-8 shadow-t', {
          '!p-0': noContentMargin,
          'p-4': size === AccordionSizeEnum.medium,
        })}
      >
        {typeof children === 'function' ? children({ isOpen }) : children}
      </AccordionDetails>
    </MuiAccordion>
  )
}
