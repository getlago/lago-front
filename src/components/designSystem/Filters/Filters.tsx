import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { ActiveFiltersList } from './ActiveFiltersList'
import { FiltersPanelPoper } from './FiltersPanelPoper'
import { AvailableFiltersEnum } from './types'

interface FiltersProps {
  filters: AvailableFiltersEnum[]
  hideBorderBottom?: boolean
  noPadding?: boolean
}

export const Filters = ({ filters, hideBorderBottom, noPadding, ...props }: FiltersProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()

  return (
    <FiltersContainer $hideBorderBottom={hideBorderBottom} $noPadding={noPadding} {...props}>
      <FiltersPanelPoper filters={filters} />
      <ActiveFiltersList filters={filters} />

      {searchParams.size > 0 && (
        <Button variant="quaternary" size="small" onClick={() => navigate({ search: '' })}>
          {translate('text_66ab4886cc65a6006ee7258c')}
        </Button>
      )}
    </FiltersContainer>
  )
}

const FiltersContainer = styled.div<{ $hideBorderBottom?: boolean; $noPadding?: boolean }>`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
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
