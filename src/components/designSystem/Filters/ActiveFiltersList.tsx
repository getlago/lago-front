import { Typography } from '@mui/material'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { AvailableFiltersEnum, mapFilterToTranslationKey } from './types'
import { formatActiveFilterValueDisplay } from './utils'

interface ActiveFiltersListProps {
  filters: AvailableFiltersEnum[]
  hideBorderBottom?: boolean
  noPadding?: boolean
}

export const ActiveFiltersList = ({ filters }: ActiveFiltersListProps) => {
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()

  const activeFilters = useMemo(() => {
    const setFilters = Object.fromEntries(searchParams.entries())

    const filtersToDisplay = Object.entries(setFilters).reduce(
      (acc, cur) => {
        const [key, value] = cur as [AvailableFiltersEnum, string]

        if (!filters.includes(key)) {
          return acc
        }

        return [
          ...acc,
          {
            label: translate(mapFilterToTranslationKey(key)),
            value: formatActiveFilterValueDisplay(key, value),
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
    <>
      {activeFilters.map(({ label, value }, index) => (
        <ActiveFilterChip key={`active-filter-${index}`}>
          <Typography variant="captionHl" color="grey600">
            {translate(label)}: {value}
          </Typography>
        </ActiveFilterChip>
      ))}
    </>
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
