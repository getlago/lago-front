import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { InvoiceStatusQuickFilter } from './InvoiceStatusQuickFilter'
import { AvailableQuickFilters } from './types'

interface QuickFiltersProps {
  type: AvailableQuickFilters
  hideBorderBottom?: boolean
  noPadding?: boolean
}

export const QuickFilters = ({
  hideBorderBottom,
  noPadding,
  type,
  ...props
}: QuickFiltersProps) => {
  return (
    <QuickFiltersContainer $hideBorderBottom={hideBorderBottom} $noPadding={noPadding} {...props}>
      {type === AvailableQuickFilters.InvoiceStatus ? <InvoiceStatusQuickFilter /> : null}
    </QuickFiltersContainer>
  )
}

const QuickFiltersContainer = styled.div<{ $hideBorderBottom?: boolean; $noPadding?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  overflow-y: scroll;
  box-sizing: border-box;

  ${({ $noPadding }) =>
    !$noPadding &&
    css`
      padding: ${theme.spacing(3)} ${theme.spacing(12)};
    `}

  ${({ $hideBorderBottom }) =>
    !$hideBorderBottom &&
    css`
      box-shadow: ${theme.shadows[7]};
    `}

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(4)};
  }
`
