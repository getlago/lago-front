import { useState, ReactNode, useRef } from 'react'
import styled from 'styled-components'
import clsns from 'classnames'

import { theme, NAV_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Button } from './Button'
import { Tooltip } from './Tooltip'

enum AccordionSizeEnum {
  medium = 'medium',
  large = 'large',
}
type AccordionSize = keyof typeof AccordionSizeEnum

interface AccordionProps {
  summary: ReactNode
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  id?: string
  initiallyOpen?: boolean
  size?: AccordionSize
  noContentMargin?: boolean
  className?: string
  expandedTooltip?: string
  collapsedTooltip?: string
  onChange?: (newState: boolean) => void | Promise<unknown>
}

export const Accordion = ({
  id,
  className,
  size = AccordionSizeEnum.medium,
  summary,
  initiallyOpen = false,
  children,
  noContentMargin = false,
  expandedTooltip,
  collapsedTooltip,
  onChange,
}: AccordionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(!initiallyOpen)
  const summaryRef = useRef<HTMLDivElement>(null)
  const accordionUniqIdRef = useRef(`accordion-summary-${Math.round(Math.random() * 1000)}`)
  const { translate } = useInternationalization()

  return (
    <Container id={id} className={className}>
      <Summary
        ref={summaryRef}
        className={clsns({ 'accordion--collapsed': isCollapsed })}
        $size={size}
        id={accordionUniqIdRef?.current}
        role="button"
        tabIndex={0}
        onClick={() => {
          // To avoid element to be focused on click
          summaryRef?.current?.blur()
          setIsCollapsed((prev) => {
            onChange && onChange(!prev)
            return !prev
          })
        }}
        onKeyDown={(e) => {
          if (e.code === 'Enter' && document.activeElement?.id === accordionUniqIdRef?.current) {
            setIsCollapsed((prev) => !prev)
          }
        }}
      >
        <Tooltip
          placement="top-start"
          title={
            isCollapsed
              ? collapsedTooltip ?? translate('text_624aa79870f60300a3c4d074')
              : expandedTooltip ?? translate('text_624aa732d6af4e0103d40e61')
          }
        >
          <Button
            tabIndex={-1}
            data-test="open-charge"
            variant="quaternary"
            size="small"
            icon={isCollapsed ? 'chevron-right' : 'chevron-down'}
          />
        </Tooltip>
        {summary}
      </Summary>
      <Details className={clsns({ 'accordion--collapsed': isCollapsed })}>
        <DetailsContent $size={size} $noContentMargin={noContentMargin}>
          {typeof children === 'function' ? children({ isOpen: !isCollapsed }) : children}
        </DetailsContent>
      </Details>
    </Container>
  )
}

const Container = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
  width: 100%;
`

const Summary = styled.div<{ $size?: AccordionSize }>`
  display: flex;
  align-items: center;
  height: ${({ $size }) => ($size === AccordionSizeEnum.medium ? NAV_HEIGHT : 92)}px;
  cursor: pointer;
  border-radius: 12px 12px 0 0;
  padding: ${({ $size }) =>
    $size === AccordionSizeEnum.medium ? theme.spacing(4) : theme.spacing(8)};
  box-sizing: border-box;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }

  :hover {
    background-color: ${theme.palette.grey[100]};
  }

  :active {
    background-color: ${theme.palette.grey[200]};
  }

  :focus-visible {
    outline: none;
  }

  :focus:not(:active) {
    box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
    border-radius: 12px 12px 0 0;
  }

  &.accordion--collapsed {
    border-radius: 12px;

    :focus:not(:active) {
      border-radius: 12px;
    }
  }
`

const Details = styled.div`
  transition: max-height 425ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: 1000px;
  height: auto;
  box-shadow: ${theme.shadows[5]};
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.accordion--collapsed {
    max-height: 0;
  }
`

const DetailsContent = styled.div<{ $size?: AccordionSize; $noContentMargin?: boolean }>`
  padding: ${({ $size, $noContentMargin }) =>
    $noContentMargin
      ? 0
      : $size === AccordionSizeEnum.medium
      ? theme.spacing(4)
      : theme.spacing(8)};
`
