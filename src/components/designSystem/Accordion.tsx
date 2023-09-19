import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { useState } from 'react'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { Button } from './Button'
import { Tooltip } from './Tooltip'

enum AccordionSizeEnum {
  medium = 'medium',
  large = 'large',
}

type AccordionSize = keyof typeof AccordionSizeEnum

interface AccordionProps {
  id?: string
  summary: ReactNode
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  initiallyOpen?: boolean
  size?: AccordionSize
  noContentMargin?: boolean
  transitionProps?: TransitionProps
}

export const Accordion = ({
  id,
  summary,
  children,
  initiallyOpen = false,
  size = AccordionSizeEnum.medium,
  noContentMargin = false,
  transitionProps = {},
  ...props
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const { translate } = useInternationalization()

  return (
    <Container id={id} {...props}>
      <StyledAccordion
        expanded={isOpen}
        onChange={(_, expanded) => setIsOpen(expanded)}
        TransitionProps={{ unmountOnExit: true, ...transitionProps }}
        square
      >
        <Summary $size={size}>
          <Tooltip
            placement="top-start"
            title={translate(
              isOpen ? 'text_624aa732d6af4e0103d40e61' : 'text_624aa79870f60300a3c4d074'
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
        </Summary>
        <Details $size={size} $noContentMargin={noContentMargin}>
          {typeof children === 'function' ? children({ isOpen }) : children}
        </Details>
      </StyledAccordion>
    </Container>
  )
}

const Container = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const StyledAccordion = styled(MuiAccordion)`
  border-radius: 12px;
  overflow: hidden;

  &.MuiAccordion-root.MuiPaper-root {
    border-radius: 12px;
    background-color: transparent;
  }
  &.MuiAccordion-root {
    overflow: inherit;

    &:before {
      height: 0;
    }
    &.Mui-expanded {
      margin: 0;
    }
  }

  .MuiAccordionSummary-content {
    width: 100%;
  }
`

const Summary = styled(AccordionSummary)<{ $size?: AccordionSize }>`
  && {
    height: ${({ $size }) => ($size === AccordionSizeEnum.medium ? NAV_HEIGHT : 92)}px;
    border-radius: 12px;

    &.Mui-expanded {
      border-radius: 12px 12px 0 0;
    }

    &.MuiAccordionSummary-root.Mui-focusVisible {
      background-color: inherit;
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      &:hover {
        background-color: ${theme.palette.grey[100]};
      }
    }

    &:hover {
      background-color: ${theme.palette.grey[100]};
    }

    &:active {
      background-color: ${theme.palette.grey[200]};
    }

    .MuiAccordionSummary-content {
      display: flex;
      height: ${({ $size }) => ($size === AccordionSizeEnum.medium ? NAV_HEIGHT : 92)}px;
      box-sizing: border-box;
      align-items: center;
      padding: ${({ $size }) =>
        $size === AccordionSizeEnum.medium ? theme.spacing(4) : theme.spacing(8)};

      > *:first-child {
        margin-right: ${theme.spacing(3)};
      }
    }
  }
`

const Details = styled(AccordionDetails)<{ $size?: AccordionSize; $noContentMargin?: boolean }>`
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows[5]};

  &.MuiAccordionDetails-root {
    padding: ${({ $size, $noContentMargin }) =>
      $noContentMargin
        ? 0
        : $size === AccordionSizeEnum.medium
        ? theme.spacing(4)
        : theme.spacing(8)};
  }
`
