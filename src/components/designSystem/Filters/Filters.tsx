import { useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { InvoiceListStatusEnum } from '~/components/invoices/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { ActiveFiltersList } from './ActiveFiltersList'
import { FiltersPanelPoper } from './FiltersPanelPoper'
import { AvailableFilters } from './types'

import { Button } from '../Button'

interface FiltersProps {
  filters: AvailableFilters[]
  hideBorderBottom?: boolean
  noPadding?: boolean
}

export const Filters = ({ filters, hideBorderBottom, noPadding, ...props }: FiltersProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  return (
    <FiltersContainer $hideBorderBottom={hideBorderBottom} $noPadding={noPadding} {...props}>
      <FiltersPanelPoper filters={filters} />
      <ActiveFiltersList filters={filters} />
      <Button variant="quaternary" onClick={() => navigate({ search: '' })}>
        {translate('TODO: Reset filters')}
      </Button>
    </FiltersContainer>
  )
}

const FiltersContainer = styled.div<{ $hideBorderBottom?: boolean; $noPadding?: boolean }>`
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
