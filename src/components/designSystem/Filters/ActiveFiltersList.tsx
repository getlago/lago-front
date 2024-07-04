import { Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { AvailableFilters } from './types'

interface ActiveFiltersListProps {
  filters: AvailableFilters[]
  hideBorderBottom?: boolean
  noPadding?: boolean
}

const mapFilterToTranslation = (filter: AvailableFilters) => {
  switch (filter) {
    case 'status':
      return 'text_63ac86d797f728a87b2f9fa7'
    case 'invoiceType':
      return 'text_632d68358f1fedc68eed3e5a'
    case 'paymentStatus':
      return 'text_63eba8c65a6c8043feee2a0f'
    case 'currency':
      return 'text_632b4acf0c41206cbcb8c324'
    case 'issuingDate':
      return 'text_6419c64eace749372fc72b39'
    case 'customerExternalId':
      return 'text_65201c5a175a4b0238abf29a'
    case 'paymentDisputeLost':
      return 'TODO: key for dispute'
    case 'paymentOverdue':
      return 'text_666c5b12fea4aa1e1b26bf55'
    default:
      return filter
  }
}

export const ActiveFiltersList = ({ filters, ...props }: ActiveFiltersListProps) => {
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()

  const activeFilters = useMemo(() => {
    const setFilters = Object.fromEntries(searchParams.entries())

    const filtersToDisplay = Object.entries(setFilters).reduce(
      (acc, cur) => {
        const [key, value] = cur as [AvailableFilters, string]

        if (!filters.includes(key)) {
          return acc
        }

        return [
          ...acc,
          {
            label: translate(mapFilterToTranslation(key)),
            value: `${value.charAt(0).toUpperCase()}${value.slice(1)}`,
          },
        ]
      },
      [] as Record<string, string>[],
    )

    return filtersToDisplay

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchParams])

  if (!activeFilters.length) {
    return null
  }

  return (
    <Stack direction="row" alignItems="center" gap={3} {...props}>
      {activeFilters.map(({ label, value }, index) => (
        <ActiveFilterChip key={`active-filter-${index}`}>
          <Typography variant="captionHl" color="grey600">
            {translate(label)}: {value}
          </Typography>
        </ActiveFilterChip>
      ))}
    </Stack>
  )
}

const ActiveFilterChip = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
  background-color: ${theme.palette.grey[100]};
  border-radius: 100px;
  padding: 0 ${theme.spacing(3)};
  box-sizing: border-box;
`
